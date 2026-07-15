import { Router } from "express";
import {
  getPricingConfig,
  pricingConfigForPublicApi,
} from "../../services/pricingConfig.js";

const router = Router();

router.get("/pricing", async (_req, res, next) => {
  try {
    const config = await getPricingConfig();
    // Public, identical for all users — let browsers/CDN reuse it briefly.
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json(pricingConfigForPublicApi(config));
  } catch (err) {
    next(err);
  }
});

export default router;
