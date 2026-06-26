import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { registerResume } from "../../services/creditService.js";

const router = Router();

router.post("/register", requireAuth, async (req, res, next) => {
  try {
    const { resumeId } = req.body || {};
    const result = await registerResume(
      req.user.uid,
      { resumeId: resumeId ? String(resumeId) : undefined },
    );
    if (!result.allowed) {
      throw new ApiError("permission-denied", result.message || "Resume limit reached");
    }
    res.json(result);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
