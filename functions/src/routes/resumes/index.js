import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { registerResume } from "../../services/creditService.js";

const router = Router();

router.post("/register", requireAuth, async (req, res, next) => {
  try {
    const rawId = req.body?.resumeId;
    const resumeId = rawId == null ? "" : String(rawId).trim();
    // Require a resumeId so registrations are idempotent and can be de-duped.
    // Without it the quota counter would increment on every call.
    if (!resumeId) {
      throw new ApiError("invalid-argument", "resumeId is required");
    }
    const result = await registerResume(req.user.uid, { resumeId });
    if (!result.allowed) {
      throw new ApiError("permission-denied", result.message || "Resume limit reached");
    }
    res.json(result);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
