import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireCredits } from "../../middleware/requireCredits.js";
import { ApiError } from "../../middleware/errors.js";
import { getPersonalizedSkillTrends, getSkillGap, searchSkills } from "../../services/skillsService.js";
import {
  generateLearningPath,
  getLearningPath,
  updateLearningPathProgress,
} from "../../services/learningPathService.js";
import { loadProfileContext } from "../../services/jobSearch.js";
import { isSupabaseEnabled } from "../../services/supabaseClient.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

const router = Router();

router.get("/search", requireAuth, async (req, res, next) => {
  try {
    if (!isSupabaseEnabled()) {
      throw new ApiError("failed-precondition", "Skill database is not configured");
    }
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Math.max(1, Number.parseInt(req.query.limit, 10) || 10), 25);
    const skills = await searchSkills(q, limit);
    res.json({ skills, query: q });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.get("/trends", requireAuth, async (req, res, next) => {
  try {
    if (!isSupabaseEnabled()) {
      throw new ApiError("failed-precondition", "Skill database is not configured");
    }
    const limit = Math.min(Math.max(1, Number.parseInt(req.query.limit, 10) || 8), 20);
    const mode = String(req.query.mode || "demand").toLowerCase();
    const { profile } = await loadProfileContext(req.user.uid);
    const { trends, domain } = await getPersonalizedSkillTrends({ profile, limit, mode });
    res.json({ trends, mode, domain });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

/** Free skill-gap analysis vs a target role. */
router.get("/gap", requireAuth, async (req, res, next) => {
  try {
    const role = String(req.query.role || "").trim();
    const { profile } = await loadProfileContext(req.user.uid);
    const gap = await getSkillGap({ profile, targetRole: role });
    res.json(gap);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.get("/learning-path", requireAuth, async (req, res, next) => {
  try {
    const path = await getLearningPath(req.user.uid);
    res.json({ path });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.post(
  "/learning-path",
  requireAuth,
  requireCredits("learningPath"),
  async (req, res, next) => {
    try {
      const {
        targetRole = "",
        focusSkills = [],
        hoursPerWeek = 8,
        level = "beginner",
      } = req.body || {};
      const { profile } = await loadProfileContext(req.user.uid);
      const path = await generateLearningPath(req.user.uid, {
        targetRole,
        focusSkills,
        hoursPerWeek,
        level,
        profile,
      });
      res.json(await withCreditDebit(req, { path }));
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

router.patch("/learning-path/progress", requireAuth, async (req, res, next) => {
  try {
    const { itemId, done } = req.body || {};
    const result = await updateLearningPathProgress(req.user.uid, { itemId, done });
    res.json(result);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
