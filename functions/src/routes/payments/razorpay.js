import crypto from "node:crypto";
import { Router } from "express";
import Razorpay from "razorpay";
import { requireAuth } from "../../middleware/auth.js";
import { paymentRateLimit } from "../../middleware/apiRateLimit.js";
import { ApiError } from "../../middleware/errors.js";
import { env } from "../../config/env.js";
import { fulfillOrder } from "../../services/fulfillOrder.js";
import {
  assertCheckoutForUser,
  createPendingCheckoutSession,
  resolvePayablePlan,
} from "../../services/checkoutSession.js";
import { getPricingConfig } from "../../services/pricingConfig.js";

/** Razorpay `receipt` max length is 40 chars. */
function makeReceipt(uid) {
  const shortUid = String(uid || "anon").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const stamp = Date.now().toString(36);
  return `r_${shortUid}_${stamp}`.slice(0, 40);
}

/** Razorpay SDK throws plain `{ statusCode, error }` objects (no Error.message). */
function razorpayFailureMessage(err) {
  if (!err) return "Razorpay request failed";
  if (typeof err.message === "string" && err.message.trim()) return err.message;
  const desc = err.error?.description || err.error?.reason || err.description;
  if (typeof desc === "string" && desc.trim()) return desc;
  if (typeof err.error === "string" && err.error.trim()) return err.error;
  return "Razorpay request failed";
}

function toApiError(err) {
  if (err instanceof ApiError) return err;
  const message = razorpayFailureMessage(err);
  const statusCode = Number(err?.statusCode) || 0;
  if (statusCode === 401 || statusCode === 403) {
    return new ApiError("unavailable", `Razorpay auth failed: ${message}`);
  }
  if (statusCode >= 400 && statusCode < 500) {
    return new ApiError("invalid-argument", message);
  }
  return new ApiError("internal", message);
}

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

/**
 * Start checkout: UI sends only a plan id/key.
 * Backend verifies the plan against pricing config, creates the Razorpay order
 * with the server amount, and stores a checkout session.
 */
router.post("/create-order", requireAuth, paymentRateLimit, async (req, res, next) => {
  try {
    const planRef = String(req.body?.plan || "").trim();
    if (!planRef) throw new ApiError("invalid-argument", "Missing plan");

    // Reject client-supplied amounts — only plan ref is accepted.
    if (req.body?.amount != null || req.body?.amountPaise != null) {
      throw new ApiError("invalid-argument", "Amount must not be supplied by the client");
    }

    const pricing = await getPricingConfig();
    const plan = resolvePayablePlan(pricing, planRef);

    const rzp = getClient();
    const order = await rzp.orders.create({
      amount: plan.amountPaise,
      currency: plan.currency,
      receipt: makeReceipt(req.user.uid),
      notes: {
        uid: req.user.uid,
        plan: plan.id,
        planKey: plan.key,
      },
    });

    await createPendingCheckoutSession({
      uid: req.user.uid,
      orderId: order.id,
      plan,
      currency: order.currency || plan.currency,
    });

    // Checkout payload for the browser SDK — amounts come only from Razorpay/server.
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.razorpayKeyId,
      planId: plan.id,
      planKey: plan.key,
      planLabel: plan.label,
    });
  } catch (err) {
    if (!(err instanceof ApiError)) {
      console.error("[POST /api/payments/create-order] Razorpay/create failed:", err);
    }
    next(toApiError(err));
  }
});

router.post("/verify-payment", requireAuth, async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body || {};
    if (!orderId || !paymentId || !signature) {
      throw new ApiError("invalid-argument", "Missing payment details");
    }
    if (!env.razorpayKeySecret) {
      throw new ApiError(
        "unavailable",
        "Razorpay is not configured (set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)",
      );
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

    if (payment.order_id && payment.order_id !== order.id) {
      throw new ApiError("permission-denied", "Payment does not belong to this order");
    }

    if (Number(payment.amount) !== Number(order.amount)) {
      throw new ApiError("permission-denied", "Payment amount does not match order");
    }

    // Re-verify plan session (uid / locked amount) before fulfillment.
    await assertCheckoutForUser({ uid: req.user.uid, order });

    const result = await fulfillOrder({
      uid: req.user.uid,
      order,
      payment,
      source: "verify",
      signature,
    });

    res.json(result);
  } catch (err) {
    if (!(err instanceof ApiError)) {
      console.error("[POST /api/payments/verify-payment] Razorpay/verify failed:", err);
    }
    next(toApiError(err));
  }
});

export default router;
