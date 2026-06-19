import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireCredits } from "../../middleware/requireCredits.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";

const GRAMMAR_PROMPT = `You are an expert proofreader. Improve the grammar, clarity, and tone of the input text without changing its meaning.
Return ONLY a JSON object with this EXACT shape, no markdown, no commentary:
{
  "corrected": "the fully corrected text",
  "score": 0-100,
  "suggestions": [
    { "original": "...", "replacement": "...", "reason": "...", "severity": "low|medium|high" }
  ]
}
Rules:
- Preserve line breaks and structure of the input.
- "score" is your overall quality score for the original text (0 = unreadable, 100 = perfect).
- "suggestions" is an array of at most 12 specific edits, sorted by severity desc.
- If the input is already perfect, return { "corrected": <input>, "score": 100, "suggestions": [] }.

Input text:
---
`;

const router = Router();

router.post("/grammar", requireAuth, requireCredits("grammar"), async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length < 3) {
      throw new ApiError("invalid-argument", "Text is too short");
    }
    if (text.length > 8000) {
      throw new ApiError(
        "invalid-argument",
        "Text is too long (max 8000 chars)",
      );
    }

    const { text: responseText } = await completionTask(
      "grammar",
      GRAMMAR_PROMPT + text + "\n---",
      { uid: req.user?.uid },
    );
    const parsed = JSON.parse(stripJsonFences(responseText));

    res.json({
      corrected: String(parsed.corrected || text),
      score: Number(parsed.score || 0),
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.slice(0, 12)
        : [],
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
