import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getEntitlements } from "../../services/creditService.js";
import { ApiError } from "../../middleware/errors.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const entitlements = await getEntitlements(req.user.uid);
    res.json(entitlements);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
