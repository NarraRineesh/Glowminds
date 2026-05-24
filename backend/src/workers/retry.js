import { admin, getFirestore } from "../config/firebase.js";
import { fetchDetail } from "../sync/fetchDetail.js";
import { callEnrich } from "../sync/callEnrich.js";
import { jobFingerprint } from "../sync/gates.js";
import { jobIdFor } from "../utils/hash.js";

const BATCH = 50;
const MAX_ATTEMPTS = 5;

function nextAttemptAt(attempts) {
  const minutes = Math.min(2 ** attempts, 60);
  return admin.firestore.Timestamp.fromMillis(Date.now() + minutes * 60_000);
}

async function processDetail(db, doc) {
  const task = doc.data();
  const { companySlug, externalId } = task;
  const ats = task.payload?.ats || task.ats;
  if (!ats || !companySlug || !externalId) {
    return { drop: true, reason: "invalid task payload" };
  }

  const detailRes = await fetchDetail(ats, companySlug, externalId);
  if (!detailRes.ok) {
    return { failed: true, reason: detailRes.error };
  }
  const detail = detailRes.detail;

  const enrich = await callEnrich({
    descriptionHtml: detail.descriptionHtml,
    plainText: detail.plainText,
  });

  const jobId = jobIdFor(ats, companySlug, externalId);
  const fingerprint = jobFingerprint({
    title: detail.title,
    location: detail.location,
    updatedAt: detail.updatedAt,
  });

  await db
    .collection("jobs")
    .doc(jobId)
    .set(
      {
        source: `ats:${ats}`,
        ats,
        companySlug,
        externalId: String(externalId),
        title: detail.title,
        location: detail.location,
        applyUrl: detail.applyUrl,
        salary: detail.salary || "",
        department: detail.department || "",
        remote: !!(detail.remote || enrich.remote),
        employmentType:
          detail.employmentType || enrich.employmentType || "full-time",
        postedAt: detail.postedAt || "",
        updatedAt: detail.updatedAt || "",
        descriptionHtml: detail.descriptionHtml,
        skills: enrich.skills || [],
        experience: enrich.experience || "",
        seniority: enrich.seniority || "mid",
        role: enrich.role || "engineering",
        status: enrich.partial ? "RETRY_ENRICHMENT" : "ACTIVE",
        fingerprint,
        indexedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  return { ok: true };
}

export async function runRetrySweep() {
  const db = getFirestore();
  const now = admin.firestore.Timestamp.now();

  const snap = await db
    .collection("retry_queue")
    .where("nextAttemptAt", "<=", now)
    .limit(BATCH)
    .get();

  if (snap.empty) {
    console.log("[retry] queue empty");
    return { processed: 0 };
  }

  let ok = 0;
  let dead = 0;
  let requeued = 0;

  for (const doc of snap.docs) {
    const task = doc.data();
    let result;
    try {
      if (task.stage === "detail") {
        result = await processDetail(db, doc);
      } else {
        result = { drop: true, reason: `unknown stage ${task.stage}` };
      }
    } catch (err) {
      result = { failed: true, reason: err?.message || String(err) };
    }

    if (result.ok) {
      await doc.ref.delete();
      ok += 1;
    } else if (result.drop) {
      await doc.ref.delete();
      dead += 1;
    } else {
      const attempts = (task.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await db.collection("failed_jobs").doc(doc.id).set({
          ...task,
          attempts,
          movedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastError: result.reason,
        });
        await doc.ref.delete();
        dead += 1;
      } else {
        await doc.ref.set(
          {
            attempts,
            lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
            nextAttemptAt: nextAttemptAt(attempts),
            lastError: result.reason,
          },
          { merge: true },
        );
        requeued += 1;
      }
    }
  }

  console.log(`[retry] processed=${snap.size} ok=${ok} requeued=${requeued} dead=${dead}`);
  return { processed: snap.size, ok, requeued, dead };
}

export function scheduleRetryWorker(cron) {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await runRetrySweep();
    } catch (err) {
      console.error("[retry] sweep error:", err);
    }
  });
}
