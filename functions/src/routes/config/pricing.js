import { Router } from "express";
import {
  getPricingConfig,
  pricingConfigForPublicApi,
} from "../../services/pricingConfig.js";

const router = Router();

router.get("/pricing", async (_req, res, next) => {
  try {
    const config = await getPricingConfig();
    res.json(pricingConfigForPublicApi(config));
  } catch (err) {
    next(err);
  }
});

export default router;
