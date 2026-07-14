// Tiny endpoint that lets the frontend report a tool usage event for
// non-AI, non-jobs tools (resume builder export, LinkedIn audit completion,
// saved-jobs toggle, etc.). AI + jobs calls are auto-counted server-side.
//
// We intentionally keep this fire-and-forget shaped: the response is a 204
// regardless of whether the Firestore writes succeed, because dropping a
// metrics tick should never break user flows.

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { usageTrackRateLimit } from "../../middleware/apiRateLimit.js";
import { ApiError } from "../../middleware/errors.js";
import {
  ALLOWED_CLIENT_TOOLS,
  trackAsync,
} from "../../services/usageTracker.js";

const router = Router();

// Record a tool-use event from the client. AI/jobs routes auto-track on the
// server, so this endpoint is only used for UI-only tools (resume export,
// LinkedIn audit completion, saved-jobs toggle).
router.post("/track", requireAuth, usageTrackRateLimit, (req, res, next) => {
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

export default router;
