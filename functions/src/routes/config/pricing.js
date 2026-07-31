import { Router } from "express";
import {
  getPricingConfig,
  pricingConfigForPublicApi,
} from "../../services/pricingConfig.js";
import { getFeatureComparison } from "../../services/featureComparisonConfig.js";
import { getPricingFaqs } from "../../services/pricingFaqsConfig.js";

const router = Router();

router.get("/pricing", async (_req, res, next) => {
  try {
    const config = await getPricingConfig();
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json(pricingConfigForPublicApi(config));
  } catch (err) {
    next(err);
  }
});

router.get("/feature-comparison", async (_req, res, next) => {
  try {
    const featureComparison = await getFeatureComparison();
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json({ featureComparison });
  } catch (err) {
    next(err);
  }
});

router.get("/pricing-faqs", async (_req, res, next) => {
  try {
    const pricingFaqs = await getPricingFaqs();
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json(pricingFaqs);
  } catch (err) {
    next(err);
  }
});

export default router;
