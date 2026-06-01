import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import {
  getPricingConfig,
  updatePricingConfig,
} from "../../services/pricingConfig.js";

const router = Router();

router.get("/pricing", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const config = await getPricingConfig({ fresh: true });
    res.json({ config });
  } catch (err) {
    next(err);
  }
});

router.patch("/pricing", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const config = await updatePricingConfig(req.body || {}, req.user.uid);
    res.json({ config });
  } catch (err) {
    next(err);
  }
});

export default router;
