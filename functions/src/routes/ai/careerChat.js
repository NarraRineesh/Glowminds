import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireCredits } from "../../middleware/requireCredits.js";
import { ApiError } from "../../middleware/errors.js";
import { chatTask } from "../../services/aiClient.js";

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
- If the user shares their background, personalize your advice`;

const router = Router();

router.post("/career-chat", requireAuth, requireCredits("careerChat"), async (req, res, next) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new ApiError("invalid-argument", "Message is required");
    }

    const { text } = await chatTask("career-chat", {
      system: CAREER_SYSTEM_PROMPT,
      history,
      userMessage: message.trim(),
      uid: req.user?.uid,
    });
    if (!text) throw new ApiError("internal", "Empty response from AI");

    res.json({ reply: text });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
