/**
 * Mark Pro subscriptions past endDate as expired.
 * Invoked by the scheduled Cloud Function in index.js.
 */

import { admin, getFirestore } from "../config/firebase.js";

export async function expireSubscriptions() {
  const db = getFirestore();
  const nowIso = new Date().toISOString();
  let expired = 0;

  // Query cancelled + active and filter by endDate in memory (avoids composite index dependency).
  for (const status of ["active", "cancelled"]) {
    const snap = await db
      .collection("subscriptions")
      .where("status", "==", status)
      .limit(500)
      .get();

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const end = data.endDate ? new Date(data.endDate) : null;
      if (!end || !Number.isFinite(end.getTime())) continue;
      if (end >= new Date()) continue;

      batch.set(
        doc.ref,
        {
          status: "expired",
          expiredAt: nowIso,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      batchCount += 1;
      expired += 1;
      if (batchCount >= 400) break;
    }

    if (batchCount > 0) await batch.commit();
  }

  return { expired, checkedAt: nowIso };
}
