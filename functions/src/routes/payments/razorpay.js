import crypto from "node:crypto";
import { Router } from "express";
import Razorpay from "razorpay";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { env } from "../../config/env.js";
import { fulfillOrder } from "../../services/fulfillOrder.js";

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
    const { billingPlansFromConfig, getPricingConfig } = await import(
      "../../services/pricingConfig.js"
    );
    const pricing = await getPricingConfig();
    const PLANS = billingPlansFromConfig(pricing);
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
    const payment = await rzp.payments.fetch(paymentId);

    if (order.notes?.uid && order.notes.uid !== req.user.uid) {
      throw new ApiError("permission-denied", "Order does not belong to this user");
    }

    const result = await fulfillOrder({
      uid: req.user.uid,
      order,
      payment,
      source: "verify",
    });

    res.json(result);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
