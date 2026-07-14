import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/errors.js";
import { admin, getAuth, getFirestore } from "../../config/firebase.js";
import {
  applicationsCol,
  readCredits,
  readEntitlements,
  readSubscription,
  subscriptionRef,
  userCreditsRef,
  userDocRef,
  userEntitlementsRef,
} from "../../services/userCollections.js";

const router = Router();

async function deleteQueryBatch(query, batchSize = 200) {
  const snap = await query.limit(batchSize).get();
  if (snap.empty) return 0;
  const batch = getFirestore().batch();
  for (const doc of snap.docs) batch.delete(doc.ref);
  await batch.commit();
  return snap.size;
}

async function deleteByUserId(collectionName, uid) {
  const col = getFirestore().collection(collectionName);
  let deleted = 0;
  // Loop until drained
  for (let i = 0; i < 50; i += 1) {
    const n = await deleteQueryBatch(col.where("userId", "==", uid));
    deleted += n;
    if (n === 0) break;
  }
  return deleted;
}

router.post(
  "/export",
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const db = getFirestore();

    const [userSnap, sub, credits, entitlements, appsSnap, resumesSnap, chatsSnap, savedSnap] =
      await Promise.all([
        userDocRef(uid).get(),
        readSubscription(uid),
        readCredits(uid),
        readEntitlements(uid),
        applicationsCol().where("userId", "==", uid).limit(500).get(),
        db.collection("resumes").where("userId", "==", uid).limit(100).get(),
        db.collection("aiChats").where("userId", "==", uid).limit(100).get(),
        db.collection("savedJobs").where("userId", "==", uid).limit(500).get(),
      ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user: userSnap.exists ? userSnap.data() : null,
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            totalPaidPaise: sub.totalPaidPaise,
            // omit payment provider ids beyond what’s needed
          }
        : null,
      credits: credits
        ? {
            balance: credits.balance,
            lifetimeGranted: credits.lifetimeGranted,
            lifetimeUsed: credits.lifetimeUsed,
            periodEnd: credits.periodEnd,
          }
        : null,
      entitlements: entitlements
        ? {
            resumeCount: entitlements.resumeCount,
            usage: entitlements.usage || {},
          }
        : null,
      applications: appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      resumes: resumesSnap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          title: data.title || data.name || null,
          template: data.data?.metadata?.template || data.template || null,
          updatedAt: data.updatedAt || null,
          createdAt: data.createdAt || null,
        };
      }),
      aiChats: chatsSnap.docs.map((d) => ({
        id: d.id,
        title: d.data()?.title || null,
        messageCount: Array.isArray(d.data()?.messages) ? d.data().messages.length : 0,
        updatedAt: d.data()?.updatedAt || null,
      })),
      savedJobs: savedSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };

    res.json(exportPayload);
  }),
);

router.post(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const confirm = String(req.body?.confirm || "");
    if (confirm !== "DELETE") {
      throw new ApiError(
        "invalid-argument",
        'Send { "confirm": "DELETE" } to permanently delete your account',
      );
    }

    const sub = await readSubscription(uid);
    if (sub && (sub.status === "active" || sub.status === "cancelled")) {
      // Mark cancelled immediately; payment records retained without user profile linkage beyond uid.
      await subscriptionRef(uid).set(
        {
          status: "cancelled",
          cancelAtPeriodEnd: true,
          cancelledAt: new Date().toISOString(),
          accountDeletedAt: new Date().toISOString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    await Promise.all([
      deleteByUserId("applications", uid),
      deleteByUserId("savedJobs", uid),
      deleteByUserId("resumes", uid),
      deleteByUserId("notifications", uid),
      deleteByUserId("aiChats", uid),
      deleteByUserId("interviewSessions", uid),
      deleteByUserId("creditLedger", uid),
      deleteByUserId("aiUsageLogs", uid),
    ]);

    await Promise.all([
      userDocRef(uid).delete().catch(() => {}),
      userCreditsRef(uid).delete().catch(() => {}),
      userEntitlementsRef(uid).delete().catch(() => {}),
    ]);

    try {
      await getAuth().deleteUser(uid);
    } catch (err) {
      console.warn("[account/delete] auth delete failed:", err.message);
      throw new ApiError(
        "internal",
        "Account data removed but auth deletion failed. Contact support.",
      );
    }

    res.json({ ok: true, deleted: true });
  }),
);

export default router;
