import crypto from "node:crypto";
import { Router } from "express";
import Razorpay from "razorpay";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { env } from "../../config/env.js";
import { getFirestore } from "../../config/firebase.js";
import { admin } from "../../config/firebase.js";

const PLANS = {
  monthly: { amount: 4900, label: "Glowminds Pro Monthly", durationDays: 30 },
  yearly: { amount: 39900, label: "Glowminds Pro Yearly", durationDays: 365 },
};

function getClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new ApiError(
      "unavailable",
      "Razorpay is not configured (set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)",
    );
  }
  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
}

const router = Router();

router.post("/create-order", requireAuth, async (req, res, next) => {
  try {
    const { plan } = req.body || {};
    if (!PLANS[plan]) throw new ApiError("invalid-argument", "Invalid plan");

    const rzp = getClient();
    const order = await rzp.orders.create({
      amount: PLANS[plan].amount,
      currency: "INR",
      receipt: `rcpt_${req.user.uid}_${Date.now()}`,
      notes: { uid: req.user.uid, plan },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.razorpayKeyId,
    });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

router.post("/verify-payment", requireAuth, async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body || {};
    if (!orderId || !paymentId || !signature) {
      throw new ApiError("invalid-argument", "Missing payment details");
    }

    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac("sha256", env.razorpayKeySecret)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      throw new ApiError("permission-denied", "Invalid payment signature");
    }

    const rzp = getClient();
    const order = await rzp.orders.fetch(orderId);
    const plan = order.notes?.plan || "monthly";
    const planConfig = PLANS[plan] || PLANS.monthly;

    const now = new Date();
    const endDate = new Date(
      now.getTime() + planConfig.durationDays * 86400_000,
    );

    await getFirestore()
      .collection("users")
      .doc(req.user.uid)
      .set(
        {
          subscription: {
            plan,
            status: "active",
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    res.json({ success: true, plan, endDate: endDate.toISOString() });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
