import { getFirestore } from "../config/firebase.js";

const FAILURE_THRESHOLD = 5;
const BATCH = 200;

export async function runHealthSweep() {
  const db = getFirestore();
  const snap = await db
    .collection("companies")
    .where("active", "==", true)
    .where("syncFailures", ">=", FAILURE_THRESHOLD)
    .limit(BATCH)
    .get();

  if (snap.empty) {
    console.log("[health] no unhealthy companies");
    return { deactivated: 0 };
  }

  const batch = db.batch();
  for (const doc of snap.docs) {
    batch.set(
      doc.ref,
      {
        active: false,
        deactivatedReason: `syncFailures >= ${FAILURE_THRESHOLD}`,
        deactivatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    console.warn(
      `[health] deactivating ${doc.id} (syncFailures=${doc.data().syncFailures})`,
    );
  }
  await batch.commit();

  return { deactivated: snap.size };
}

export function scheduleHealthWorker(cron) {
  cron.schedule("0 * * * *", async () => {
    try {
      await runHealthSweep();
    } catch (err) {
      console.error("[health] sweep error:", err);
    }
  });
}
