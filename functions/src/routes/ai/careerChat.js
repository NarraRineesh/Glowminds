import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireCredits } from "../../middleware/requireCredits.js";
import { requirePro } from "../../middleware/requirePro.js";
import { ApiError } from "../../middleware/errors.js";
import { chatTask } from "../../services/aiClient.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

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
- Use bullet points (\u2022) for lists
- Use \u2192 for sub-items
- Keep responses concise but actionable (200-400 words max)
- Include specific examples, numbers, or templates when possible
- Be encouraging but honest
- When giving advice, tailor it for the Indian job market (LPA salaries, popular companies, etc.)
- If the user shares their background, personalize your advice
- When CANDIDATE CONTEXT or ACTIVE JOB is provided, ground advice in that data — never invent employers or metrics`;

const MAX_HISTORY = 12;

function buildContextBlock(context) {
  if (!context || typeof context !== "object") return "";
  const parts = [];
  const dig = context.profileDigest;
  if (dig && typeof dig === "object") {
    parts.push(`CANDIDATE CONTEXT:
Headline: ${dig.headline || "N/A"}
Career level: ${dig.careerLevel || "N/A"}
Skills: ${Array.isArray(dig.skills) ? dig.skills.slice(0, 20).join(", ") : "N/A"}
Expected CTC: ${dig.expectedCTC || "N/A"}
Summary: ${String(dig.summary || "").slice(0, 400)}`);
  }
  if (context.jobTitle || context.company || context.jobId) {
    parts.push(`ACTIVE JOB:
Id: ${context.jobId || "N/A"}
Title: ${context.jobTitle || "N/A"}
Company: ${context.company || "N/A"}
Notes: ${String(context.jobNotes || "").slice(0, 600)}`);
  }
  if (context.coachTopics) {
    parts.push(`FOCUS TOPICS FROM LAST INTERVIEW:\n${String(context.coachTopics).slice(0, 500)}`);
  }
  return parts.length ? `\n\n${parts.join("\n\n")}` : "";
}

const router = Router();

router.post("/career-chat", requireAuth, requirePro(), requireCredits("careerChat"), async (req, res, next) => {
  try {
    const { message, history = [], context = null } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new ApiError("invalid-argument", "Message is required");
    }

    const trimmedHistory = Array.isArray(history)
      ? history.slice(-MAX_HISTORY).map((h) => ({
          role: h.role === "user" ? "user" : "model",
          text: String(h.text || "").slice(0, 4000),
        }))
      : [];

    const system = CAREER_SYSTEM_PROMPT + buildContextBlock(context);

    const { text } = await chatTask("career-chat", {
      system,
      history: trimmedHistory,
      userMessage: message.trim().slice(0, 4000),
      uid: req.user?.uid,
    });
    if (!text) throw new ApiError("internal", "Empty response from AI");

    res.json(await withCreditDebit(req, { reply: text }));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
