// Tiny endpoint that lets the frontend report a tool usage event for
// non-AI, non-jobs tools (resume builder export, LinkedIn audit completion,
// daily quiz answer, etc.). AI + jobs calls are auto-counted server-side.
//
// We intentionally keep this fire-and-forget shaped: the response is a 204
// regardless of whether the Firestore writes succeed, because dropping a
// metrics tick should never break user flows.

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { ApiError } from "../../middleware/errors.js";
import {
  ALLOWED_CLIENT_TOOLS,
  aggregateAllUsers,
  trackAsync,
} from "../../services/usageTracker.js";

const router = Router();

// Record a tool-use event from the client. AI/jobs routes auto-track on the
// server, so this endpoint is only used for UI-only tools (resume export,
// LinkedIn audit completion, saved-jobs toggle).
router.post("/track", requireAuth, (req, res, next) => {
  try {
    const { tool, count } = req.body || {};

    if (typeof tool !== "string" || !tool.trim()) {
      throw new ApiError("invalid-argument", "tool is required");
    }
    if (!ALLOWED_CLIENT_TOOLS.has(tool)) {
      // Don't echo the tool name back — keeps the allowlist opaque.
      throw new ApiError("invalid-argument", "Unknown tool");
    }

    const n = Number.isFinite(count) ? Math.min(Math.max(Number(count), 1), 50) : 1;
    trackAsync(req.user?.uid, tool, n);

    res.status(204).end();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

// Admin-only: returns the global tool-use counters aggregated across every
// user. Response shape:
//   {
//     tools: { "ai.cover-letter": 12, "ai.career-chat": 31, ... },
//     total: 247,
//     userCount: 312,
//     computedAt: "2026-05-24T06:41:00.000Z",
//     cached: false
//   }
// `?fresh=true` skips the in-memory cache (default TTL ~60s).
router.get("/aggregate", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const fresh = req.query.fresh === "true" || req.query.fresh === "1";
    const result = await aggregateAllUsers({ fresh });
    res.json(result);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
