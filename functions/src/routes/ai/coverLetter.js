import { Router } from "express";
import { requireFeature } from "../../middleware/requireFeature.js";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

const router = Router();

router.post("/cover-letter", requireAuth, requireFeature("coverLetter"), async (req, res, next) => {
  try {
    const { profile, jobTitle, company, jobDescription, template, focusSkill, mode } = req.body || {};
    if (!profile || !jobTitle || !company) {
      throw new ApiError(
        "invalid-argument",
        "Profile, job title, and company are required",
      );
    }

    const isColdEmail = String(mode || "").toLowerCase() === "cold_email";

    const toneGuide = {
      concise: "Concise & direct: 3 short paragraphs, engineering-friendly, no fluff.",
      story: "Story-driven: open with a hook about building/shipping, then proof, then CTA.",
      referral: "Warm referral tone: mention a mutual connection only if provided in the JD; otherwise imply networking intro style without inventing names.",
      fresher: "Fresher / internship: lead with projects, coursework, and learnability; no fake full-time tenure.",
    }[String(template || "concise")] || "Professional and personable.";

    const prompt = isColdEmail
      ? `You are an expert at cold outreach for Indian tech jobs. Write a short recruiter / hiring-manager cold email (not a formal cover letter).

CANDIDATE:
Name: ${profile.name || "N/A"}
Title: ${profile.title || "N/A"}
Skills: ${(profile.skills || []).join(", ") || "N/A"}
Experience: ${profile.experience || "N/A"}
Projects: ${profile.projects || "N/A"}

TARGET:
Role interest: ${jobTitle}
Company: ${company}
Context / JD notes: ${jobDescription || "Not provided"}
Focus skill: ${focusSkill || "most relevant from profile"}

INSTRUCTIONS:
- Subject line on first line as "Subject: ..."
- 120-180 words body
- Personalized opener (no fake mutual connections)
- One clear ask (15-min chat or referral)
- Do NOT invent metrics
- Return ONLY the email text`
      : `You are an expert career advisor. Write a professional, personalized cover letter for a job application.

CANDIDATE PROFILE:
Name: ${profile.name || "N/A"}
Title: ${profile.title || "N/A"}
Skills: ${(profile.skills || []).join(", ") || "N/A"}
Education: ${profile.education || "N/A"}
Experience: ${profile.experience || "N/A"}
Projects: ${profile.projects || "N/A"}

JOB DETAILS:
Position: ${jobTitle}
Company: ${company}
Job description / notes:
${jobDescription || "Not provided — infer from role and company only."}
Focus skill to emphasize: ${focusSkill || "most relevant from profile"}

STYLE: ${toneGuide}

INSTRUCTIONS:
- Write a compelling 3-4 paragraph cover letter matching the STYLE above
- Ground claims in the candidate profile (and JD keywords when provided)
- Show enthusiasm for the specific company and role
- Include a strong opening and call to action
- Keep it concise (220-350 words)
- Do NOT invent employers, metrics, or degrees not in the profile
- Do NOT use placeholder brackets like [Your Name] or <add outcome>
- Return ONLY the cover letter text, no subject line or metadata`;

    const { text } = await completionTask("cover-letter", prompt, {
      uid: req.user?.uid,
    });
    res.json(await withCreditDebit(req, { coverLetter: String(text).trim(), mode: isColdEmail ? "cold_email" : "cover_letter" }));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
