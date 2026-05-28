// Read-only sync history endpoints.
//
// The legacy bulk-sync endpoint depended on a Python enrich service that is
// no longer deployed. To rebuild the jobs collection, run
// `npm run enrich && npm run push` from the local pipeline against prod
// Firestore. The endpoints below let the admin console keep browsing run
// history and report "no sync running" cleanly.

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { ApiError } from "../../middleware/errors.js";
import { getFirestore } from "../../config/firebase.js";

const router = Router();

router.get("/sync/status", requireAuth, requireAdmin, (_req, res) => {
  res.json({ running: false, activeRun: null, retired: true });
});

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
