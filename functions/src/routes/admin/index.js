import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/errors.js";
import {
  adminAdjustCredits,
  adminGrantPro,
  adminRevokePro,
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
  getJobModeration,
  updateJobModeration,
} from "../../services/jobModeration.js";
import { searchBoardJobs } from "../../services/jobSearch.js";

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
  "/jobs",
  asyncHandler(async (req, res) => {
    const search = String(req.query.q || "").trim();
    const board = await searchBoardJobs({
      search,
      page: 1,
      pageSize: Math.min(30, Number(req.query.limit) || 20),
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

export default router;
