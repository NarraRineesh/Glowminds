import { admin } from "../config/firebase.js";
import { PRO_TIER } from "../constants/plans.js";
import { ApiError } from "../middleware/errors.js";
import { getPricingConfig } from "./pricingConfig.js";
import { grantProCredits } from "./creditService.js";
import {
  assertCheckoutForUser,
  markCheckoutSessionPaid,
} from "./checkoutSession.js";
import {
  readSubscription,
  subscriptionPaymentRef,
  subscriptionRef,
} from "./userCollections.js";

/**
 * Idempotent Razorpay order fulfillment — shared by verify-payment and webhook.
 * Plan + amount are resolved from the server checkout session / order notes — never the client.
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

  if (payment.order_id && payment.order_id !== order.id) {
    throw new ApiError("permission-denied", "Payment does not belong to this order");
  }

  if (Number(payment.amount) !== Number(order.amount)) {
    throw new ApiError("permission-denied", "Payment amount does not match order");
  }

  const existingSub = await readSubscription(uid);

  if (existingSub?.razorpayPaymentId === payment.id) {
    await markCheckoutSessionPaid(order.id, payment.id);
    return {
      success: true,
      alreadyFulfilled: true,
      plan: existingSub.plan || existingSub.currentPlanId,
      endDate: existingSub.endDate,
    };
  }

  const { session, plan } = await assertCheckoutForUser({ uid, order });

  // Prefer the amount locked at order creation (session / Razorpay order).
  const amountPaise = Number(order.amount) || Number(session?.amountPaise) || plan.amountPaise;
  const durationDays = Number(session?.durationDays) || plan.durationDays;

  const pricing = await getPricingConfig();
  const now = new Date();
  const endDate = new Date(now.getTime() + durationDays * 86400_000);
  const currency = order.currency || session?.currency || pricing.currency || "INR";
  const currencySymbol = pricing.currencySymbol || "₹";
  const planId = plan.id;
  const planKey = plan.key || planId;

  const subscription = {
    userId: uid,
    plan: planId,
    planKey,
    tier: plan.tier || PRO_TIER,
    status: "active",
    currentPlanId: planId,
    currentPlanKey: planKey,
    currentPlanLabel: plan.label,
    currentPlanPeriod: plan.period || null,
    currentPlanAmountPaise: amountPaise,
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
    planLabel: plan.label,
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
  await markCheckoutSessionPaid(order.id, payment.id);

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
