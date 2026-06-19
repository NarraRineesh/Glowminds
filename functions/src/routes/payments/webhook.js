import crypto from "node:crypto";
import { Router } from "express";
import Razorpay from "razorpay";
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

router.post("/", async (req, res, next) => {
  try {
    if (!env.razorpayWebhookSecret) {
      throw new ApiError(
        "unavailable",
        "Razorpay webhook secret is not configured (set RAZORPAY_WEBHOOK_SECRET)",
      );
    }

    const signature = req.headers["x-razorpay-signature"];
    if (!signature || typeof signature !== "string") {
      throw new ApiError("permission-denied", "Missing webhook signature");
    }

    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      throw new ApiError("invalid-argument", "Webhook expects raw body");
    }

    const expected = crypto
      .createHmac("sha256", env.razorpayWebhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      throw new ApiError("permission-denied", "Invalid webhook signature");
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const eventType = event?.event;

    if (eventType !== "payment.captured" && eventType !== "order.paid") {
      res.json({ received: true, ignored: true, event: eventType });
      return;
    }

    const rzp = getClient();
    let payment;
    let order;

    if (eventType === "payment.captured") {
      const entity = event?.payload?.payment?.entity;
      if (!entity?.id) {
        throw new ApiError("invalid-argument", "Missing payment entity");
      }
      payment = await rzp.payments.fetch(entity.id);
      order = await rzp.orders.fetch(payment.order_id);
    } else {
      const entity = event?.payload?.order?.entity;
      if (!entity?.id) {
        throw new ApiError("invalid-argument", "Missing order entity");
      }
      order = await rzp.orders.fetch(entity.id);
      const payments = await rzp.orders.fetchPayments(order.id);
      payment = payments?.items?.find((p) => p.status === "captured");
      if (!payment) {
        res.json({ received: true, pending: true });
        return;
      }
    }

    const uid = order.notes?.uid;
    if (!uid) {
      throw new ApiError("invalid-argument", "Order missing uid note");
    }

    const result = await fulfillOrder({
      uid,
      order,
      payment,
      source: "webhook",
    });

    res.json({ received: true, ...result });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
