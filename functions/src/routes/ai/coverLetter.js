import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireCredits } from "../../middleware/requireCredits.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";

const router = Router();

router.post("/cover-letter", requireAuth, requireCredits("coverLetter"), async (req, res, next) => {
  try {
    const { profile, jobTitle, company, jobDescription } = req.body || {};
    if (!profile || !jobTitle || !company) {
      throw new ApiError(
        "invalid-argument",
        "Profile, job title, and company are required",
      );
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
- Do NOT use placeholder brackets like [Your Name] - use the actual candidate data
- Return ONLY the cover letter text, no subject line or metadata`;

    const { text } = await completionTask("cover-letter", prompt, {
      uid: req.user?.uid,
    });
    res.json({ coverLetter: String(text).trim() });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
