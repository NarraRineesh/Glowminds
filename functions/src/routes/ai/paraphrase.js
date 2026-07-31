import { Router } from "express";
import { requireFeature } from "../../middleware/requireFeature.js";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

const PARAPHRASE_TONES = [
  "professional",
  "casual",
  "academic",
  "concise",
  "creative",
];

function paraphrasePrompt(text, tone) {
  return `You are an expert writer. Rewrite the following text in 3 distinct ways using a ${tone} tone.
Return ONLY a JSON object: { "variants": ["...", "...", "..."] }
Rules:
- Preserve the meaning of the input.
- Each variant should be noticeably different in phrasing.
- No markdown, no commentary, only the JSON object.

Input text:
---
${text}
---`;
}

const router = Router();

router.post("/paraphrase", requireAuth, requireFeature("paraphrase"), async (req, res, next) => {
  try {
    const { text, tone = "professional" } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length < 3) {
      throw new ApiError("invalid-argument", "Text is too short");
    }
    if (text.length > 4000) {
      throw new ApiError(
        "invalid-argument",
        "Text is too long (max 4000 chars)",
      );
    }
    if (!PARAPHRASE_TONES.includes(tone)) {
      throw new ApiError("invalid-argument", "Invalid tone");
    }

    const { text: responseText } = await completionTask(
      "paraphrase",
      paraphrasePrompt(text, tone),
      { uid: req.user?.uid },
    );
    const parsed = JSON.parse(stripJsonFences(responseText));
    const variants = Array.isArray(parsed.variants)
      ? parsed.variants.slice(0, 3)
      : [];
    res.json(await withCreditDebit(req, { variants, tone }));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
