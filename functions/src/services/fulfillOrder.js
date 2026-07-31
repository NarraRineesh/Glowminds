import { admin, getFirestore } from "../config/firebase.js";
import { PRO_TIER } from "../constants/plans.js";
import { ApiError } from "../middleware/errors.js";
import {
  billingPlansFromConfig,
  findPlan,
  getPricingConfig,
} from "./pricingConfig.js";
import { grantProCredits } from "./creditService.js";
import {
  readSubscription,
  subscriptionPaymentRef,
  subscriptionRef,
} from "./userCollections.js";

/**
 * Idempotent Razorpay order fulfillment — shared by verify-payment and webhook.
 */
export async function fulfillOrder({ uid, order, payment, source = "verify", signature = null }) {
  if (!uid || !order?.id || !payment?.id) {
    throw new ApiError("invalid-argument", "Missing order fulfillment details");
  }

  if (order.notes?.uid && order.notes.uid !== uid) {
    throw new ApiError("permission-denied", "Order does not belong to this user");
  }

  if (payment.status !== "captured") {
    throw new ApiError("failed-precondition", "Payment is not captured");
  }

  const existingSub = await readSubscription(uid);

  if (existingSub?.razorpayPaymentId === payment.id) {
    return {
      success: true,
      alreadyFulfilled: true,
      plan: existingSub.plan || existingSub.currentPlanId,
      endDate: existingSub.endDate,
    };
  }

  const pricing = await getPricingConfig();
  const PLANS = billingPlansFromConfig(pricing);
  const planRef = order.notes?.plan || "";
  const planConfig = PLANS[planRef] || null;
  const planRow = findPlan(pricing, planRef);

  if (!planConfig || !planRow || !(planRow.amountPaise > 0)) {
    throw new ApiError("invalid-argument", "Invalid or unpaid plan");
  }

  if (Number(order.amount) !== planConfig.amount) {
    throw new ApiError("permission-denied", "Order amount does not match current plan pricing");
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + planConfig.durationDays * 86400_000);
  const currency = pricing.currency || "INR";
  const currencySymbol = pricing.currencySymbol || "₹";
  const planId = planRow.id;
  const planKey = planRow.key || planId;

  const subscription = {
    userId: uid,
    plan: planId,
    planKey,
    tier: planRow.tier || PRO_TIER,
    status: "active",
    currentPlanId: planId,
    currentPlanKey: planKey,
    currentPlanLabel: planConfig.label,
    currentPlanPeriod: planRow.period || null,
    currentPlanAmountPaise: planConfig.amount,
    currency,
    currencySymbol,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    renewedAt: now.toISOString(),
    lastPaymentAt: now.toISOString(),
    provider: "razorpay",
    razorpayOrderId: order.id,
    razorpayPaymentId: payment.id,
    source,
    createdAt: existingSub?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const subRef = subscriptionRef(uid);
  const subSnap = await subRef.get();
  const prev = subSnap.exists ? subSnap.data() : {};
  const amountPaise = Number(order.amount) || planConfig.amount;
  const paymentCount = (prev.paymentCount || 0) + 1;
  const successfulPaymentCount = (prev.successfulPaymentCount || 0) + 1;

  await subRef.set(
    {
      ...subscription,
      totalPaidPaise: (prev.totalPaidPaise || 0) + amountPaise,
      paymentCount,
      successfulPaymentCount,
      failedPaymentCount: prev.failedPaymentCount || 0,
    },
    { merge: true },
  );

  await subscriptionPaymentRef(uid, payment.id).set({
    userId: uid,
    planId,
    planKey,
    planLabel: planConfig.label,
    amountPaise,
    currency,
    status: "captured",
    provider: "razorpay",
    razorpayOrderId: order.id,
    razorpayPaymentId: payment.id,
    razorpaySignature: signature || null,
    billingPeriodStart: now.toISOString(),
    billingPeriodEnd: endDate.toISOString(),
    paidAt: now.toISOString(),
    source,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await grantProCredits(uid, pricing);

  return {
    success: true,
    alreadyFulfilled: false,
    plan: planId,
    planKey,
    endDate: endDate.toISOString(),
    subscription: {
      ...subscription,
      totalPaidPaise: (prev.totalPaidPaise || 0) + amountPaise,
      paymentCount,
      successfulPaymentCount,
    },
  };
}
