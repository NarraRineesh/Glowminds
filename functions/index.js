const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const admin = require("firebase-admin");

admin.initializeApp();

const PARSE_PROMPT = `Parse the following resume text and extract structured data as a JSON object with EXACTLY these keys:
{
  "name": "full name",
  "title": "job title or professional headline",
  "email": "email address",
  "phone": "phone number",
  "loc": "location/city",
  "li": "linkedin URL if found",
  "gh": "github URL if found",
  "summary": "professional summary or objective",
  "deg": "degree and branch (e.g. B.Tech Computer Science)",
  "col": "college or university name",
  "yr": "graduation year",
  "cgpa": "CGPA or percentage if mentioned",
  "exp": "all work experience and internships, preserve bullet points",
  "projects": "all projects with descriptions, preserve bullet points",
  "skills": "comma-separated list of all skills",
  "ach": "achievements, certifications, awards, preserve bullet points"
}

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- If a field is not found, use empty string ""
- For exp, projects, ach: preserve original formatting with bullet points
- For skills: combine all skill mentions into one comma-separated string
- Extract as much as possible even from poorly formatted text

Resume text:
---
`;

/**
 * parseResume — callable Cloud Function
 * Accepts { text: string } and returns structured resume JSON
 */
exports.parseResume = onCall(
  { maxInstances: 10 },
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { text } = request.data;
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      throw new HttpsError(
        "invalid-argument",
        "Resume text is too short or missing"
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: PARSE_PROMPT + text + "\n---" }],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
      });

      let responseText = result.response.text().trim();

      // Strip markdown code fences if present
      if (responseText.startsWith("```")) {
        responseText = responseText
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(responseText);

      // Ensure all expected keys exist with string values
      const fields = [
        "name", "title", "email", "phone", "loc", "li", "gh",
        "summary", "deg", "col", "yr", "cgpa",
        "exp", "projects", "skills", "ach",
      ];
      const clean = {};
      for (const k of fields) {
        clean[k] = typeof parsed[k] === "string" ? parsed[k] : "";
      }

      return clean;
    } catch (err) {
      console.error("parseResume error:", err);
      if (err instanceof SyntaxError) {
        throw new HttpsError("internal", "AI returned invalid JSON. Please try again.");
      }
      throw new HttpsError("internal", err.message || "Failed to parse resume");
    }
  }
);

// ────────────────────────────────────────────
// careerChat — AI Career Coach (multi-turn)
// ────────────────────────────────────────────

const CAREER_SYSTEM_PROMPT = `You are an expert AI Career Coach for students and fresh graduates in India.

Your capabilities:
- Resume writing tips (structure, action verbs, ATS optimization, keyword targeting)
- Interview preparation (technical, behavioral, HR rounds, STAR method, mock Q&A)
- Career path guidance (what to learn, trending skills, roadmaps)
- Salary negotiation (scripts, benchmarks, when and how to negotiate)
- Cold outreach (email templates, LinkedIn messages, networking strategies)
- Job search strategy (where to apply, how to stand out, referral tactics)
- Skill gap analysis (based on job descriptions vs current skills)

Formatting rules:
- Use **bold** for key terms and section headers
- Use bullet points (•) for lists
- Use → for sub-items
- Keep responses concise but actionable (200-400 words max)
- Include specific examples, numbers, or templates when possible
- Be encouraging but honest
- When giving advice, tailor it for the Indian job market (LPA salaries, popular companies, etc.)
- If the user shares their background, personalize your advice`;

/**
 * careerChat — callable Cloud Function
 * Accepts { message: string, history: [{role, text}] }
 * Returns { reply: string }
 */
exports.careerChat = onCall(
  { maxInstances: 20 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { message, history = [] } = request.data;
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new HttpsError("invalid-argument", "Message is required");
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Build multi-turn conversation
      const contents = [
        { role: "user", parts: [{ text: CAREER_SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Understood! I'm ready to help as your AI Career Coach. What can I assist you with?" }] },
      ];

      // Append conversation history (last 20 turns max to stay within token limits)
      const recentHistory = history.slice(-20);
      for (const h of recentHistory) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }

      // Append current message
      contents.push({ role: "user", parts: [{ text: message.trim() }] });

      const result = await model.generateContent({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      });

      const reply = result.response.text().trim();
      if (!reply) throw new Error("Empty response from AI");

      return { reply };
    } catch (err) {
      console.error("careerChat error:", err);
      throw new HttpsError("internal", err.message || "AI chat failed");
    }
  }
);

// ────────────────────────────────────────────
// Interview Prep — generate questions + evaluate answers
// ────────────────────────────────────────────

/**
 * generateInterviewQuestions — callable Cloud Function
 * Accepts { role: string, type: "technical"|"behavioral"|"hr"|"mixed", count: number }
 * Returns { questions: [{ id, question, type, difficulty, tips }] }
 */
exports.generateInterviewQuestions = onCall(
  { maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { role = "Software Engineer", type = "mixed", count = 5 } = request.data;
    const safeCount = Math.min(Math.max(parseInt(count) || 5, 1), 10);

    const prompt = `Generate exactly ${safeCount} interview questions for a "${role}" position.
Question type: ${type === "mixed" ? "mix of technical, behavioral, and HR" : type}

Return ONLY valid JSON array with this structure:
[
  {
    "id": 1,
    "question": "the interview question",
    "type": "technical|behavioral|hr",
    "difficulty": "easy|medium|hard",
    "tips": "brief hint on how to approach this question (1-2 sentences)"
  }
]

Rules:
- Questions should be realistic and commonly asked in Indian tech interviews
- For behavioral questions, prefer STAR-method friendly questions
- For technical questions, include conceptual and practical questions
- Vary difficulty across easy, medium, and hard
- Return ONLY valid JSON, no markdown, no explanation`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      });

      let text = result.response.text().trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const questions = JSON.parse(text);
      if (!Array.isArray(questions)) throw new Error("Not an array");

      return { questions: questions.slice(0, safeCount) };
    } catch (err) {
      console.error("generateInterviewQuestions error:", err);
      throw new HttpsError("internal", err.message || "Failed to generate questions");
    }
  }
);

/**
 * evaluateAnswer — callable Cloud Function
 * Accepts { question, answer, questionType, role }
 * Returns { score, feedback, strengths, improvements, starBreakdown, sampleAnswer }
 */
exports.evaluateAnswer = onCall(
  { maxInstances: 15 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { question, answer, questionType = "behavioral", role = "Software Engineer" } = request.data;
    if (!question || !answer || answer.trim().length < 10) {
      throw new HttpsError("invalid-argument", "Question and a meaningful answer are required");
    }

    const prompt = `You are an expert interview coach. Evaluate this interview answer for a "${role}" role.

**Question (${questionType}):** ${question}

**Candidate's Answer:** ${answer}

Return ONLY valid JSON:
{
  "score": <number 1-10>,
  "feedback": "2-3 sentence overall feedback",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  ${questionType === "behavioral" ? `"starBreakdown": {
    "situation": "was the situation clearly described? brief note",
    "task": "was the task/responsibility clear? brief note",
    "action": "were specific actions described? brief note",
    "result": "were measurable results mentioned? brief note"
  },` : ""}
  "sampleAnswer": "a concise ideal answer (100-150 words) that demonstrates best practices"
}

Rules:
- Be constructive and encouraging but honest
- Score 1-3: poor, 4-6: average, 7-8: good, 9-10: excellent
- For behavioral questions, evaluate using STAR method
- For technical questions, evaluate accuracy, depth, and communication
- The sample answer should be realistic for the Indian job market
- Return ONLY valid JSON`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      });

      let text = result.response.text().trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const evaluation = JSON.parse(text);
      return evaluation;
    } catch (err) {
      console.error("evaluateAnswer error:", err);
      throw new HttpsError("internal", err.message || "Failed to evaluate answer");
    }
  }
);

// ────────────────────────────────────────────
// Job Match AI — skill-based matching + gap analysis
// ────────────────────────────────────────────

/**
 * jobMatch — callable Cloud Function
 * Accepts { userSkills: string, userExperience: string, jobTitle: string, jobCompany: string, jobDesc: string, jobTags: string[] }
 * Returns { score, verdict, matchedSkills, missingSkills, recommendations, summary }
 */
exports.jobMatch = onCall(
  { maxInstances: 15 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { userSkills = "", userExperience = "", jobTitle = "", jobCompany = "", jobDesc = "", jobTags = [] } = request.data;

    if (!jobTitle && !jobDesc) {
      throw new HttpsError("invalid-argument", "Job title or description is required");
    }

    const prompt = `You are an AI job-matching expert. Analyze how well this candidate matches the job.

**Candidate Profile:**
- Skills: ${userSkills || "Not specified"}
- Experience: ${userExperience || "Fresher / not specified"}

**Job Details:**
- Title: ${jobTitle}
- Company: ${jobCompany}
- Tags: ${jobTags.join(", ") || "N/A"}
- Description: ${jobDesc.slice(0, 2000)}

Return ONLY valid JSON:
{
  "score": <number 0-100>,
  "verdict": "Strong Match" | "Good Match" | "Moderate Match" | "Weak Match",
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
  "summary": "2-3 sentence assessment of the match and what the candidate should do"
}

Rules:
- Be realistic — score based on actual skill overlap
- matchedSkills: skills the candidate has that the job needs
- missingSkills: skills the job needs that the candidate lacks (max 5)
- recommendations: specific, actionable steps to improve match (max 3)
- Verdicts: 80-100 Strong, 60-79 Good, 40-59 Moderate, 0-39 Weak
- Consider the Indian job market context
- Return ONLY valid JSON`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      });

      let text = result.response.text().trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const analysis = JSON.parse(text);
      return analysis;
    } catch (err) {
      console.error("jobMatch error:", err);
      throw new HttpsError("internal", err.message || "Failed to analyze job match");
    }
  }
);

// ────────────────────────────────────────────
// Profile Enhancement — AI profile review
// ────────────────────────────────────────────

/**
 * profileReview — callable Cloud Function
 * Accepts { profile } — full profile object
 * Returns { overallScore, verdict, strengths, weaknesses, skillSuggestions, tips, summaryDraft }
 */
exports.profileReview = onCall(
  { maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { profile = {} } = request.data;
    if (!profile || Object.keys(profile).length === 0) {
      throw new HttpsError("invalid-argument", "Profile data is required");
    }

    const prompt = `You are an expert career coach and recruiter in the Indian tech market. Analyze this candidate's profile and provide detailed enhancement advice.

**Candidate Profile:**
${JSON.stringify(profile, null, 2)}

Return ONLY valid JSON:
{
  "overallScore": <number 0-100>,
  "verdict": "Excellent" | "Strong" | "Good" | "Needs Work" | "Incomplete",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "skillSuggestions": [
    { "skill": "skill name", "reason": "why this skill would help", "priority": "high" | "medium" | "low" }
  ],
  "tips": [
    { "category": "Resume" | "Skills" | "Experience" | "Education" | "Online Presence" | "Summary", "tip": "specific actionable advice", "impact": "high" | "medium" | "low" }
  ],
  "summaryDraft": "A professionally written 2-3 sentence summary for this candidate's resume/profile"
}

Rules:
- Be realistic and constructive
- strengths: what's already good (max 4)
- weaknesses: what's missing or could improve (max 4)
- skillSuggestions: 3-5 specific skills they should learn based on their role/field
- tips: 4-6 actionable tips across different categories
- summaryDraft: write a polished professional summary they can copy-paste
- Verdicts: 85+ Excellent, 70-84 Strong, 55-69 Good, 35-54 Needs Work, <35 Incomplete
- Consider Indian job market and current tech trends
- Return ONLY valid JSON`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      });

      let text = result.response.text().trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const review = JSON.parse(text);
      return review;
    } catch (err) {
      console.error("profileReview error:", err);
      throw new HttpsError("internal", err.message || "Failed to review profile");
    }
  }
);

// ────────────────────────────────────────────
// Cover Letter Generator
// ────────────────────────────────────────────

exports.generateCoverLetter = onCall(
  { maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login required");
    }

    const { profile, jobTitle, company, jobDescription } = request.data;
    if (!profile || !jobTitle || !company) {
      throw new HttpsError("invalid-argument", "Profile, job title, and company are required");
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new HttpsError("failed-precondition", "AI service not configured");
    }

    const prompt = `You are an expert career advisor. Write a professional, personalized cover letter for a job application.

CANDIDATE PROFILE:
Name: ${profile.name || "N/A"}
Title: ${profile.title || "N/A"}
Skills: ${(profile.skills || []).join(", ") || "N/A"}
Education: ${profile.education || "N/A"}
Experience: ${profile.experience || "N/A"}

JOB DETAILS:
Position: ${jobTitle}
Company: ${company}
Description: ${jobDescription || "Not provided"}

INSTRUCTIONS:
- Write a compelling 3-4 paragraph cover letter
- Highlight relevant skills and experience from the candidate profile
- Show enthusiasm for the specific company and role
- Use a professional but personable tone
- Include a strong opening and call to action
- Keep it concise (250-350 words)
- Do NOT use placeholder brackets like [Your Name] — use the actual candidate data
- Return ONLY the cover letter text, no subject line or metadata`;

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return { coverLetter: text.trim() };
    } catch (err) {
      console.error("generateCoverLetter error:", err);
      throw new HttpsError("internal", err.message || "Failed to generate cover letter");
    }
  }
);

// ────────────────────────────────────────────
// Notifications — seed welcome notifs on user creation
// ────────────────────────────────────────────

const WELCOME_NOTIFS = [
  { icon: "👋", title: "Welcome to Glowminds!", desc: "Your AI-powered career assistant is ready. Start by building your resume or exploring job matches.", color: "var(--color-blu)", type: "welcome" },
  { icon: "📄", title: "Build your resume", desc: "Head to Resume Builder to create a professional resume. Upload an existing one or start from scratch.", color: "var(--color-grn)", type: "tip" },
  { icon: "🎤", title: "Try Mock Interviews", desc: "Practice with AI-powered interview questions and get instant STAR-method feedback.", color: "var(--color-prp)", type: "tip" },
];

exports.onUserCreated = onDocumentCreated("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const firestore = admin.firestore();
  const batch = firestore.batch();

  for (const notif of WELCOME_NOTIFS) {
    const ref = firestore.collection("users").doc(uid).collection("notifications").doc();
    batch.set(ref, {
      ...notif,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    console.log(`Seeded ${WELCOME_NOTIFS.length} welcome notifications for user ${uid}`);
  } catch (err) {
    console.error("Seed notifications error:", err);
  }
});

// ── Razorpay: Create Order ──────────────────────────────────────────
const PLANS = {
  monthly: { amount: 4900, label: "Glowminds Pro Monthly", durationDays: 30 },
  yearly: { amount: 39900, label: "Glowminds Pro Yearly", durationDays: 365 },
};

exports.createOrder = onCall({ maxInstances: 10 }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { plan } = req.data;
  if (!PLANS[plan]) throw new HttpsError("invalid-argument", "Invalid plan");

  const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await rzp.orders.create({
    amount: PLANS[plan].amount,
    currency: "INR",
    receipt: `rcpt_${req.auth.uid}_${Date.now()}`,
    notes: { uid: req.auth.uid, plan },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  };
});

// ── Razorpay: Verify Payment ────────────────────────────────────────
exports.verifyPayment = onCall({ maxInstances: 10 }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { orderId, paymentId, signature } = req.data;

  if (!orderId || !paymentId || !signature) {
    throw new HttpsError("invalid-argument", "Missing payment details");
  }

  // HMAC verification
  const body = orderId + "|" + paymentId;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    throw new HttpsError("permission-denied", "Invalid payment signature");
  }

  // Fetch order to get plan from notes
  const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  const order = await rzp.orders.fetch(orderId);
  const plan = order.notes?.plan || "monthly";
  const planConfig = PLANS[plan] || PLANS.monthly;

  const now = new Date();
  const endDate = new Date(now.getTime() + planConfig.durationDays * 86400000);

  // Write subscription to Firestore
  await admin.firestore().collection("users").doc(req.auth.uid).set(
    {
      subscription: {
        plan,
        status: "active",
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      },
    },
    { merge: true }
  );

  return { success: true, plan, endDate: endDate.toISOString() };
});
