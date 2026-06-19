import { admin, getFirestore } from "../config/firebase.js";
import { hasProAccess, isTrustedProSubscription } from "../constants/plans.js";
import { ApiError } from "../middleware/errors.js";
import { getPricingConfig } from "./pricingConfig.js";

function defaultCredits(freeGrant) {
  return {
    balance: freeGrant,
    lifetimeGranted: freeGrant,
    lifetimeUsed: 0,
    periodStart: null,
    periodEnd: null,
  };
}

function defaultEntitlements() {
  return {
    resumeCount: 0,
    registeredResumeIds: [],
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

export function getCreditCost(pricing, action) {
  const costs = pricing.creditCosts || {};
  const cost = costs[action];
  if (typeof cost !== "number" || cost < 0) {
    throw new ApiError("internal", `Unknown credit action: ${action}`);
  }
  return cost;
}

/** Initialize free-tier credits on first access; cap client-seeded inflation. */
export async function grantFreeTierIfNeeded(uid, pricing) {
  const freeGrant = pricing.freeLimits?.aiCredits ?? 5;
  const db = getFirestore();
  const ref = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const trustedPro = isTrustedProSubscription(data.subscription);

    if (!data.credits) {
      tx.set(
        ref,
        {
          credits: defaultCredits(freeGrant),
          entitlements: data.entitlements || defaultEntitlements(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }

    if (trustedPro) return;

    const credits = data.credits;
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
        credits: {
          balance: Math.max(0, cappedGranted - used),
          lifetimeGranted: cappedGranted,
          lifetimeUsed: used,
          periodStart: null,
          periodEnd: null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/** Lazy monthly reset for active Pro subscribers. */
export async function resetProPeriodIfNeeded(uid, pricing) {
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;
  const db = getFirestore();
  const ref = db.collection("users").doc(uid);
  const now = new Date();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const sub = snap.get("subscription");
    if (!isTrustedProSubscription(sub)) return;

    const credits = snap.get("credits") || {};
    const periodEnd = parseIso(credits.periodEnd);
    if (periodEnd && periodEnd > now) return;

    const periodStart = now.toISOString();
    const nextEnd = addCalendarMonth(now).toISOString();

    tx.set(
      ref,
      {
        credits: {
          ...credits,
          balance: proMonthly,
          periodStart,
          periodEnd: nextEnd,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/**
 * @param {string} uid
 * @param {{ isAdmin?: boolean }} [opts]
 */
export async function getEntitlements(uid, { isAdmin = false } = {}) {
  const pricing = await getPricingConfig();
  await grantFreeTierIfNeeded(uid, pricing);

  const db = getFirestore();
  const ref = db.collection("users").doc(uid);
  let snap = await ref.get();
  let data = snap.exists ? snap.data() : {};

  const sub = data.subscription || null;
  const isPro = hasProAccess(sub, isAdmin);
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;

  if (isPro && !isAdmin) {
    await resetProPeriodIfNeeded(uid, pricing);
    snap = await ref.get();
    data = snap.data() || {};
  }

  const credits = data.credits || defaultCredits(pricing.freeLimits?.aiCredits ?? 5);
  const entitlements = data.entitlements || defaultEntitlements();

  let balance = typeof credits.balance === "number" ? credits.balance : 0;
  if (isAdmin) {
    balance = proMonthly;
  } else if (!isPro) {
    const granted = credits.lifetimeGranted ?? pricing.freeLimits?.aiCredits ?? 5;
    const used = credits.lifetimeUsed ?? 0;
    balance = Math.max(0, granted - used);
  }

  const applicationCountSnap = await ref.collection("applications").count().get();
  const applicationCount = applicationCountSnap.data().count || 0;

  const now = new Date();
  const creditPayload = isAdmin
    ? {
        balance,
        periodStart: credits.periodStart || now.toISOString(),
        periodEnd: credits.periodEnd || addCalendarMonth(now).toISOString(),
        lifetimeGranted: credits.lifetimeGranted ?? pricing.freeLimits?.aiCredits ?? 5,
        lifetimeUsed: credits.lifetimeUsed ?? 0,
      }
    : {
        balance,
        periodStart: credits.periodStart || null,
        periodEnd: credits.periodEnd || null,
        lifetimeGranted: credits.lifetimeGranted ?? pricing.freeLimits?.aiCredits ?? 5,
        lifetimeUsed: credits.lifetimeUsed ?? 0,
      };

  return {
    isPro,
    isAdmin,
    credits: creditPayload,
    freeLimits: pricing.freeLimits,
    proLimits: pricing.proLimits,
    creditCosts: pricing.creditCosts,
    entitlements: {
      resumeCount: entitlements.resumeCount ?? 0,
      applicationCount,
    },
    subscription: sub,
  };
}

/**
 * Atomically debit credits before an AI action.
 * @param {string} uid
 * @param {string} action - key in pricing.creditCosts
 * @param {{ idempotencyKey?: string, isAdmin?: boolean }} [opts]
 */
export async function debitCredits(uid, action, opts = {}) {
  const { idempotencyKey, isAdmin = false } = opts;
  if (isAdmin) {
    return { debited: 0, balanceAfter: Infinity, skipped: true };
  }

  const pricing = await getPricingConfig();
  const cost = getCreditCost(pricing, action);
  if (cost === 0) {
    return { debited: 0, balanceAfter: null, skipped: true };
  }

  await grantFreeTierIfNeeded(uid, pricing);

  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);

  const subSnap = await userRef.get();
  const sub = subSnap.exists ? subSnap.get("subscription") : null;
  const isPro = hasProAccess(sub, false);

  if (isPro) {
    await resetProPeriodIfNeeded(uid, pricing);
  }

  if (idempotencyKey) {
    const existing = await userRef
      .collection("creditLedger")
      .where("idempotencyKey", "==", idempotencyKey)
      .limit(1)
      .get();
    if (!existing.empty) {
      const entry = existing.docs[0].data();
      return {
        debited: 0,
        balanceAfter: entry.balanceAfter,
        skipped: true,
        idempotent: true,
      };
    }
  }

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      throw new ApiError("not-found", "User not found");
    }

    const subscription = snap.get("subscription");
    const pro = hasProAccess(subscription, false);
    const credits = snap.get("credits") || defaultCredits(pricing.freeLimits?.aiCredits ?? 5);

    let balance;
    if (pro) {
      balance = typeof credits.balance === "number" ? credits.balance : 0;
    } else {
      const granted = credits.lifetimeGranted ?? pricing.freeLimits?.aiCredits ?? 5;
      const used = credits.lifetimeUsed ?? 0;
      balance = Math.max(0, granted - used);
    }

    if (balance < cost) {
      throw new ApiError(
        "credits-exhausted",
        pro
          ? "You have used all AI credits for this billing period. Credits reset monthly."
          : "You have used all free AI credits. Upgrade to Pro for 100 credits per month.",
        402,
      );
    }

    const balanceAfter = balance - cost;
    const nextCredits = pro
      ? { ...credits, balance: balanceAfter }
      : {
          ...credits,
          balance: balanceAfter,
          lifetimeUsed: (credits.lifetimeUsed ?? 0) + cost,
        };

    tx.set(
      userRef,
      {
        credits: nextCredits,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const ledgerRef = userRef.collection("creditLedger").doc();
    tx.set(ledgerRef, {
      action,
      cost,
      balanceAfter,
      idempotencyKey: idempotencyKey || null,
      at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { debited: cost, balanceAfter, skipped: false };
  });
}

/** Pro credit grant on subscription fulfillment or admin grant. */
export async function grantProCredits(uid, pricing) {
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;
  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = addCalendarMonth(now).toISOString();
  const db = getFirestore();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.get("credits") || {} : {};

  await ref.set(
    {
      credits: {
        ...existing,
        balance: proMonthly,
        periodStart,
        periodEnd,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function registerResume(uid, { resumeId } = {}, { isAdmin = false } = {}) {
  const pricing = await getPricingConfig();
  const entitlements = await getEntitlements(uid, { isAdmin });
  const limit = pricing.freeLimits?.resumes ?? 1;

  if (entitlements.isPro || isAdmin) {
    return { allowed: true, resumeCount: entitlements.entitlements.resumeCount };
  }

  const db = getFirestore();
  const ref = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const ent = data.entitlements || defaultEntitlements();
    const ids = Array.isArray(ent.registeredResumeIds) ? ent.registeredResumeIds : [];
    const count = ent.resumeCount ?? ids.length;

    if (resumeId && ids.includes(resumeId)) {
      return { allowed: true, resumeCount: count };
    }

    if (count >= limit) {
      throw new ApiError(
        "permission-denied",
        `Free plan allows up to ${limit} resume${limit === 1 ? "" : "s"}. Upgrade to Pro for unlimited resumes.`,
        403,
      );
    }

    const nextIds = resumeId ? [...ids, resumeId] : ids;
    const nextCount = count + 1;

    tx.set(
      ref,
      {
        entitlements: {
          ...ent,
          resumeCount: nextCount,
          registeredResumeIds: resumeId ? nextIds : ids,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { allowed: true, resumeCount: nextCount };
  });
}

export async function assertCanCreateApplication(uid, { isAdmin = false } = {}) {
  const entitlements = await getEntitlements(uid, { isAdmin });
  if (entitlements.isPro || isAdmin) return entitlements;

  const limit = entitlements.freeLimits?.applications ?? 10;
  const count = entitlements.entitlements.applicationCount ?? 0;

  if (count >= limit) {
    throw new ApiError(
      "permission-denied",
      `Free plan allows up to ${limit} tracked applications. Upgrade to Pro for unlimited tracking.`,
      403,
    );
  }

  return entitlements;
}
