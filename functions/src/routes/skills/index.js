import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { getPersonalizedSkillTrends, searchSkills } from "../../services/skillsService.js";
import { loadProfileContext } from "../../services/jobSearch.js";
import { isSupabaseEnabled } from "../../services/supabaseClient.js";

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

export default router;
