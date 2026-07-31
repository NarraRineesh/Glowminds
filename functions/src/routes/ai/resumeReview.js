import { Router } from "express";
import { requireFeature } from "../../middleware/requireFeature.js";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

const router = Router();

function normalizeAnalysis(raw) {
  const overallScore = Math.max(0, Math.min(100, Math.round(Number(raw.overallScore) || 0)));
  const scorecard = Array.isArray(raw.scorecard)
    ? raw.scorecard
        .slice(0, 8)
        .map((d) => ({
          dimension: String(d.dimension || "").trim() || "General",
          score: Math.max(0, Math.min(100, Math.round(Number(d.score) || 0))),
          rationale: String(d.rationale || "").trim() || "No rationale provided.",
        }))
        .filter((d) => d.dimension)
    : [];
  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions.slice(0, 10).map((s) => ({
        title: String(s.title || "").trim() || "Suggestion",
        impact: ["high", "medium", "low"].includes(s.impact) ? s.impact : "medium",
        why: String(s.why || "").trim() || "",
        exampleRewrite: s.exampleRewrite != null ? String(s.exampleRewrite) : null,
        copyPrompt: String(s.copyPrompt || s.why || "").trim() || "Improve this section of the resume.",
      }))
    : [];
  const strengths = Array.isArray(raw.strengths)
    ? raw.strengths.map((s) => String(s).trim()).filter(Boolean).slice(0, 10)
    : [];

  if (!scorecard.length) {
    throw new ApiError("internal", "Analysis response was incomplete. Please try again.");
  }

  return { overallScore, scorecard, suggestions, strengths };
}

router.post(
  "/resume-review",
  requireAuth,
  requireFeature("resumeReview"),
  async (req, res, next) => {
    try {
      const { resume = {}, jobDescription = "", targetJob = null } = req.body || {};
      if (!resume || typeof resume !== "object" || !Object.keys(resume).length) {
        throw new ApiError("invalid-argument", "Resume data is required");
      }

      const targetBits = targetJob && typeof targetJob === "object"
        ? [
            targetJob.title && `Title: ${targetJob.title}`,
            targetJob.company && `Company: ${targetJob.company}`,
            (targetJob.description || targetJob.desc) && String(targetJob.description || targetJob.desc).slice(0, 4000),
          ].filter(Boolean).join("\n")
        : "";
      const jd = String(jobDescription || targetBits || "").trim().slice(0, 6000);
      const compact = {
        basics: resume.basics || null,
        summary: resume.summary || null,
        sections: resume.sections || null,
        customSections: resume.customSections || null,
      };

      const prompt = `You are an ATS and recruiter expert for the Indian job market.
Analyze this resume JSON for ATS readiness, clarity, impact, and keyword coverage.
${jd ? `\nTarget job description (optional):\n${jd}\n` : ""}

Resume JSON:
${JSON.stringify(compact)}

Return ONLY valid JSON matching:
{
  "overallScore": <0-100 integer>,
  "scorecard": [
    { "dimension": string, "score": <0-100>, "rationale": string }
  ],
  "suggestions": [
    {
      "title": string,
      "impact": "high"|"medium"|"low",
      "why": string,
      "exampleRewrite": string|null,
      "copyPrompt": string
    }
  ],
  "strengths": [string]
}

Rules:
- Include 4-6 scorecard dimensions (e.g. ATS Formatting, Keywords, Experience Impact, Clarity, Skills Coverage)
- Max 8 suggestions, prioritize high impact
- Be specific and actionable; prefer quantified bullets
- scores: 85+ excellent, 70-84 strong, 55-69 good, below needs work
- Return ONLY JSON`;

      const { text } = await completionTask("resume-review", prompt, {
        uid: req.user?.uid,
      });
      const parsed = JSON.parse(stripJsonFences(text));
      const analysis = normalizeAnalysis(parsed);
      res.json(
        await withCreditDebit(req, {
          ...analysis,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch (err) {
      if (err instanceof SyntaxError) {
        return next(new ApiError("internal", "Could not parse AI analysis. Please try again."));
      }
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

export default router;
