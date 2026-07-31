import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/errors.js";
import {
  adminAdjustCredits,
  adminDeleteUser,
  adminGrantPro,
  adminRevokePro,
  adminSetUserDisabled,
  getAdminOverview,
  getAdminUserDetail,
  getCreditUsage,
  getTokenUsage,
  listAdminUsers,
  listContactMessages,
  listSubscriptions,
} from "../../services/adminService.js";
import {
  getPricingConfig,
  updatePricingConfig,
} from "../../services/pricingConfig.js";
import {
  getFeatureComparison,
  updateFeatureComparison,
} from "../../services/featureComparisonConfig.js";
import {
  getPricingFaqs,
  updatePricingFaqs,
} from "../../services/pricingFaqsConfig.js";
import {
  getJobModeration,
  updateJobModeration,
} from "../../services/jobModeration.js";
import { searchBoardJobs } from "../../services/jobSearch.js";
import {
  createAdminJob,
  deleteAdminJob,
  getAdminJobStats,
} from "../../services/supabaseJobs.js";
import { isSupabaseEnabled } from "../../services/supabaseClient.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    res.json(await getAdminOverview());
  }),
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { q, filter, limit, cursor } = req.query;
    res.json(
      await listAdminUsers({
        q: q || "",
        filter: filter || "all",
        limit: limit ? Number(limit) : 40,
        cursor: cursor || null,
      }),
    );
  }),
);

router.get(
  "/users/:uid",
  asyncHandler(async (req, res) => {
    res.json(await getAdminUserDetail(req.params.uid));
  }),
);

router.post(
  "/users/:uid/grant-pro",
  asyncHandler(async (req, res) => {
    const { plan, days } = req.body || {};
    res.json(await adminGrantPro(req.params.uid, { plan, days }));
  }),
);

router.post(
  "/users/:uid/revoke-pro",
  asyncHandler(async (req, res) => {
    res.json(await adminRevokePro(req.params.uid));
  }),
);

router.post(
  "/users/:uid/adjust-credits",
  asyncHandler(async (req, res) => {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      throw new ApiError("invalid-argument", "amount must be a non-zero number");
    }
    const result = await adminAdjustCredits(
      req.params.uid,
      amount,
      req.body?.note || "",
    );
    res.json({ ok: true, ...result, user: await getAdminUserDetail(req.params.uid) });
  }),
);

router.post(
  "/users/:uid/disable",
  asyncHandler(async (req, res) => {
    const disabled = req.body?.disabled !== false && req.body?.disabled !== "false";
    if (req.params.uid === req.user.uid && disabled) {
      throw new ApiError("failed-precondition", "You cannot disable your own account");
    }
    res.json(await adminSetUserDisabled(req.params.uid, disabled));
  }),
);

router.delete(
  "/users/:uid",
  asyncHandler(async (req, res) => {
    res.json(await adminDeleteUser(req.params.uid, { actorUid: req.user.uid }));
  }),
);

router.get(
  "/subscriptions",
  asyncHandler(async (req, res) => {
    res.json(await listSubscriptions({ limit: req.query.limit }));
  }),
);

router.get(
  "/usage/tokens",
  asyncHandler(async (req, res) => {
    res.json(await getTokenUsage({ days: req.query.days }));
  }),
);

router.get(
  "/usage/credits",
  asyncHandler(async (req, res) => {
    res.json(await getCreditUsage({ limit: req.query.limit }));
  }),
);

router.get(
  "/contact-messages",
  asyncHandler(async (req, res) => {
    res.json(await listContactMessages({ limit: req.query.limit }));
  }),
);

router.get(
  "/config/pricing",
  asyncHandler(async (_req, res) => {
    res.json({ pricing: await getPricingConfig({ fresh: true }) });
  }),
);

router.put(
  "/config/pricing",
  asyncHandler(async (req, res) => {
    const patch = req.body?.pricing || req.body;
    if (!patch || typeof patch !== "object") {
      throw new ApiError("invalid-argument", "pricing patch object required");
    }
    const pricing = await updatePricingConfig(patch, req.user.uid);
    res.json({ pricing });
  }),
);

router.get(
  "/config/feature-comparison",
  asyncHandler(async (_req, res) => {
    res.json({ featureComparison: await getFeatureComparison({ fresh: true }) });
  }),
);

router.put(
  "/config/feature-comparison",
  asyncHandler(async (req, res) => {
    const patch = req.body?.featureComparison || req.body;
    if (!patch || typeof patch !== "object") {
      throw new ApiError("invalid-argument", "featureComparison object required");
    }
    const featureComparison = await updateFeatureComparison(patch, req.user.uid);
    res.json({ featureComparison });
  }),
);

router.get(
  "/config/pricing-faqs",
  asyncHandler(async (_req, res) => {
    res.json({ pricingFaqs: await getPricingFaqs({ fresh: true }) });
  }),
);

router.put(
  "/config/pricing-faqs",
  asyncHandler(async (req, res) => {
    const patch = req.body?.pricingFaqs || req.body;
    if (!patch || typeof patch !== "object") {
      throw new ApiError("invalid-argument", "pricingFaqs object required");
    }
    const pricingFaqs = await updatePricingFaqs(patch, req.user.uid);
    res.json({ pricingFaqs });
  }),
);

router.get(
  "/jobs/stats",
  asyncHandler(async (_req, res) => {
    const moderation = await getJobModeration();
    let total = 0;
    if (isSupabaseEnabled()) {
      const stats = await getAdminJobStats();
      total = stats.total || 0;
    }
    res.json({
      total,
      hidden: (moderation.hiddenIds || []).length,
      boosted: (moderation.boostedIds || []).length,
      updatedAt: moderation.updatedAt || null,
    });
  }),
);

router.get(
  "/jobs",
  asyncHandler(async (req, res) => {
    const search = String(req.query.q || "").trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const cursor = req.query.cursor ? String(req.query.cursor) : null;
    const board = await searchBoardJobs({
      search,
      page,
      pageSize,
      cursor,
      skipModeration: true,
    });
    const moderation = await getJobModeration();
    res.json({
      jobs: board.jobs || [],
      moderation,
      pagination: board.pagination || null,
    });
  }),
);

router.post(
  "/jobs",
  asyncHandler(async (req, res) => {
    if (!isSupabaseEnabled()) {
      throw new ApiError("failed-precondition", "Supabase jobs store is not configured");
    }
    const body = req.body || {};
    const job = await createAdminJob({
      title: body.title,
      company: body.company,
      location: body.location,
      applyUrl: body.applyUrl || body.apply_url,
      employmentType: body.employmentType || body.employment_type || body.type,
      remote: Boolean(body.remote),
    });
    res.status(201).json({ job });
  }),
);

router.get(
  "/jobs/moderation",
  asyncHandler(async (_req, res) => {
    res.json(await getJobModeration());
  }),
);

router.post(
  "/jobs/moderation",
  asyncHandler(async (req, res) => {
    const { hideId, unhideId, boostId, unboostId } = req.body || {};
    if (!hideId && !unhideId && !boostId && !unboostId) {
      throw new ApiError("invalid-argument", "Provide hideId, unhideId, boostId, or unboostId");
    }
    res.json(await updateJobModeration({ hideId, unhideId, boostId, unboostId }));
  }),
);

router.delete(
  "/jobs/:id",
  asyncHandler(async (req, res) => {
    const id = decodeURIComponent(req.params.id || "");
    if (!id) throw new ApiError("invalid-argument", "job id required");
    if (!isSupabaseEnabled()) {
      throw new ApiError("failed-precondition", "Supabase jobs store is not configured");
    }
    await deleteAdminJob(id);
    await updateJobModeration({ unhideId: id, unboostId: id }).catch(() => null);
    res.json({ ok: true, id });
  }),
);

export default router;
