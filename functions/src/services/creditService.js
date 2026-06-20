import { admin, getFirestore } from "../config/firebase.js";
import { hasProAccess, isTrustedProSubscription } from "../constants/plans.js";
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

/** Initialize free-tier credits on first access; cap client-seeded inflation. */
export async function grantFreeTierIfNeeded(uid, pricing) {
  const freeGrant = pricing.freeLimits?.aiCredits ?? 10;
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

export async function getEntitlements(uid) {
  const pricing = await getPricingConfig();
  await grantFreeTierIfNeeded(uid, pricing);

  const db = getFirestore();
  const ref = db.collection("users").doc(uid);
  let snap = await ref.get();
  let data = snap.exists ? snap.data() : {};

  const sub = data.subscription || null;
  const isPro = hasProAccess(sub);

  if (isPro) {
    await resetProPeriodIfNeeded(uid, pricing);
    snap = await ref.get();
    data = snap.data() || {};
  }

  const credits = data.credits || defaultCredits(pricing.freeLimits?.aiCredits ?? 10);
  const entitlements = data.entitlements || defaultEntitlements();

  const freeGrant = pricing.freeLimits?.aiCredits ?? 10;
  const proMonthly = pricing.proLimits?.aiCreditsPerMonth ?? 100;
  const balance = isPro ? proMonthly : freeGrant;

  const applicationCountSnap = await ref.collection("applications").count().get();
  const applicationCount = applicationCountSnap.data().count || 0;

  const creditPayload = {
    balance,
    periodStart: credits.periodStart || null,
    periodEnd: credits.periodEnd || null,
    lifetimeGranted: isPro ? (credits.lifetimeGranted ?? freeGrant) : freeGrant,
    lifetimeUsed: credits.lifetimeUsed ?? 0,
  };

  return {
    isPro,
    credits: creditPayload,
    freeLimits: pricing.freeLimits,
    proLimits: pricing.proLimits,
    entitlements: {
      resumeCount: entitlements.resumeCount ?? 0,
      applicationCount,
    },
    subscription: sub,
  };
}

/** Credits are informational for now; keep this as a route-compatible no-op. */
export async function debitCredits() {
  return { debited: 0, balanceAfter: null, skipped: true };
}

/** Pro credit grant on subscription fulfillment. */
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

export async function registerResume(uid, { resumeId } = {}) {
  const entitlements = await getEntitlements(uid);

  if (entitlements.isPro) {
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

export async function assertCanCreateApplication(uid) {
  const entitlements = await getEntitlements(uid);
  return entitlements;
}
