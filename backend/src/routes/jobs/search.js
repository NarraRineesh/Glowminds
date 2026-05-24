import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import {
  buildJobSearchQuery,
  calculateMatchScore,
  loadProfileContext,
  searchAllJobs,
} from "../../services/jobSearch.js";

const COUNT_POOL_SIZE = 250;

const router = Router();

function clampInt(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

router.post("/search", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const {
      search = "",
      category = "",
      limit = 30,
      useProfile = true,
    } = req.body || {};

    const limitPerSource = clampInt(limit, { min: 10, max: 50, fallback: 30 });
    const { profile, scoringSkills, skillTerms } =
      await loadProfileContext(uid);

    const query =
      useProfile !== false
        ? buildJobSearchQuery(profile, search)
        : String(search || "").trim() || "software developer";

    const location =
      profile?.preferences?.preferredLocations?.[0] ||
      profile?.personal?.location ||
      "India";

    const { jobs, sources, partialErrors } = await searchAllJobs({
      query,
      location,
      category,
      limitPerSource,
    });

    const scored = jobs
      .map((j) => ({ ...j, match: calculateMatchScore(j, scoringSkills) }))
      .sort((a, b) => b.match - a.match);

    res.json({
      jobs: scored,
      queryUsed: query,
      skillTerms,
      locationUsed: location,
      sources,
      ...(partialErrors.length ? { partialErrors } : {}),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

// Returns the top N jobs ranked by match score against the user's profile.
// Defaults to 5; capped at 25. Reads from Firestore `jobs/` only.
router.get("/top-matches", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const limit = clampInt(req.query.limit, { min: 1, max: 25, fallback: 5 });
    const category = String(req.query.category || "").trim();

    const { profile, scoringSkills, skillTerms } =
      await loadProfileContext(uid);

    const query = buildJobSearchQuery(profile, "");
    const location =
      profile?.preferences?.preferredLocations?.[0] ||
      profile?.personal?.location ||
      "India";

    const { jobs, sources, partialErrors } = await searchAllJobs({
      query,
      location,
      category,
      limitPerSource: Math.max(limit * 6, 30),
      poolSize: 120,
    });

    const scored = jobs
      .map((j) => ({ ...j, match: calculateMatchScore(j, scoringSkills) }))
      .sort((a, b) => b.match - a.match)
      .slice(0, limit);

    res.json({
      jobs: scored,
      queryUsed: query,
      skillTerms,
      locationUsed: location,
      sources,
      ...(partialErrors.length ? { partialErrors } : {}),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

// Returns just the count of jobs that match — runs the same Firestore
// query + in-memory filter pipeline as /search (profile-derived query,
// location, category) but skips scoring/sorting and ships only the size.
//
// Query params (mirror /search): `search`, `category`, `useProfile`.
// `count` is capped by COUNT_POOL_SIZE; `saturated: true` means the real
// number could be higher and the caller should treat it as a lower bound.
router.get("/count", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const search = String(req.query.search || "");
    const category = String(req.query.category || "").trim();
    const useProfile = req.query.useProfile !== "false";

    const { profile } = await loadProfileContext(uid);

    const query = useProfile
      ? buildJobSearchQuery(profile, search)
      : String(search || "").trim() || "software developer";

    const location =
      profile?.preferences?.preferredLocations?.[0] ||
      profile?.personal?.location ||
      "India";

    const { jobs, sources, partialErrors } = await searchAllJobs({
      query,
      location,
      category,
      limitPerSource: COUNT_POOL_SIZE,
      poolSize: COUNT_POOL_SIZE,
    });

    res.json({
      count: jobs.length,
      saturated: jobs.length >= COUNT_POOL_SIZE,
      queryUsed: query,
      locationUsed: location,
      category: category || null,
      sources,
      ...(partialErrors.length ? { partialErrors } : {}),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
