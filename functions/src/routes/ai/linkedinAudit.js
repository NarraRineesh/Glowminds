import { Router } from "express";
import { requireFeature } from "../../middleware/requireFeature.js";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

const router = Router();

router.post(
  "/linkedin-audit",
  requireAuth,
  requireFeature("linkedinAudit"),
  async (req, res, next) => {
    try {
      const {
        about = "",
        experience = "",
        headline = "",
        profile = null,
      } = req.body || {};

      const aboutText = String(about || "").trim();
      const experienceText = String(experience || "").trim();
      const headlineText = String(headline || "").trim();

      if (aboutText.length + experienceText.length + headlineText.length < 40) {
        throw new ApiError(
          "invalid-argument",
          "Paste your LinkedIn About and Experience (at least ~40 characters).",
        );
      }

      const prompt = `You are a LinkedIn profile coach for students and early-career professionals in India.
Audit the pasted LinkedIn content and return actionable checklist + rewrite suggestions.

Headline: ${headlineText || "(missing)"}
About:
${aboutText || "(missing)"}

Experience:
${experienceText || "(missing)"}

${profile ? `Glowminds profile context (optional):\n${JSON.stringify(profile).slice(0, 4000)}\n` : ""}

Return ONLY valid JSON:
{
  "score": <0-100 integer>,
  "completedIds": ["string ids of checklist items already strong"],
  "checklist": [
    { "id": "string-kebab", "title": string, "done": boolean, "tip": string }
  ],
  "rewrites": [
    { "section": "headline"|"about"|"experience", "title": string, "suggestion": string }
  ],
  "summary": "2-3 sentence overall assessment"
}

Rules:
- 6-10 checklist items covering headline, about, experience bullets, keywords, CTA, skills, visibility
- Mark done=true only when that area is already solid
- Provide 2-4 concrete rewrites the user can paste
- Return ONLY JSON`;

      const { text } = await completionTask("linkedin-audit", prompt, {
        uid: req.user?.uid,
      });
      const audit = JSON.parse(stripJsonFences(text));
      const score = Math.max(0, Math.min(100, Math.round(Number(audit.score) || 0)));
      const checklist = Array.isArray(audit.checklist) ? audit.checklist.slice(0, 12) : [];
      const rewrites = Array.isArray(audit.rewrites) ? audit.rewrites.slice(0, 6) : [];
      const completedIds = Array.isArray(audit.completedIds)
        ? audit.completedIds.map(String)
        : checklist.filter((c) => c.done).map((c) => String(c.id));

      res.json(
        await withCreditDebit(req, {
          score,
          completedIds,
          checklist,
          rewrites,
          summary: String(audit.summary || "").trim(),
          lastReviewedAt: new Date().toISOString(),
        }),
      );
    } catch (err) {
      if (err instanceof SyntaxError) {
        return next(new ApiError("internal", "Could not parse AI audit. Please try again."));
      }
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

export default router;
