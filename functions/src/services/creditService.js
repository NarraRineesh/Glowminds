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

function isFreeCreditsInflated(credits, freeGrant) {
  // Only balance/granted over free cap — period fields are normal for monthly resets.
  const granted = credits.lifetimeGranted ?? freeGrant;
  return (
    granted > freeGrant ||
    (typeof credits.balance === "number" && credits.balance > freeGrant)
  );
}

/**
 * Initialize free-tier credits on first access; cap client-seeded inflation.
 * Pass `preloaded` ({ sub, credits, entitlements }) when the caller already
 * read those docs, so the hot path costs zero extra round trips.
 * Returns true when the provisioning transaction actually ran.
 */
export async function grantFreeTierIfNeeded(uid, pricing, preloaded = null) {
  const freeGrant = pricing.freeLimits?.aiCredits ?? 10;
  const ref = userCreditsRef(uid);
  const [sub, existingCredits, existingEnt] = preloaded
    ? [preloaded.sub, preloaded.credits, preloaded.entitlements]
    : await Promise.all([
        readSubscription(uid),
        readCredits(uid),
        readEntitlements(uid),
      ]);
  const trustedPro = isTrustedProSubscription(sub);

  // Hot path: already provisioned and not inflated — skip Firestore transaction.
  if (existingCredits && existingEnt) {
    if (trustedPro) return false;
    if (!isFreeCreditsInflated(existingCredits, freeGrant)) return false;
  }

  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const entRef = userEntitlementsRef(uid);
    const entSnap = await tx.get(entRef);

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
    if (!isFreeCreditsInflated(credits, freeGrant)) return;

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
  return true;
}

/**
 * Lazy monthly reset for free-tier credits.
 * Pass `preloaded.sub` to skip the subscription read when already fetched.
 */
export async function resetFreePeriodIfNeeded(uid, pricing, preloaded = null) {
  const freeGrant = pricing.freeLimits?.aiCredits ?? 10;
  const ref = userCreditsRef(uid);
  const now = new Date();
  const sub = preloaded?.sub !== undefined ? preloaded.sub : await readSubscription(uid);
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

/**
 * Lazy monthly reset for active Pro subscribers.
 * Pass `preloaded.sub` to skip the subscription read when already fetched.
 */
export async function resetProPeriodIfNeeded(uid, pricing, preloaded = null) {
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;
  const ref = userCreditsRef(uid);
  const now = new Date();

  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const sub = preloaded?.sub !== undefined
      ? preloaded.sub
      : await readSubscription(uid);
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

/** Short response cache — dashboard hits entitlements + board together. */
const entitlementsResponseCache = new Map();
const ENTITLEMENTS_RESPONSE_TTL_MS = 20_000;

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

export function invalidateEntitlementsCache(uid) {
  if (uid) entitlementsResponseCache.delete(uid);
  else entitlementsResponseCache.clear();
}

export async function getEntitlements(uid) {
  const cached = entitlementsResponseCache.get(uid);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const pricing = await getPricingConfig();

  const [sub, creditsBefore, entitlementsBefore, applicationCount] = await Promise.all([
    readSubscription(uid),
    readCredits(uid),
    readEntitlements(uid),
    getApplicationCountCached(uid),
  ]);
  const provisioned = await grantFreeTierIfNeeded(uid, pricing, {
    sub,
    credits: creditsBefore,
    entitlements: entitlementsBefore,
  });

  const isPro = hasProAccess(sub);
  const now = new Date();
  const periodEnd = parseIso(creditsBefore?.periodEnd);
  const needsPeriodReset = !periodEnd || periodEnd <= now;

  if (needsPeriodReset && creditsBefore) {
    if (isPro) await resetProPeriodIfNeeded(uid, pricing, { sub });
    else await resetFreePeriodIfNeeded(uid, pricing, { sub });
  }

  const freeGrant = pricing.freeLimits?.aiCredits ?? 10;
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;

  const mutated = provisioned || (needsPeriodReset && Boolean(creditsBefore));
  const [creditsRaw, entitlements] = await Promise.all([
    mutated ? readCredits(uid) : Promise.resolve(creditsBefore),
    provisioned ? readEntitlements(uid) : Promise.resolve(entitlementsBefore),
  ]);
  const credits = creditsRaw || defaultCredits(freeGrant, { withPeriod: !isPro });
  const storedBalance = typeof credits.balance === "number" ? credits.balance : (isPro ? proMonthly : freeGrant);

  const creditPayload = {
    balance: Math.max(0, storedBalance),
    periodStart: credits.periodStart || null,
    periodEnd: credits.periodEnd || null,
    lifetimeGranted: credits.lifetimeGranted ?? (isPro ? proMonthly : freeGrant),
    lifetimeUsed: credits.lifetimeUsed ?? 0,
  };

  const data = {
    isPro,
    credits: creditPayload,
    creditCosts: pricing.creditCosts || {},
    freeLimits: pricing.freeLimits,
    proLimits: pricing.proLimits,
    entitlements: {
      resumeCount: entitlements?.resumeCount ?? 0,
      applicationCount,
    },
    subscription: sub,
  };
  entitlementsResponseCache.set(uid, {
    data,
    expiresAt: Date.now() + ENTITLEMENTS_RESPONSE_TTL_MS,
  });
  return data;
}

export async function ensureCreditsForFeature(uid, featureKey, pricing) {
  const config = pricing || (await getPricingConfig());

  const [sub, creditsBefore, entitlementsBefore] = await Promise.all([
    readSubscription(uid),
    readCredits(uid),
    readEntitlements(uid),
  ]);
  const provisioned = await grantFreeTierIfNeeded(uid, config, {
    sub,
    credits: creditsBefore,
    entitlements: entitlementsBefore,
  });

  // Period resets are rare (monthly); only pay for the transaction when due.
  const isPro = hasProAccess(sub);
  const periodEnd = parseIso(creditsBefore?.periodEnd);
  const needsPeriodReset = Boolean(creditsBefore) && (!periodEnd || periodEnd <= new Date());
  if (needsPeriodReset) {
    if (isPro) await resetProPeriodIfNeeded(uid, config, { sub });
    else await resetFreePeriodIfNeeded(uid, config, { sub });
  }

  const cost = getFeatureCreditCost(config, featureKey);
  if (cost <= 0) return { allowed: true, cost: 0, balance: null };

  const mutated = provisioned || needsPeriodReset;
  const credits =
    (mutated ? await readCredits(uid) : creditsBefore) ||
    defaultCredits(config.freeLimits?.aiCredits ?? 10);
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

export async function debitCredits(uid, amount, featureKey = "unknown", { skipProvision = false } = {}) {
  const cost = Math.max(0, Math.trunc(Number(amount) || 0));
  if (cost === 0) return { debited: 0, balanceAfter: null, skipped: true };

  // finalizeCreditCharge runs right after requireCredits already provisioned
  // and reset this user in the same request — repeating it here doubled the
  // Firestore round trips of every paid AI call.
  if (!skipProvision) {
    const pricing = await getPricingConfig();
    const [sub, credits, entitlements] = await Promise.all([
      readSubscription(uid),
      readCredits(uid),
      readEntitlements(uid),
    ]);
    await grantFreeTierIfNeeded(uid, pricing, { sub, credits, entitlements });
    const periodEnd = parseIso(credits?.periodEnd);
    if (credits && (!periodEnd || periodEnd <= new Date())) {
      if (hasProAccess(sub)) await resetProPeriodIfNeeded(uid, pricing, { sub });
      else await resetFreePeriodIfNeeded(uid, pricing, { sub });
    }
  }

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

    invalidateEntitlementsCache(uid);
    return { debited: cost, balanceAfter };
  });
}

export async function finalizeCreditCharge(req) {
  const charge = req?.creditCharge;
  if (!charge || charge.skipped || !charge.cost || !charge.uid) return null;
  // requireCredits middleware already provisioned/reset this user this request.
  return debitCredits(charge.uid, charge.cost, charge.featureKey, { skipProvision: true });
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
