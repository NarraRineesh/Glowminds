import { Router } from "express";
import { createHash } from "crypto";
import { requireAuth } from "../../middleware/auth.js";
import { requireCredits } from "../../middleware/requireCredits.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";
import { withCreditDebit } from "../../utils/creditResponse.js";
import { getCachedAiJson, setCachedAiJson } from "../../services/aiResponseCache.js";

const router = Router();

// Derived/tool data must never reach the model: a previous aiReview embedded
// in the payload makes the AI repeat stale findings (e.g. "summary is empty"
// after the user added one), and drafts/audits just bloat tokens.
const EXCLUDED_PROFILE_KEYS = new Set([
  "aiReview",
  "linkedinAudit",
  "coverLetterDrafts",
  "settings",
  "flags",
]);

function sanitizeProfileForReview(profile) {
  const out = {};
  for (const [key, value] of Object.entries(profile)) {
    if (EXCLUDED_PROFILE_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

router.post("/profile-review", requireAuth, requireCredits("profileReview"), async (req, res, next) => {
  try {
    const { profile = {} } = req.body || {};
    if (!profile || Object.keys(profile).length === 0) {
      throw new ApiError("invalid-argument", "Profile data is required");
    }

    const reviewProfile = sanitizeProfileForReview(profile);
    const profileJson = JSON.stringify(reviewProfile, null, 2).slice(0, 20_000);

    // Hash the full sanitized payload — slicing before hashing returned stale
    // cached reviews when edits landed past the cutoff.
    const cacheKey = createHash("sha256").update(profileJson).digest("hex");
    const cached = getCachedAiJson("profile-review", cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const prompt = `You are an expert career coach and recruiter in the Indian tech market. Analyze this candidate's profile and provide detailed enhancement advice.

**Candidate Profile:**
${profileJson}

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
    setCachedAiJson("profile-review", cacheKey, review, 30 * 60 * 1000);
    res.json(await withCreditDebit(req, review));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
