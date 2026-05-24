// Admin overview — one round-trip that fills every KPI on the admin page.
//
// Uses Firestore aggregate `.count()` queries so we never pay to ship the
// matched documents. Result is cached in-memory briefly (30s) so an admin
// dashboard polling once a second doesn't melt your Firestore bill.

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { ApiError } from "../../middleware/errors.js";
import { getFirestore } from "../../config/firebase.js";

const router = Router();

const OVERVIEW_TTL_MS = 30_000;
let cache = null;

async function computeOverview() {
  const db = getFirestore();

  const [
    usersTotal,
    companiesTotal,
    companiesActive,
    jobsActive,
    latestRunSnap,
  ] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("companies").count().get(),
    db.collection("companies").where("active", "==", true).count().get(),
    db.collection("jobs").where("status", "==", "ACTIVE").count().get(),
    db.collection("sync_runs").orderBy("createdAt", "desc").limit(1).get(),
  ]);

  const latestRunDoc = latestRunSnap.docs[0];
  const latestRun = latestRunDoc
    ? (() => {
        const data = latestRunDoc.data() || {};
        return {
          id: latestRunDoc.id,
          provider: data.provider || null,
          startedAt: data.startedAt || null,
          finishedAt: data.finishedAt || null,
          companiesScanned: data.companiesScanned || 0,
          companiesSkipped: data.companiesSkipped || 0,
          jobsAdded: data.jobsAdded || 0,
          jobsUpdated: data.jobsUpdated || 0,
          jobsExpired: data.jobsExpired || 0,
          errors: Array.isArray(data.errors) ? data.errors.length : 0,
        };
      })()
    : null;

  return {
    users: { total: usersTotal.data().count },
    companies: {
      total: companiesTotal.data().count,
      active: companiesActive.data().count,
    },
    jobs: { active: jobsActive.data().count },
    latestRun,
    computedAt: new Date().toISOString(),
  };
}

// Lets `usageTracker.recordUsage` / company writes invalidate this cache
// in a future iteration — exported for that purpose.
export function invalidateOverviewCache() {
  cache = null;
}

router.get("/overview", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const fresh = req.query.fresh === "true" || req.query.fresh === "1";
    if (!fresh && cache && Date.now() - cache.at < OVERVIEW_TTL_MS) {
      return res.json({ ...cache.value, cached: true });
    }
    const value = await computeOverview();
    cache = { at: Date.now(), value };
    res.json({ ...value, cached: false });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
