import { admin, getFirestore } from "../config/firebase.js";

const EXPIRY_DAYS = 7;
const BATCH_SIZE = 400;

export async function runExpirationSweep() {
  const db = getFirestore();
  const cutoff = admin.firestore.Timestamp.fromMillis(
    Date.now() - EXPIRY_DAYS * 86_400_000,
  );

  const snap = await db
    .collection("jobs")
    .where("status", "==", "ACTIVE")
    .where("lastSeenAt", "<", cutoff)
    .limit(BATCH_SIZE)
    .get();

  if (snap.empty) {
    console.log("[expire] nothing to expire");
    return { expired: 0 };
  }

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();
  for (const doc of snap.docs) {
    batch.set(doc.ref, { status: "EXPIRED", expiredAt: now }, { merge: true });
  }
  await batch.commit();
  console.log(`[expire] marked ${snap.size} jobs EXPIRED`);
  return { expired: snap.size };
}

export function scheduleExpirationWorker(cron) {
  cron.schedule("0 2 * * *", async () => {
    try {
      await runExpirationSweep();
    } catch (err) {
      console.error("[expire] sweep error:", err);
    }
  });
}
