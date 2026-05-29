import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import {
  buildSearchParams,
  countMatchingJobs,
  getJobByDocId,
  loadProfileContext,
  searchAllJobs,
} from "../../services/jobSearch.js";

const COUNT_POOL_SIZE = 2000;
const DEFAULT_PAGE_SIZE = 10;

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

function filtersFromRequest(src = {}) {
  const filters = {};
  if (src.type) filters.type = String(src.type).trim();
  if (src.minMatch != null && src.minMatch !== "") {
    const n = Number(src.minMatch);
    if (Number.isFinite(n)) filters.minMatch = n;
  }
  if (src.newToday === true || src.newToday === "true") filters.newToday = true;
  return filters;
}

function profileLocation(profile) {
  return (
    profile?.preferences?.preferredLocations?.[0] ||
    profile?.personal?.location ||
    "India"
  );
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
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      useProfile = true,
      filters: bodyFilters = {},
      type,
      minMatch,
      newToday,
    } = req.body || {};

    const safePage = clampInt(page, { min: 1, max: 10_000, fallback: 1 });
    const safePageSize = clampInt(pageSize, { min: 1, max: 50, fallback: DEFAULT_PAGE_SIZE });
    const { profile, skillTerms } = await loadProfileContext(uid);

    const params = searchParamsFromRequest(profile, {
      search,
      title,
      skills,
      exp,
    }, useProfile !== false);

    const location = profileLocation(profile);
    const filters = {
      ...filtersFromRequest(bodyFilters),
      ...filtersFromRequest({ type, minMatch, newToday }),
    };

    const { jobs, pagination, sources, partialErrors } = await searchAllJobs({
      ...params,
      location,
      category,
      page: safePage,
      pageSize: safePageSize,
      filters,
      explicitSearch: params.explicitSearch,
    });

    res.json({
      jobs,
      pagination,
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

    const location = profileLocation(profile);

    const { jobs, sources, partialErrors } = await searchAllJobs({
      ...params,
      location,
      category,
      page: 1,
      pageSize: limit,
      poolSize: 120,
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

    const location = profileLocation(profile);

    const category = String(req.query.category || "").trim();
    const filters = filtersFromRequest({
      type: req.query.type,
      minMatch: req.query.minMatch,
      newToday: req.query.newToday,
    });

    const { count, saturated, partialErrors } = await countMatchingJobs({
      ...params,
      location,
      category,
      poolSize: COUNT_POOL_SIZE,
      filters,
      explicitSearch: params.explicitSearch,
    });

    res.json({
      count,
      saturated,
      queryUsed: formatQueryUsed(params),
      searchParams: params,
      locationUsed: location,
      category: category || null,
      ...(partialErrors.length ? { partialErrors } : {}),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.get("/detail", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const jobId = String(req.query.jobId || "").trim();
    if (!jobId) {
      throw new ApiError("invalid-argument", "jobId is required");
    }

    const { profile } = await loadProfileContext(uid);
    const job = await getJobByDocId(jobId, { profile });
    if (!job) {
      throw new ApiError("not-found", "Job not found");
    }

    res.json({ job });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
