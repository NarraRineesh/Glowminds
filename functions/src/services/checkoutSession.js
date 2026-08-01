import { admin, getFirestore } from "../config/firebase.js";
import { ApiError } from "../middleware/errors.js";
import { findPlan, getPricingConfig, listPaidPlans } from "./pricingConfig.js";

/** Server-side checkout intents — never trust client amounts. */
export function checkoutSessionRef(orderId) {
  return getFirestore().collection("checkoutSessions").doc(orderId);
}

/**
 * Resolve a payable plan from pricing config.
 * Accepts hashed plan id or legacy key (yearly/monthly/lifetime).
 */
export function resolvePayablePlan(pricing, planRef) {
  const ref = String(planRef || "").trim();
  if (!ref) throw new ApiError("invalid-argument", "Missing plan");

  const plan = findPlan(pricing, ref);
  if (!plan) throw new ApiError("invalid-argument", "Plan not found");

  if (plan.visible === false) {
    throw new ApiError("failed-precondition", "This plan is not available for purchase");
  }

  const amountPaise = Number(plan.amountPaise);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    throw new ApiError("invalid-argument", "Plan is not payable");
  }

  // Ensure it appears in the paid billing map (visible + paid).
  const paid = listPaidPlans(pricing);
  if (!paid.some((p) => p.id === plan.id || (plan.key && p.key === plan.key))) {
    throw new ApiError("failed-precondition", "Plan is not available for checkout");
  }

  const durationDays = Number(plan.durationDays);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    throw new ApiError("invalid-argument", "Plan has invalid billing duration");
  }

  return {
    id: plan.id,
    key: plan.key || plan.id,
    label: plan.label || plan.key || "Pro",
    amountPaise: Math.round(amountPaise),
    durationDays: Math.round(durationDays),
    period: plan.period || null,
    tier: plan.tier || "pro",
    currency: pricing.currency || "INR",
  };
}

export async function createPendingCheckoutSession({
  uid,
  orderId,
  plan,
  currency,
}) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const doc = {
    uid,
    orderId,
    planId: plan.id,
    planKey: plan.key,
    planLabel: plan.label,
    amountPaise: plan.amountPaise,
    currency: currency || plan.currency || "INR",
    durationDays: plan.durationDays,
    status: "created",
    provider: "razorpay",
    createdAt: now,
    updatedAt: now,
  };
  await checkoutSessionRef(orderId).set(doc);
  return doc;
}

/**
 * Load + authorize a checkout session for the paying user.
 * Falls back to order.notes when the session doc is missing (legacy orders).
 */
export async function assertCheckoutForUser({ uid, order }) {
  if (!uid || !order?.id) {
    throw new ApiError("invalid-argument", "Missing checkout details");
  }

  if (order.notes?.uid && order.notes.uid !== uid) {
    throw new ApiError("permission-denied", "Order does not belong to this user");
  }

  const snap = await checkoutSessionRef(order.id).get();
  const pricing = await getPricingConfig();

  if (snap.exists) {
    const session = snap.data();
    if (session.uid !== uid) {
      throw new ApiError("permission-denied", "Checkout session does not belong to this user");
    }
    if (Number(order.amount) !== Number(session.amountPaise)) {
      throw new ApiError("permission-denied", "Order amount does not match checkout session");
    }
    if (
      order.notes?.plan
      && order.notes.plan !== session.planId
      && order.notes.plan !== session.planKey
    ) {
      throw new ApiError("permission-denied", "Order plan does not match checkout session");
    }

    // Prefer locked session fields; still require plan to exist in config.
    const plan = resolvePayablePlan(pricing, session.planId);
    return {
      session,
      plan: {
        ...plan,
        // Honor amount/duration locked when the order was created.
        amountPaise: Number(session.amountPaise) || plan.amountPaise,
        durationDays: Number(session.durationDays) || plan.durationDays,
        label: session.planLabel || plan.label,
      },
      alreadyPaid: session.status === "paid",
    };
  }

  // Legacy path: verify from order notes + current pricing
  const planRef = order.notes?.plan;
  const plan = resolvePayablePlan(pricing, planRef);
  if (Number(order.amount) !== plan.amountPaise) {
    throw new ApiError("permission-denied", "Order amount does not match current plan pricing");
  }
  return { session: null, plan, alreadyPaid: false };
}

export async function markCheckoutSessionPaid(orderId, paymentId) {
  if (!orderId) return;
  const ref = checkoutSessionRef(orderId);
  const snap = await ref.get();
  if (!snap.exists) return;
  await ref.set(
    {
      status: "paid",
      razorpayPaymentId: paymentId || null,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
