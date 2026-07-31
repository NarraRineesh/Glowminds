import { Router } from "express";
import { requireFeature } from "../../middleware/requireFeature.js";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

const router = Router();

router.post(
  "/salary-negotiate",
  requireAuth,
  requireFeature("salaryNegotiate"),
  async (req, res, next) => {
    try {
      const {
        role = "",
        city = "",
        marketRange = null,
        expectedCtc = "",
        company = "",
        level = "",
      } = req.body || {};

      if (!role || !marketRange || !Array.isArray(marketRange) || marketRange.length < 2) {
        throw new ApiError("invalid-argument", "Role and marketRange [low, high] LPA are required");
      }

      const prompt = `You are a salary negotiation coach for the Indian tech market.

Role: ${role}
Level: ${level || "N/A"}
City: ${city || "N/A"}
Company (optional): ${company || "N/A"}
Market band (LPA): ${marketRange[0]}–${marketRange[1]}
Candidate expected CTC: ${expectedCtc || "Not stated"}

Return ONLY valid JSON:
{
  "anchorLow": <number LPA>,
  "anchorHigh": <number LPA>,
  "targetAsk": <number LPA>,
  "script": "spoken negotiation script (6-10 sentences)",
  "email": "short negotiation email",
  "tips": ["tip1", "tip2", "tip3"]
}

Rules:
- Anchors must sit inside or slightly above the market band when justified
- Do not invent stock packages
- Keep language confident but collaborative
- Return ONLY JSON`;

      const { text } = await completionTask("salary-negotiate", prompt, {
        uid: req.user?.uid,
      });
      const parsed = JSON.parse(stripJsonFences(text));
      const payload = {
        anchorLow: Number(parsed.anchorLow) || marketRange[0],
        anchorHigh: Number(parsed.anchorHigh) || marketRange[1],
        targetAsk: Number(parsed.targetAsk) || (marketRange[0] + marketRange[1]) / 2,
        script: String(parsed.script || "").trim(),
        email: String(parsed.email || "").trim(),
        tips: Array.isArray(parsed.tips)
          ? parsed.tips.map((t) => String(t).trim()).filter(Boolean).slice(0, 5)
          : [],
      };
      if (!payload.script) {
        throw new ApiError("internal", "Incomplete negotiation response");
      }
      res.json(await withCreditDebit(req, payload));
    } catch (err) {
      if (err instanceof SyntaxError) {
        return next(new ApiError("internal", "Could not parse negotiation script. Please try again."));
      }
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

export default router;
