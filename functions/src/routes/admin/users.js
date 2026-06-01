// Admin user search + temporary Pro grant/revoke (until Razorpay is fully live).

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { ApiError } from "../../middleware/errors.js";
import { admin, getAuth, getFirestore } from "../../config/firebase.js";
import {
  PRO_TIER,
  hasProAccess,
  isActiveProSubscription,
} from "../../constants/plans.js";
import {
  billingPlansFromConfig,
  getPricingConfig,
} from "../../services/pricingConfig.js";

const router = Router();

const SEARCH_MAX = 50;
const UID_RE = /^[a-zA-Z0-9]{20,128}$/;

function parseEndDateIso(endDate) {
  if (!endDate) return null;
  if (typeof endDate?.toDate === "function") return endDate.toDate().toISOString();
  const parsed = new Date(endDate);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function serializeSubscription(sub) {
  if (!sub || typeof sub !== "object") {
    return {
      plan: "free",
      tier: null,
      status: null,
      endDate: null,
      source: null,
    };
  }
  return {
    plan: sub.plan || "free",
    tier: sub.tier || null,
    status: sub.status || null,
    endDate: parseEndDateIso(sub.endDate),
    source: sub.source || null,
  };
}

function serializeUserDoc(doc, { isAdmin = false } = {}) {
  const data = doc.data() || {};
  const sub = serializeSubscription(data.subscription);
  return {
    uid: doc.id,
    email: data.email || null,
    displayName: data.displayName || null,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    isAdmin,
    subscription: sub,
    isPro: hasProAccess(data.subscription, isAdmin),
  };
}

async function fetchUserByUid(uid) {
  const doc = await getFirestore().collection("users").doc(uid).get();
  if (!doc.exists) return null;
  let isAdmin = false;
  try {
    const authUser = await getAuth().getUser(uid);
    isAdmin = authUser.customClaims?.admin === true;
  } catch {
    /* user may not exist in Auth */
  }
  return serializeUserDoc(doc, { isAdmin });
}

async function searchUsers(query, limit) {
  const q = String(query || "").trim();
  if (!q) return [];

  const db = getFirestore();
  const cap = Math.min(Math.max(Number(limit) || 20, 1), SEARCH_MAX);
  const out = [];
  const seen = new Set();

  const push = (user) => {
    if (!user || seen.has(user.uid)) return;
    seen.add(user.uid);
    out.push(user);
  };

  if (UID_RE.test(q)) {
    push(await fetchUserByUid(q));
  }

  if (q.includes("@")) {
    try {
      const authUser = await getAuth().getUserByEmail(q);
      push(await fetchUserByUid(authUser.uid));
    } catch {
      /* not found in Auth */
    }
  }

  const qLower = q.toLowerCase();

  if (out.length < cap && q.includes("@")) {
    const snap = await db
      .collection("users")
      .where("email", ">=", qLower)
      .where("email", "<=", `${qLower}\uf8ff`)
      .limit(cap)
      .get();
    for (const doc of snap.docs) {
      push(await fetchUserByUid(doc.id));
      if (out.length >= cap) break;
    }
  }

  if (out.length < cap) {
    const emailPrefix = qLower.includes("@") ? qLower.split("@")[0] : qLower;
    if (emailPrefix.length >= 2) {
      const snap = await db
        .collection("users")
        .where("email", ">=", emailPrefix)
        .where("email", "<=", `${emailPrefix}\uf8ff`)
        .limit(cap)
        .get();
      for (const doc of snap.docs) {
        push(await fetchUserByUid(doc.id));
        if (out.length >= cap) break;
      }
    }
  }

  if (out.length < cap && q.length >= 2) {
    const namePrefix = q.slice(0, 1).toUpperCase() + q.slice(1).toLowerCase();
    const snap = await db
      .collection("users")
      .where("displayName", ">=", namePrefix)
      .where("displayName", "<=", `${namePrefix}\uf8ff`)
      .limit(cap)
      .get();
    for (const doc of snap.docs) {
      push(await fetchUserByUid(doc.id));
      if (out.length >= cap) break;
    }
  }

  return out.slice(0, cap);
}

router.get("/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit) || 20, SEARCH_MAX);
    if (!q) {
      return res.json({ users: [] });
    }
    const users = await searchUsers(q, limit);
    res.json({ users });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.post("/users/:uid/subscription", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const uid = String(req.params.uid || "").trim();
    if (!UID_RE.test(uid)) {
      throw new ApiError("invalid-argument", "Invalid user id");
    }

    const { action, plan: planInput } = req.body || {};
    if (action !== "grant" && action !== "revoke") {
      throw new ApiError("invalid-argument", 'action must be "grant" or "revoke"');
    }

    const db = getFirestore();
    const ref = db.collection("users").doc(uid);
    const existing = await ref.get();
    if (!existing.exists) {
      throw new ApiError("not-found", "User not found");
    }

    let subscription;
    if (action === "grant") {
      const plan = planInput === "monthly" ? "monthly" : "yearly";
      const pricing = await getPricingConfig();
      const PLANS = billingPlansFromConfig(pricing);
      const planConfig = PLANS[plan] || PLANS.yearly;
      const now = new Date();
      const endDate = new Date(now.getTime() + planConfig.durationDays * 86400_000);
      subscription = {
        plan,
        tier: PRO_TIER,
        status: "active",
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        source: "admin_grant",
        grantedBy: req.user.uid,
        razorpayOrderId: null,
        razorpayPaymentId: null,
      };
    } else {
      subscription = {
        plan: "free",
        tier: null,
        status: null,
        startDate: null,
        endDate: null,
        source: "admin_revoke",
        revokedBy: req.user.uid,
        razorpayOrderId: null,
        razorpayPaymentId: null,
      };
    }

    await ref.set(
      {
        subscription,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    let isAdmin = false;
    try {
      const authUser = await getAuth().getUser(uid);
      isAdmin = authUser.customClaims?.admin === true;
    } catch {
      /* ignore */
    }

    const updated = await ref.get();
    res.json({
      ok: true,
      user: serializeUserDoc(updated, { isAdmin }),
      isPro: hasProAccess(subscription, isAdmin),
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
