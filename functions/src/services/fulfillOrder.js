import { admin, getFirestore } from "../config/firebase.js";
import { PRO_TIER } from "../constants/plans.js";
import { ApiError } from "../middleware/errors.js";
import {
  billingPlansFromConfig,
  getPricingConfig,
} from "./pricingConfig.js";
import { grantProCredits } from "./creditService.js";

/**
 * Idempotent Razorpay order fulfillment — shared by verify-payment and webhook.
 *
 * @param {{ uid: string, order: object, payment: object, source?: string }} params
 */
export async function fulfillOrder({ uid, order, payment, source = "verify" }) {
  if (!uid || !order?.id || !payment?.id) {
    throw new ApiError("invalid-argument", "Missing order fulfillment details");
  }

  if (order.notes?.uid && order.notes.uid !== uid) {
    throw new ApiError("permission-denied", "Order does not belong to this user");
  }

  if (payment.status !== "captured") {
    throw new ApiError("failed-precondition", "Payment is not captured");
  }

  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const existingSub = userSnap.exists ? userSnap.get("subscription") : null;

  if (existingSub?.razorpayPaymentId === payment.id) {
    return {
      success: true,
      alreadyFulfilled: true,
      plan: existingSub.plan,
      endDate: existingSub.endDate,
    };
  }

  const pricing = await getPricingConfig();
  const PLANS = billingPlansFromConfig(pricing);
  const plan = order.notes?.plan || "monthly";
  const planConfig = PLANS[plan] || PLANS.monthly;

  if (Number(order.amount) !== planConfig.amount) {
    throw new ApiError("permission-denied", "Order amount does not match current plan pricing");
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + planConfig.durationDays * 86400_000);

  const subscription = {
    plan,
    tier: PRO_TIER,
    status: "active",
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    razorpayOrderId: order.id,
    razorpayPaymentId: payment.id,
    source,
  };

  await userRef.set(
    {
      subscription,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await grantProCredits(uid, pricing);

  return {
    success: true,
    alreadyFulfilled: false,
    plan,
    endDate: endDate.toISOString(),
    subscription,
  };
}
