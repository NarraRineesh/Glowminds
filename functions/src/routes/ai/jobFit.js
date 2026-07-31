import { Router } from "express";
import { createHash } from "crypto";
import { requireFeature } from "../../middleware/requireFeature.js";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";
import { withCreditDebit } from "../../utils/creditResponse.js";
import { getCachedAiJson, setCachedAiJson } from "../../services/aiResponseCache.js";

const router = Router();

function normalizeFit(raw) {
  const score = Math.max(0, Math.min(100, Math.round(Number(raw.score) || 0)));
  const verdict = ["apply", "stretch", "pass"].includes(String(raw.verdict || "").toLowerCase())
    ? String(raw.verdict).toLowerCase()
    : score >= 70
      ? "apply"
      : score >= 45
        ? "stretch"
        : "pass";
  return {
    score,
    verdict,
    summary: String(raw.summary || "").trim(),
    gaps: Array.isArray(raw.gaps)
      ? raw.gaps.map((g) => String(g).trim()).filter(Boolean).slice(0, 8)
      : [],
    tailoredBullets: Array.isArray(raw.tailoredBullets)
      ? raw.tailoredBullets.map((b) => String(b).trim()).filter(Boolean).slice(0, 6)
      : [],
    talkTrack: String(raw.talkTrack || "").trim(),
    matchedSkills: Array.isArray(raw.matchedSkills)
      ? raw.matchedSkills.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
      : [],
  };
}

router.post(
  "/job-fit",
  requireAuth,
  requireFeature("jobFit"),
  async (req, res, next) => {
    try {
      const { job = {}, profile = null } = req.body || {};
      const title = String(job.title || "").trim();
      const company = String(job.company || "").trim();
      const description = String(job.description || job.desc || "").trim().slice(0, 5000);
      if (!title || !company) {
        throw new ApiError("invalid-argument", "Job title and company are required");
      }
      if (!profile || typeof profile !== "object") {
        throw new ApiError("invalid-argument", "Profile snapshot is required");
      }

      const cacheKey = createHash("sha256")
        .update(
          JSON.stringify({
            title,
            company,
            description: description.slice(0, 1200),
            headline: profile.headline || profile.title || "",
            skills: profile.skills || [],
            experience: String(profile.experience || "").slice(0, 800),
          }),
        )
        .digest("hex");

      const cached = getCachedAiJson("job-fit", cacheKey);
      if (cached) {
        // Same inputs within TTL — return free (no second debit).
        return res.json({ ...cached, cached: true });
      }

      const prompt = `You are a career coach for the Indian tech job market. Score how well this candidate fits the role and produce apply guidance.

JOB:
Title: ${title}
Company: ${company}
Description:
${description || "Not provided"}

CANDIDATE:
Name: ${profile.name || "N/A"}
Headline: ${profile.headline || profile.title || "N/A"}
Skills: ${Array.isArray(profile.skills) ? profile.skills.join(", ") : "N/A"}
Education: ${profile.education || "N/A"}
Experience: ${profile.experience || "N/A"}
Projects: ${profile.projects || "N/A"}

Return ONLY valid JSON:
{
  "score": <0-100 integer>,
  "verdict": "apply" | "stretch" | "pass",
  "summary": "2-3 sentences",
  "gaps": ["must-have gap 1", "..."],
  "tailoredBullets": ["resume bullet tailored to this JD 1", "..."],
  "talkTrack": "30-60 second interview pitch",
  "matchedSkills": ["skill from profile that maps to JD"]
}

Rules:
- Be honest; do not invent experience
- tailoredBullets: 3-5 bullets grounded in candidate data, JD keywords when possible
- verdict: apply >=70, stretch 45-69, pass <45 (adjust if domain mismatch)
- Return ONLY JSON`;

      const { text } = await completionTask("job-fit", prompt, {
        uid: req.user?.uid,
      });
      const parsed = JSON.parse(stripJsonFences(text));
      const fit = normalizeFit(parsed);
      if (!fit.summary) {
        throw new ApiError("internal", "Incomplete job-fit response. Please try again.");
      }
      setCachedAiJson("job-fit", cacheKey, fit, 45 * 60 * 1000);
      res.json(await withCreditDebit(req, fit));
    } catch (err) {
      if (err instanceof SyntaxError) {
        return next(new ApiError("internal", "Could not parse AI job fit. Please try again."));
      }
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

export default router;
