import { admin, getFirestore } from "../config/firebase.js";
import { searchBoardJobs } from "../services/jobSearch.js";

/**
 * Daily digest for users with profile.preferences.jobAlerts.enabled.
 * Writes an in-app notification with up to 5 fresh matches.
 */
export async function sendJobAlertDigests({ maxUsers = 80 } = {}) {
  const db = getFirestore();
  const usersSnap = await db.collection("users").limit(400).get();
  let processed = 0;
  let notified = 0;
  let errors = 0;

  for (const doc of usersSnap.docs) {
    if (processed >= maxUsers) break;
    const data = doc.data() || {};
    const prefs = data.profile?.preferences || {};
    const alerts = prefs.jobAlerts || {};
    if (!alerts.enabled) continue;
    processed += 1;

    try {
      const search =
        String(alerts.query || prefs.jobType || data.profile?.headline || "").trim() || "software engineer";
      const result = await searchBoardJobs({
        search,
        page: 1,
        pageSize: 5,
        filters: { postedWithinDays: 2 },
      });
      const jobs = result?.jobs || [];
      if (!jobs.length) continue;

      const lines = jobs
        .slice(0, 5)
        .map((j) => `• ${j.title} @ ${j.company || j.co || "Company"}`)
        .join("\n");

      await db.collection("notifications").add({
        userId: doc.id,
        icon: "jobs",
        title: "Your job alert digest",
        description: `${jobs.length} fresh match${jobs.length === 1 ? "" : "es"} for “${search}”:\n${lines}`,
        color: "#388bfd",
        type: "job_alert",
        read: false,
        link: "/dashboard/jobs",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await doc.ref.set(
        {
          profile: {
            preferences: {
              jobAlerts: {
                ...alerts,
                lastSentAt: new Date().toISOString(),
              },
            },
          },
        },
        { merge: true },
      );
      notified += 1;
    } catch (err) {
      errors += 1;
      console.error("[sendJobAlertDigests]", doc.id, err.message);
    }
  }

  return { processed, notified, errors };
}
