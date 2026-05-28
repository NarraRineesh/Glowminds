import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import {
  buildSearchParams,
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

function searchParamsFromRequest(profile, bodyOrQuery, useProfile) {
  const src = bodyOrQuery || {};
  return buildSearchParams(profile, {
    search: src.search ?? "",
    title: src.title ?? "",
    skills: src.skills,
    exp: src.exp ?? src.experience,
    useProfile,
  });
}

function formatQueryUsed({ title, skills }) {
  const parts = [];
  if (title) parts.push(title);
  if (skills?.length) parts.push(skills.join(", "));
  return parts.join(" · ").trim();
}

router.post("/search", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const {
      search = "",
      title = "",
      skills,
      exp,
      category = "",
      limit = 30,
      useProfile = true,
    } = req.body || {};

    const limitPerSource = clampInt(limit, { min: 10, max: 50, fallback: 30 });
    const { profile, skillTerms } = await loadProfileContext(uid);

    const params = searchParamsFromRequest(profile, {
      search,
      title,
      skills,
      exp,
    }, useProfile !== false);

    const location =
      profile?.preferences?.preferredLocations?.[0] ||
      profile?.personal?.location ||
      "India";

    const { jobs, sources, partialErrors } = await searchAllJobs({
      ...params,
      location,
      category,
      limitPerSource,
    });

    res.json({
      jobs,
      queryUsed: formatQueryUsed(params),
      searchParams: params,
      skillTerms,
      locationUsed: location,
      sources,
      ...(partialErrors.length ? { partialErrors } : {}),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.get("/top-matches", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const limit = clampInt(req.query.limit, { min: 1, max: 25, fallback: 5 });
    const category = String(req.query.category || "").trim();

    const { profile, skillTerms } = await loadProfileContext(uid);

    const params = buildSearchParams(profile, { useProfile: true });

    const location =
      profile?.preferences?.preferredLocations?.[0] ||
      profile?.personal?.location ||
      "India";

    const { jobs, sources, partialErrors } = await searchAllJobs({
      ...params,
      location,
      category,
      limitPerSource: limit,
      poolSize: 120,
    });

    res.json({
      jobs: jobs.slice(0, limit),
      queryUsed: formatQueryUsed(params),
      searchParams: params,
      skillTerms,
      locationUsed: location,
      sources,
      ...(partialErrors.length ? { partialErrors } : {}),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.get("/count", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const useProfile = req.query.useProfile !== "false";

    const { profile } = await loadProfileContext(uid);

    const params = searchParamsFromRequest(
      profile,
      {
        search: req.query.search,
        title: req.query.title,
        skills: req.query.skills,
        exp: req.query.exp ?? req.query.experience,
        category: req.query.category,
      },
      useProfile,
    );

    const location =
      profile?.preferences?.preferredLocations?.[0] ||
      profile?.personal?.location ||
      "India";

    const category = String(req.query.category || "").trim();

    const { jobs, sources, partialErrors } = await searchAllJobs({
      ...params,
      location,
      category,
      limitPerSource: COUNT_POOL_SIZE,
      poolSize: COUNT_POOL_SIZE,
    });

    res.json({
      count: jobs.length,
      saturated: jobs.length >= COUNT_POOL_SIZE,
      queryUsed: formatQueryUsed(params),
      searchParams: params,
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
