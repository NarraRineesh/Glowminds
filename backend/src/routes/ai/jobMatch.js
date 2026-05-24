import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";

const router = Router();

router.post("/job-match", requireAuth, async (req, res, next) => {
  try {
    const {
      userSkills = "",
      userExperience = "",
      jobTitle = "",
      jobCompany = "",
      jobDesc = "",
      jobTags = [],
    } = req.body || {};

    if (!jobTitle && !jobDesc) {
      throw new ApiError(
        "invalid-argument",
        "Job title or description is required",
      );
    }

    const prompt = `You are an AI job-matching expert. Analyze how well this candidate matches the job.

**Candidate Profile:**
- Skills: ${userSkills || "Not specified"}
- Experience: ${userExperience || "Fresher / not specified"}

**Job Details:**
- Title: ${jobTitle}
- Company: ${jobCompany}
- Tags: ${(jobTags || []).join(", ") || "N/A"}
- Description: ${String(jobDesc).slice(0, 2000)}

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
- Be realistic - score based on actual skill overlap
- matchedSkills: skills the candidate has that the job needs
- missingSkills: skills the job needs that the candidate lacks (max 5)
- recommendations: specific, actionable steps to improve match (max 3)
- Verdicts: 80-100 Strong, 60-79 Good, 40-59 Moderate, 0-39 Weak
- Consider the Indian job market context
- Return ONLY valid JSON`;

    const { text } = await completionTask("job-match", prompt, {
      uid: req.user?.uid,
    });
    const analysis = JSON.parse(stripJsonFences(text));
    res.json(analysis);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
