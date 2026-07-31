import { Router } from "express";
import { requireFeature } from "../../middleware/requireFeature.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  CITY_MULTIPLIER,
  NEGOTIATION_TIPS,
  SALARY_LEVELS,
  SALARY_TABLE,
} from "../../constants/salaryData.js";

const router = Router();

const TEASER_ROLE = "Full Stack Engineer";
const TEASER_LEVEL = "junior";
const TEASER_CITY = "Bangalore";

/** Auth-only preview — enough for free users to try filters without full table. */
router.get("/preview", requireAuth, (_req, res) => {
  const base = SALARY_TABLE[TEASER_ROLE]?.[TEASER_LEVEL] || [8, 18];
  const mul = CITY_MULTIPLIER[TEASER_CITY] || 1;
  res.json({
    roles: Object.keys(SALARY_TABLE),
    cities: Object.keys(CITY_MULTIPLIER),
    levels: SALARY_LEVELS,
    tipCount: NEGOTIATION_TIPS.length,
    teaser: {
      role: TEASER_ROLE,
      level: TEASER_LEVEL,
      city: TEASER_CITY,
      range: [
        Math.round(base[0] * mul * 10) / 10,
        Math.round(base[1] * mul * 10) / 10,
      ],
    },
  });
});

router.get("/insights", requireAuth, requireFeature("salaryInsights"), (_req, res) => {
  res.json({
    table: SALARY_TABLE,
    cityMultiplier: CITY_MULTIPLIER,
    levels: SALARY_LEVELS,
    tips: NEGOTIATION_TIPS,
  });
});

export default router;
