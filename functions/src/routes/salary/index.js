import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePro } from "../../middleware/requirePro.js";
import {
  CITY_MULTIPLIER,
  NEGOTIATION_TIPS,
  SALARY_LEVELS,
  SALARY_TABLE,
} from "../../constants/salaryData.js";

const router = Router();

router.get("/insights", requireAuth, requirePro(), (_req, res) => {
  res.json({
    table: SALARY_TABLE,
    cityMultiplier: CITY_MULTIPLIER,
    levels: SALARY_LEVELS,
    tips: NEGOTIATION_TIPS,
  });
});

export default router;
