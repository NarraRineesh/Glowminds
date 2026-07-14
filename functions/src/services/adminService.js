/**
 * Admin aggregation helpers — overview KPIs, user lookup, Pro ops.
 */

import { admin, getAuth, getFirestore } from "../config/firebase.js";
import { PRO_TIER, hasProAccess } from "../constants/plans.js";
import { ApiError } from "../middleware/errors.js";
import {
  adminAdjustCredits,
  grantProCredits,
} from "./creditService.js";
import { getPricingConfig } from "./pricingConfig.js";
import {
  creditLedgerCol,
  readCredits,
  readEntitlements,
  readSubscription,
  subscriptionRef,
  userCreditsRef,
  userDocRef,
} from "./userCollections.js";

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function daysAgoKey(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return dayKey(d);
}

export async function getAdminOverview() {
  const db = getFirestore();

  // One parallel wave — no sequential follow-up queries.
  const [usersCountSnap, activeProSnap, statsToday, stats30, proSnap] =
    await Promise.all([
      db.collection("users").count().get().catch(() => null),
      db
        .collection("subscriptions")
        .where("status", "==", "active")
        .where("tier", "==", PRO_TIER)
        .count()
        .get()
        .catch(() => null),
      db.collection("adminDailyStats").doc(dayKey()).get(),
      db
        .collection("adminDailyStats")
        .where("date", ">=", daysAgoKey(29))
        .get()
        .catch(() => null),
      db
        .collection("subscriptions")
        .where("status", "==", "active")
        .where("tier", "==", PRO_TIER)
        .select(
          "totalPaidPaise",
          "currentPlanAmountPaise",
          "plan",
          "currentPlanId",
        )
        .limit(500)
        .get()
        .catch(() => null),
    ]);

  const today = statsToday.exists ? statsToday.data() : {};
  let tokens30d = 0;
  let cost30d = 0;
  let calls30d = 0;
  const dayCosts = [];

  if (stats30?.docs) {
    for (const doc of stats30.docs) {
      const d = doc.data() || {};
      tokens30d += d.totalTokens || 0;
      cost30d += d.estimatedCostUsd || 0;
      calls30d += d.calls || 0;
      dayCosts.push(Number(d.estimatedCostUsd) || 0);
    }
  }

  let mrrEstimatePaise = 0;
  let totalPaidPaise = 0;
  if (proSnap?.docs) {
    for (const doc of proSnap.docs) {
      const s = doc.data() || {};
      totalPaidPaise += s.totalPaidPaise || 0;
      const amount = s.currentPlanAmountPaise || 0;
      if (s.plan === "yearly" || s.currentPlanId === "yearly") {
        mrrEstimatePaise += Math.round(amount / 12);
      } else {
        mrrEstimatePaise += amount;
      }
    }
  }

  const users = usersCountSnap?.data()?.count ?? null;
  const activePro = activeProSnap?.data()?.count ?? null;
  const avgDailyCostUsd =
    dayCosts.length > 0
      ? Math.round((dayCosts.reduce((a, b) => a + b, 0) / dayCosts.length) * 1_000_000) / 1_000_000
      : 0;
  const todayCost = Number(today.estimatedCostUsd) || 0;
  const costSpike =
    avgDailyCostUsd > 0 && todayCost > avgDailyCostUsd * 2.5
      ? {
          alert: true,
          message: `Today’s AI cost ($${todayCost.toFixed(4)}) is >2.5× the 30d daily average ($${avgDailyCostUsd.toFixed(4)}).`,
        }
      : { alert: false, message: null };

  const byTaskRaw = today.byTask && typeof today.byTask === "object" ? today.byTask : {};
  const byTaskToday = Object.entries(byTaskRaw)
    .map(([task, v]) => ({
      task,
      calls: v?.calls || 0,
      totalTokens: v?.totalTokens || 0,
      estimatedCostUsd: v?.estimatedCostUsd || 0,
    }))
    .sort((a, b) => (b.calls || 0) - (a.calls || 0))
    .slice(0, 12);

  return {
    users,
    activePro,
    proConversionRate:
      users && users > 0 && activePro != null
        ? Math.round((activePro / users) * 1000) / 10
        : null,
    mrrEstimatePaise,
    totalPaidPaise,
    today: {
      calls: today.calls || 0,
      totalTokens: today.totalTokens || 0,
      estimatedCostUsd: todayCost,
      creditsBurnedApprox: null,
      byTask: byTaskToday,
    },
    last30Days: {
      calls: calls30d,
      totalTokens: tokens30d,
      estimatedCostUsd: Math.round(cost30d * 1_000_000) / 1_000_000,
      avgDailyCostUsd,
    },
    costSpike,
  };
}

export async function listAdminUsers({ q = "", filter = "all", limit = 40, cursor = null } = {}) {
  const db = getFirestore();
  const pageSize = Math.min(Math.max(Number(limit) || 40, 1), 100);

  // Over-fetch when filtering so a page can still fill after Free/Pro filter.
  const fetchSize =
    filter === "pro" || filter === "free" || q
      ? Math.min(pageSize * 3, 100)
      : pageSize;

  let query = db.collection("users").orderBy("createdAt", "desc").limit(fetchSize);

  if (cursor) {
    const curSnap = await db.collection("users").doc(cursor).get();
    if (curSnap.exists) query = query.startAfter(curSnap);
  }

  const snap = await query.get();
  if (snap.empty) {
    return { users: [], nextCursor: null };
  }

  // Batch-load subscriptions + credits (avoids 2N round-trips).
  const refs = [];
  for (const doc of snap.docs) {
    refs.push(subscriptionRef(doc.id), userCreditsRef(doc.id));
  }
  const got = await db.getAll(...refs);
  const byPath = new Map(got.map((d) => [d.ref.path, d]));

  const qLower = String(q || "").toLowerCase().trim();
  const users = [];

  for (const doc of snap.docs) {
    if (users.length >= pageSize) break;
    const u = doc.data() || {};
    const uid = doc.id;
    if (qLower) {
      const hay = `${u.email || ""} ${u.displayName || ""} ${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      if (!hay.includes(qLower)) continue;
    }

    const subSnap = byPath.get(subscriptionRef(uid).path);
    const creditsSnap = byPath.get(userCreditsRef(uid).path);
    const sub = subSnap?.exists ? subSnap.data() : null;
    const credits = creditsSnap?.exists ? creditsSnap.data() : null;
    const isPro = hasProAccess(sub);
    if (filter === "pro" && !isPro) continue;
    if (filter === "free" && isPro) continue;

    users.push({
      uid,
      email: u.email || null,
      displayName: u.displayName || null,
      photoURL: u.photoURL || null,
      createdAt: u.createdAt || null,
      isPro,
      creditsBalance: credits?.balance ?? null,
      subscriptionStatus: sub?.status || null,
      plan: sub?.plan || sub?.currentPlanId || null,
      endDate: sub?.endDate || null,
      source: sub?.source || null,
      totalPaidPaise: sub?.totalPaidPaise ?? null,
      cancelAtPeriodEnd: !!sub?.cancelAtPeriodEnd,
    });
  }

  return {
    users,
    nextCursor: snap.docs.length === fetchSize ? snap.docs[snap.docs.length - 1].id : null,
  };
}

export async function getAdminUserDetail(uid) {
  if (!uid) throw new ApiError("invalid-argument", "uid required");

  const [userSnap, sub, credits, entitlements, ledgerSnap, authUser] =
    await Promise.all([
      userDocRef(uid).get(),
      readSubscription(uid),
      readCredits(uid),
      readEntitlements(uid),
      creditLedgerCol().where("userId", "==", uid).orderBy("createdAt", "desc").limit(50).get().catch(() => null),
      getAuth().getUser(uid).catch(() => null),
    ]);

  if (!userSnap.exists && !authUser) {
    throw new ApiError("not-found", "User not found");
  }

  const user = userSnap.exists ? userSnap.data() : {};
  const ledger = ledgerSnap
    ? ledgerSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    : [];

  return {
    uid,
    email: user.email || authUser?.email || null,
    displayName: user.displayName || authUser?.displayName || null,
    photoURL: user.photoURL || authUser?.photoURL || null,
    createdAt: user.createdAt || null,
    profile: user.profile || null,
    settings: user.settings || null,
    isPro: hasProAccess(sub),
    isAdmin: authUser?.customClaims?.isAdmin === true,
    subscription: sub,
    credits: credits || null,
    entitlements: entitlements || null,
    ledger,
    auth: authUser
      ? {
          emailVerified: authUser.emailVerified,
          disabled: authUser.disabled,
          providers: (authUser.providerData || []).map((p) => p.providerId),
          lastSignInTime: authUser.metadata?.lastSignInTime || null,
        }
      : null,
  };
}

export async function adminGrantPro(uid, { plan = "yearly", days = null } = {}) {
  if (!uid) throw new ApiError("invalid-argument", "uid required");
  const pricing = await getPricingConfig();
  const planId = plan === "monthly" ? "monthly" : "yearly";
  const durationDays =
    Number(days) > 0
      ? Math.trunc(Number(days))
      : pricing.plans?.[planId]?.durationDays || (planId === "yearly" ? 365 : 30);

  const now = new Date();
  const endDate = new Date(now.getTime() + durationDays * 86400_000);
  const existing = await readSubscription(uid);

  await subscriptionRef(uid).set(
    {
      userId: uid,
      plan: planId,
      tier: PRO_TIER,
      status: "active",
      currentPlanId: planId,
      currentPlanLabel: pricing.plans?.[planId]?.label || `Glowminds Pro ${planId}`,
      currentPlanPeriod: planId === "yearly" ? "/year" : "/month",
      currentPlanAmountPaise: pricing.plans?.[planId]?.amountPaise || 0,
      currency: pricing.currency || "INR",
      currencySymbol: pricing.currencySymbol || "₹",
      startDate: existing?.startDate || now.toISOString(),
      endDate: endDate.toISOString(),
      renewedAt: now.toISOString(),
      provider: "admin",
      source: "admin_grant",
      razorpayPaymentId: existing?.razorpayPaymentId || null,
      createdAt: existing?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await grantProCredits(uid, pricing);
  return getAdminUserDetail(uid);
}

export async function adminRevokePro(uid) {
  if (!uid) throw new ApiError("invalid-argument", "uid required");
  const existing = await readSubscription(uid);
  if (!existing) throw new ApiError("not-found", "No subscription found");

  const now = new Date();
  await subscriptionRef(uid).set(
    {
      status: "cancelled",
      endDate: now.toISOString(),
      cancelledAt: now.toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return getAdminUserDetail(uid);
}

export { adminAdjustCredits };

export async function listSubscriptions({ limit = 40 } = {}) {
  const db = getFirestore();
  const pageSize = Math.min(Math.max(Number(limit) || 40, 1), 100);
  const snap = await db
    .collection("subscriptions")
    .orderBy("updatedAt", "desc")
    .limit(pageSize)
    .get()
    .catch(async () =>
      db.collection("subscriptions").limit(pageSize).get(),
    );

  return {
    subscriptions: snap.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
      isPro: hasProAccess(d.data()),
    })),
  };
}

export async function getTokenUsage({ days = 30 } = {}) {
  const db = getFirestore();
  const n = Math.min(Math.max(Number(days) || 30, 1), 90);
  const snap = await db
    .collection("adminDailyStats")
    .where("date", ">=", daysAgoKey(n - 1))
    .orderBy("date", "asc")
    .get()
    .catch(() => null);

  const daysList = snap
    ? snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          date: data.date || d.id,
          calls: data.calls || 0,
          promptTokens: data.promptTokens || 0,
          completionTokens: data.completionTokens || 0,
          totalTokens: data.totalTokens || 0,
          estimatedCostUsd: data.estimatedCostUsd || 0,
          byTask: data.byTask || {},
          byProvider: data.byProvider || {},
        };
      })
    : [];

  const totals = daysList.reduce(
    (acc, d) => {
      acc.calls += d.calls;
      acc.totalTokens += d.totalTokens;
      acc.estimatedCostUsd += d.estimatedCostUsd;
      return acc;
    },
    { calls: 0, totalTokens: 0, estimatedCostUsd: 0 },
  );
  totals.estimatedCostUsd = Math.round(totals.estimatedCostUsd * 1_000_000) / 1_000_000;

  return { days: daysList, totals };
}

export async function getCreditUsage({ limit = 100 } = {}) {
  const pageSize = Math.min(Math.max(Number(limit) || 100, 1), 300);
  const snap = await creditLedgerCol()
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .get()
    .catch(() => null);

  const byFeature = {};
  const entries = [];
  if (snap) {
    for (const doc of snap.docs) {
      const e = { id: doc.id, ...doc.data() };
      entries.push(e);
      const key = e.featureKey || "unknown";
      if (!byFeature[key]) byFeature[key] = { featureKey: key, debits: 0, credits: 0, net: 0 };
      if (e.amount < 0) byFeature[key].debits += Math.abs(e.amount);
      else byFeature[key].credits += e.amount;
      byFeature[key].net += e.amount;
    }
  }

  return {
    entries,
    byFeature: Object.values(byFeature).sort((a, b) => b.debits - a.debits),
  };
}

export async function listContactMessages({ limit = 50 } = {}) {
  const db = getFirestore();
  const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const snap = await db
    .collection("contactMessages")
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .get()
    .catch(() => db.collection("contactMessages").limit(pageSize).get());

  return {
    messages: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}
