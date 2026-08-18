import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import {
  buildBoardSearchParams,
  countMatchingJobs,
  getJobByDocId,
  getTopMatchedJobs,
  loadProfileContext,
  searchBoardJobs,
} from "../../services/jobSearch.js";

const DEFAULT_PAGE_SIZE = 10;

const router = Router();

function clampInt(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function filtersFromRequest(src = {}) {
  const filters = {};
  if (src.type) filters.type = String(src.type).trim();
  if (src.minMatch != null && src.minMatch !== "") {
    const n = Number(src.minMatch);
    if (Number.isFinite(n)) filters.minMatch = n;
  }
  if (src.newToday === true || src.newToday === "true") filters.newToday = true;
  const location = src.location || src.country;
  if (location) filters.location = String(location).trim();
  return filters;
}

function profileLocation(profile) {
  return (
    profile?.preferences?.preferredLocations?.[0] ||
    profile?.personal?.location ||
    "India"
  );
}

function formatBoardQueryUsed({ searchStr }) {
  return String(searchStr || "").trim();
}

/** Job board — browse/search with ~10 doc reads + count per page. */
async function handleBoardSearch(req, res, next) {
  try {
    const {
      search = "",
      category = "",
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      cursor = null,
      filters: bodyFilters = {},
      type,
      minMatch,
      newToday,
      location,
      country,
    } = req.body || {};

    const safePage = clampInt(page, { min: 1, max: 10_000, fallback: 1 });
    const safePageSize = clampInt(pageSize, { min: 1, max: 50, fallback: DEFAULT_PAGE_SIZE });
    const filters = {
      ...filtersFromRequest(bodyFilters),
      ...filtersFromRequest({ type, minMatch, newToday, location, country }),
    };

    const { jobs, pagination, sources, partialErrors, meta } = await searchBoardJobs({
      search,
      category,
      page: safePage,
      pageSize: safePageSize,
      cursor: cursor ? String(cursor) : null,
      filters,
    });

    const boardCtx = buildBoardSearchParams({ search, category });

    res.json({
      jobs,
      pagination,
      queryUsed: formatBoardQueryUsed(boardCtx),
      searchParams: boardCtx,
      sources,
      ...(meta ? { meta } : {}),
      ...(partialErrors.length ? { partialErrors } : {}),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
}

router.post("/board", requireAuth, handleBoardSearch);

/** @deprecated Alias — use POST /jobs/board */
router.post("/search", requireAuth, handleBoardSearch);

/** Profile top matches — dual skills + title query, merge, rank, top N. */
router.get("/top-matches", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const limit = clampInt(req.query.limit, { min: 1, max: 25, fallback: 10 });
    const category = String(req.query.category || "").trim();

    const { profile, skillTerms } = await loadProfileContext(uid);
    const location = profileLocation(profile);

    const { jobs, queryUsed, searchParams, sources, partialErrors, meta } = await getTopMatchedJobs({
      profile,
      location,
      category,
      limit,
    });

    res.json({
      jobs,
      queryUsed,
      searchParams,
      skillTerms,
      locationUsed: location,
      sources,
      ...(meta ? { meta } : {}),
      ...(partialErrors.length ? { partialErrors } : {}),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.get("/count", requireAuth, async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    const { count, dbTotal, partialErrors } = await countMatchingJobs({
      search,
      category,
    });

    res.json({
      count,
      dbTotal,
      queryUsed: search,
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
