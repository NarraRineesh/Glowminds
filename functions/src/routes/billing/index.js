import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/errors.js";
import { admin } from "../../config/firebase.js";
import {
  readSubscription,
  subscriptionRef,
} from "../../services/userCollections.js";
import { hasProAccess } from "../../constants/plans.js";

const router = Router();

router.post(
  "/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const sub = await readSubscription(uid);
    if (!sub || !hasProAccess(sub)) {
      throw new ApiError("failed-precondition", "No active Pro subscription to cancel");
    }
    if (sub.status === "cancelled" || sub.cancelAtPeriodEnd) {
      return res.json({
        ok: true,
        alreadyCancelled: true,
        endDate: sub.endDate,
        status: sub.status,
      });
    }

    const now = new Date().toISOString();
    await subscriptionRef(uid).set(
      {
        status: "cancelled",
        cancelAtPeriodEnd: true,
        cancelledAt: now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    res.json({
      ok: true,
      endDate: sub.endDate,
      status: "cancelled",
      message: "Subscription cancelled. You keep Pro access until the end of your billing period.",
    });
  }),
);

router.get(
  "/payments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const snap = await subscriptionRef(uid)
      .collection("payments")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get()
      .catch(() => null);

    const payments = snap
      ? snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      : [];
    res.json({ payments });
  }),
);

export default router;
