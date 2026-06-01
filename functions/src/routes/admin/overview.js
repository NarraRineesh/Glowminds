// Admin overview — one round-trip that fills KPI cards on the admin page.
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

  const [usersTotal, jobsActive] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("jobs").where("status", "==", "ACTIVE").count().get(),
  ]);

  return {
    users: { total: usersTotal.data().count },
    jobs: { active: jobsActive.data().count },
    computedAt: new Date().toISOString(),
  };
}

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
