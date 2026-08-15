import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { getQueryHeaderForUser } from "../../services/queryHeader.js";

const router = Router();

router.get("/query-header", requireAuth, async (req, res, next) => {
  try {
    const header = await getQueryHeaderForUser(req.user.uid);
    res.json(header);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
