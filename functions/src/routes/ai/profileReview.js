import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";

const router = Router();

router.post("/profile-review", requireAuth, async (req, res, next) => {
  try {
    const { profile = {} } = req.body || {};
    if (!profile || Object.keys(profile).length === 0) {
      throw new ApiError("invalid-argument", "Profile data is required");
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

    const { text } = await completionTask("profile-review", prompt, {
      uid: req.user?.uid,
    });
    const review = JSON.parse(stripJsonFences(text));
    res.json(review);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
