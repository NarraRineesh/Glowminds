import { Router } from "express";
import {
  getLandingConfig,
  landingConfigForPublicApi,
} from "../../services/landingConfig.js";

const router = Router();

router.get("/landing", async (_req, res, next) => {
  try {
    const config = await getLandingConfig();
    res.json(landingConfigForPublicApi(config));
  } catch (err) {
    next(err);
  }
});

export default router;
