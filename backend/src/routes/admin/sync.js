// Admin batch sync + sync-runs history.
//
// `POST /sync` kicks off a full or per-provider sync in the background and
// returns 202 immediately. The actual progress + outcome lands in
// `sync_runs/{id}` docs (written by runProvider), which the UI polls via
// `GET /sync-runs`.

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { ApiError } from "../../middleware/errors.js";
import { getFirestore } from "../../config/firebase.js";
import { ATS_IDS } from "../../config/platforms.js";
import { runAllProviders, runProvider } from "../../sync/runSync.js";

const router = Router();

// Lightweight in-process guard so a clicky admin can't fire ten parallel
// "Sync All" runs. Per-pod only — fine for the single-pod setup.
let activeRun = null;

// POST /api/admin/sync — body: { provider?, slugs?, force?, dryRun?, limit?, concurrency? }
router.post("/sync", requireAuth, requireAdmin, (req, res, next) => {
  try {
    if (activeRun) {
      throw new ApiError(
        "failed-precondition",
        `A sync is already running (started ${activeRun.startedAt})`,
      );
    }

    const body = req.body || {};
    if (body.provider && !ATS_IDS.includes(body.provider)) {
      throw new ApiError(
        "invalid-argument",
        `provider must be one of: ${ATS_IDS.join(", ")}`,
      );
    }

    const opts = {
      force: body.force === true,
      dryRun: body.dryRun === true,
      slugs: Array.isArray(body.slugs) ? body.slugs.filter(Boolean) : undefined,
      limit: Number.isFinite(body.limit) ? Number(body.limit) : undefined,
      concurrency: Number.isFinite(body.concurrency)
        ? Number(body.concurrency)
        : undefined,
    };

    const startedAt = new Date().toISOString();
    activeRun = { startedAt, provider: body.provider || "all" };

    // Fire-and-forget. The function writes `sync_runs/{id}` docs along the
    // way (see runProvider); the UI polls those to surface progress.
    const task = body.provider
      ? runProvider(body.provider, opts)
      : runAllProviders(opts);

    Promise.resolve(task)
      .then((summary) => {
        const errors = Array.isArray(summary)
          ? summary.reduce((s, x) => s + (x.errors?.length || 0), 0)
          : summary.errors?.length || 0;
        console.log(`[admin:sync] complete. provider=${body.provider || "all"} errors=${errors}`);
      })
      .catch((err) => {
        console.error("[admin:sync] failed:", err);
      })
      .finally(() => {
        activeRun = null;
      });

    res.status(202).json({
      accepted: true,
      provider: body.provider || "all",
      startedAt,
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

// GET /api/admin/sync/status — quick check used by the UI to know whether to
// disable the "Sync All" button + show a live-running indicator.
router.get("/sync/status", requireAuth, requireAdmin, (_req, res) => {
  res.json({
    running: !!activeRun,
    activeRun: activeRun || null,
  });
});

// GET /api/admin/sync-runs?limit=25&provider=greenhouse
router.get("/sync-runs", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getFirestore();
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 25, 1),
      100,
    );

    let q = db.collection("sync_runs").orderBy("createdAt", "desc").limit(limit);
    if (req.query.provider) {
      q = db
        .collection("sync_runs")
        .where("provider", "==", String(req.query.provider))
        .orderBy("createdAt", "desc")
        .limit(limit);
    }

    const snap = await q.get();
    const runs = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
      };
    });
    res.json({ runs });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
