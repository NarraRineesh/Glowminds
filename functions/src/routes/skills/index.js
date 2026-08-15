import { Router } from "express";
import { requireFeature } from "../../middleware/requireFeature.js";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import {
  getSkillGap,
} from "../../services/skillsService.js";
import {
  activateLearningPath,
  deleteLearningPath,
  generateLearningPath,
  getLearningPath,
  getLearningPathById,
  listLearningPathHistory,
  updateLearningPathProgress,
} from "../../services/learningPathService.js";
import { loadProfileContext } from "../../services/queryHeader.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

const router = Router();

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
  requireFeature("learningPath"),
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

router.get("/learning-path/history", requireAuth, async (req, res, next) => {
  try {
    const paths = await listLearningPathHistory(req.user.uid, { limit: req.query.limit });
    res.json({ paths });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.get("/learning-path/:pathId", requireAuth, async (req, res, next) => {
  try {
    const path = await getLearningPathById(req.user.uid, req.params.pathId);
    res.json({ path });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.post("/learning-path/:pathId/resume", requireAuth, async (req, res, next) => {
  try {
    const path = await activateLearningPath(req.user.uid, req.params.pathId);
    res.json({ path });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.delete("/learning-path/:pathId", requireAuth, async (req, res, next) => {
  try {
    res.json(await deleteLearningPath(req.user.uid, req.params.pathId));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
