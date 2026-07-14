import { admin, getFirestore } from "../config/firebase.js";
import { hasProAccess, isTrustedProSubscription } from "../constants/plans.js";
import { getPricingConfig } from "./pricingConfig.js";
import {
  applicationsCol,
  creditLedgerCol,
  readCredits,
  readEntitlements,
  readSubscription,
  userCreditsRef,
  userEntitlementsRef,
} from "./userCollections.js";
import { ApiError } from "../middleware/errors.js";

function defaultCredits(freeGrant, { withPeriod = false } = {}) {
  const now = new Date();
  return {
    balance: freeGrant,
    lifetimeGranted: freeGrant,
    lifetimeUsed: 0,
    periodStart: withPeriod ? now.toISOString() : null,
    periodEnd: withPeriod ? addCalendarMonth(now).toISOString() : null,
  };
}

function defaultEntitlements() {
  return {
    resumeCount: 0,
    registeredResumeIds: [],
    usage: {},
  };
}

function parseIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function addCalendarMonth(from) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export function getFeatureCreditCost(pricing, featureKey) {
  const cost = pricing?.creditCosts?.[featureKey];
  return Number.isFinite(cost) && cost > 0 ? Math.trunc(cost) : 0;
}

/** Initialize free-tier credits on first access; cap client-seeded inflation. */
export async function grantFreeTierIfNeeded(uid, pricing) {
  const freeGrant = pricing.freeLimits?.aiCredits ?? 10;
  const ref = userCreditsRef(uid);
  const sub = await readSubscription(uid);

  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const entRef = userEntitlementsRef(uid);
    const entSnap = await tx.get(entRef);
    const trustedPro = isTrustedProSubscription(sub);

    if (!snap.exists) {
      const now = new Date();
      tx.set(
        ref,
        {
          userId: uid,
          ...defaultCredits(freeGrant, { withPeriod: true }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      if (!entSnap.exists) {
        tx.set(
          entRef,
          {
            userId: uid,
            ...defaultEntitlements(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      return;
    }

    if (trustedPro) return;

    const credits = snap.data() || {};
    const used = credits.lifetimeUsed ?? 0;
    const granted = credits.lifetimeGranted ?? freeGrant;
    const inflated =
      granted > freeGrant ||
      (typeof credits.balance === "number" && credits.balance > freeGrant) ||
      credits.periodStart != null ||
      credits.periodEnd != null;

    if (!inflated) return;

    const cappedGranted = Math.min(granted, freeGrant);
    tx.set(
      ref,
      {
        userId: uid,
        balance: Math.max(0, cappedGranted - used),
        lifetimeGranted: cappedGranted,
        lifetimeUsed: used,
        periodStart: null,
        periodEnd: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/** Lazy monthly reset for free-tier credits. */
export async function resetFreePeriodIfNeeded(uid, pricing) {
  const freeGrant = pricing.freeLimits?.aiCredits ?? 10;
  const ref = userCreditsRef(uid);
  const now = new Date();
  const sub = await readSubscription(uid);
  if (isTrustedProSubscription(sub) || hasProAccess(sub)) return;

  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const credits = snap.data() || {};
    let periodEnd = parseIso(credits.periodEnd);

    if (!periodEnd) {
      tx.set(
        ref,
        {
          userId: uid,
          periodStart: now.toISOString(),
          periodEnd: addCalendarMonth(now).toISOString(),
          balance: Math.min(
            typeof credits.balance === "number" ? credits.balance : freeGrant,
            freeGrant,
          ),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }

    if (periodEnd > now) return;

    tx.set(
      ref,
      {
        userId: uid,
        balance: freeGrant,
        lifetimeGranted: freeGrant,
        periodStart: now.toISOString(),
        periodEnd: addCalendarMonth(now).toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/** Lazy monthly reset for active Pro subscribers. */
export async function resetProPeriodIfNeeded(uid, pricing) {
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;
  const ref = userCreditsRef(uid);
  const now = new Date();

  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const sub = await readSubscription(uid);
    if (!isTrustedProSubscription(sub)) return;

    const credits = snap.data() || {};
    const periodEnd = parseIso(credits.periodEnd);
    if (periodEnd && periodEnd > now) return;

    const periodStart = now.toISOString();
    const nextEnd = addCalendarMonth(now).toISOString();

    tx.set(
      ref,
      {
        userId: uid,
        balance: proMonthly,
        periodStart,
        periodEnd: nextEnd,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/** Soft-cache application counts to avoid a Firestore count() on every entitlements hit. */
const applicationCountCache = new Map();
const APPLICATION_COUNT_TTL_MS = 60_000;

async function getApplicationCountCached(uid) {
  const hit = applicationCountCache.get(uid);
  if (hit && hit.expiresAt > Date.now()) return hit.count;
  const applicationCountSnap = await applicationsCol().where("userId", "==", uid).count().get();
  const count = applicationCountSnap.data().count || 0;
  applicationCountCache.set(uid, { count, expiresAt: Date.now() + APPLICATION_COUNT_TTL_MS });
  return count;
}

export function invalidateApplicationCountCache(uid) {
  if (uid) applicationCountCache.delete(uid);
  else applicationCountCache.clear();
}

export async function getEntitlements(uid) {
  const pricing = await getPricingConfig();
  await grantFreeTierIfNeeded(uid, pricing);

  const sub = await readSubscription(uid);
  const isPro = hasProAccess(sub);

  if (isPro) {
    await resetProPeriodIfNeeded(uid, pricing);
  } else {
    await resetFreePeriodIfNeeded(uid, pricing);
  }

  const freeGrant = pricing.freeLimits?.aiCredits ?? 10;
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;
  const credits = (await readCredits(uid)) || defaultCredits(freeGrant, { withPeriod: !isPro });
  const entitlements = (await readEntitlements(uid)) || defaultEntitlements();

  const storedBalance = typeof credits.balance === "number" ? credits.balance : (isPro ? proMonthly : freeGrant);

  const applicationCount = await getApplicationCountCached(uid);

  const creditPayload = {
    balance: Math.max(0, storedBalance),
    periodStart: credits.periodStart || null,
    periodEnd: credits.periodEnd || null,
    lifetimeGranted: credits.lifetimeGranted ?? (isPro ? proMonthly : freeGrant),
    lifetimeUsed: credits.lifetimeUsed ?? 0,
  };

  return {
    isPro,
    credits: creditPayload,
    creditCosts: pricing.creditCosts || {},
    freeLimits: pricing.freeLimits,
    proLimits: pricing.proLimits,
    entitlements: {
      resumeCount: entitlements.resumeCount ?? 0,
      applicationCount,
    },
    subscription: sub,
  };
}

export async function ensureCreditsForFeature(uid, featureKey, pricing) {
  const config = pricing || (await getPricingConfig());
  await grantFreeTierIfNeeded(uid, config);

  const sub = await readSubscription(uid);
  const isPro = hasProAccess(sub);
  if (isPro) await resetProPeriodIfNeeded(uid, config);
  else await resetFreePeriodIfNeeded(uid, config);

  const cost = getFeatureCreditCost(config, featureKey);
  if (cost <= 0) return { allowed: true, cost: 0, balance: null };

  const credits = (await readCredits(uid)) || defaultCredits(config.freeLimits?.aiCredits ?? 10);
  const balance = typeof credits.balance === "number" ? credits.balance : 0;

  if (balance < cost) {
    const resetHint = credits.periodEnd
      ? ` Credits reset on ${new Date(credits.periodEnd).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}.`
      : "";
    return {
      allowed: false,
      cost,
      balance,
      message: balance === 0
        ? `You're out of AI credits for this month.${resetHint} Upgrade to Pro for 100 credits/month.`
        : `This uses ${cost} credit${cost === 1 ? "" : "s"} but you only have ${balance} remaining.`,
    };
  }

  return { allowed: true, cost, balance };
}

export async function debitCredits(uid, amount, featureKey = "unknown") {
  const cost = Math.max(0, Math.trunc(Number(amount) || 0));
  if (cost === 0) return { debited: 0, balanceAfter: null, skipped: true };

  const pricing = await getPricingConfig();
  await grantFreeTierIfNeeded(uid, pricing);
  const sub = await readSubscription(uid);
  if (hasProAccess(sub)) await resetProPeriodIfNeeded(uid, pricing);
  else await resetFreePeriodIfNeeded(uid, pricing);

  const ref = userCreditsRef(uid);

  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new ApiError("failed-precondition", "Credits not initialized");
    }

    const credits = snap.data() || {};
    const balance = typeof credits.balance === "number" ? credits.balance : 0;
    if (balance < cost) {
      throw new ApiError("permission-denied", "Insufficient AI credits");
    }

    const balanceAfter = balance - cost;
    const lifetimeUsed = (credits.lifetimeUsed ?? 0) + cost;

    tx.set(
      ref,
      {
        userId: uid,
        balance: balanceAfter,
        lifetimeUsed,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    tx.set(creditLedgerCol().doc(), {
      userId: uid,
      amount: -cost,
      featureKey,
      balanceAfter,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { debited: cost, balanceAfter };
  });
}

export async function finalizeCreditCharge(req) {
  const charge = req?.creditCharge;
  if (!charge || charge.skipped || !charge.cost || !charge.uid) return null;
  return debitCredits(charge.uid, charge.cost, charge.featureKey);
}

/**
 * Admin credit adjustment (positive = grant, negative = debit).
 * Writes a creditLedger entry with featureKey "admin_adjust".
 */
export async function adminAdjustCredits(uid, amount, note = "") {
  const delta = Math.trunc(Number(amount) || 0);
  if (!delta) throw new ApiError("invalid-argument", "Amount must be a non-zero integer");

  const pricing = await getPricingConfig();
  await grantFreeTierIfNeeded(uid, pricing);
  const ref = userCreditsRef(uid);

  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new ApiError("failed-precondition", "Credits not initialized");
    }

    const credits = snap.data() || {};
    const balance = typeof credits.balance === "number" ? credits.balance : 0;
    const balanceAfter = Math.max(0, balance + delta);
    const lifetimeGranted =
      delta > 0
        ? (credits.lifetimeGranted ?? 0) + delta
        : credits.lifetimeGranted ?? 0;
    const lifetimeUsed =
      delta < 0
        ? (credits.lifetimeUsed ?? 0) + Math.abs(delta)
        : credits.lifetimeUsed ?? 0;

    tx.set(
      ref,
      {
        userId: uid,
        balance: balanceAfter,
        lifetimeGranted,
        lifetimeUsed,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    tx.set(creditLedgerCol().doc(), {
      userId: uid,
      amount: delta,
      featureKey: "admin_adjust",
      note: String(note || "").slice(0, 200) || null,
      balanceAfter,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { balanceAfter, delta };
  });
}

/** Pro credit grant on subscription fulfillment. */
export async function grantProCredits(uid, pricing) {
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;
  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = addCalendarMonth(now).toISOString();
  const ref = userCreditsRef(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data() : {};

  await ref.set(
    {
      userId: uid,
      ...existing,
      balance: proMonthly,
      periodStart,
      periodEnd,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function registerResume(uid, { resumeId } = {}) {
  const pricing = await getPricingConfig();
  const sub = await readSubscription(uid);
  if (hasProAccess(sub)) {
    return { allowed: true, resumeCount: 0 };
  }

  const freeLimit = pricing.freeLimits?.resumes ?? 1;
  const ref = userEntitlementsRef(uid);

  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : defaultEntitlements();
    const ids = Array.isArray(data.registeredResumeIds) ? data.registeredResumeIds : [];
    const count = data.resumeCount ?? ids.length;

    if (resumeId && ids.includes(resumeId)) {
      return { allowed: true, resumeCount: count };
    }

    if (count >= freeLimit) {
      return {
        allowed: false,
        resumeCount: count,
        limit: freeLimit,
        message: `Free plan allows ${freeLimit} resume. Upgrade to Pro for unlimited resumes.`,
      };
    }

    const nextIds = resumeId ? [...ids, resumeId] : ids;
    const nextCount = count + 1;

    tx.set(
      ref,
      {
        userId: uid,
        resumeCount: nextCount,
        registeredResumeIds: resumeId ? nextIds : ids,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { allowed: true, resumeCount: nextCount };
  });
}

export async function assertCanCreateApplication(uid) {
  const entitlements = await getEntitlements(uid);
  if (entitlements.isPro) return entitlements;

  const limit = entitlements.freeLimits?.applications ?? 10;
  const count = entitlements.entitlements?.applicationCount ?? 0;

  if (limit >= 0 && count >= limit) {
    throw new ApiError(
      "permission-denied",
      `Free plan allows up to ${limit} tracked applications. Upgrade to Pro for unlimited tracking.`,
    );
  }

  return entitlements;
}
