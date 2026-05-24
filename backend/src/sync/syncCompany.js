import { admin, getFirestore } from "../config/firebase.js";
import { env } from "../config/env.js";
import { sha1, jobIdFor } from "../utils/hash.js";
import { companyChanged, jobFingerprint } from "./gates.js";
import { fetchListing } from "./fetchListing.js";
import { fetchDetail, fetchBambooRawIndex } from "./fetchDetail.js";
import { callEnrich } from "./callEnrich.js";

const HTML_MAX = 80_000;
const DEFAULT_TTL_DAYS = 14;

function clip(s, max) {
  if (!s) return "";
  const str = String(s);
  return str.length > max ? str.slice(0, max) + " [...truncated]" : str;
}

function enqueueRetry(stage, payload, attempts = 0, error = "") {
  const now = admin.firestore.Timestamp.now();
  const nextAttempt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + Math.min(2 ** attempts, 30) * 60_000,
  );
  return {
    stage,
    companySlug: payload.companySlug,
    externalId: payload.externalId || null,
    payload,
    attempts,
    lastError: error || "",
    lastAttemptAt: now,
    nextAttemptAt: nextAttempt,
  };
}

export async function syncCompany(company, options = {}) {
  const { dryRun = env.syncDryRun, force = false, skipExpire = false } =
    options;
  const db = getFirestore();
  const startedAt = Date.now();
  const counters = {
    skipped: false,
    jobsAdded: 0,
    jobsUpdated: 0,
    jobsExpired: 0,
    errors: [],
  };

  const listing = await fetchListing(company.ats, company.slug);
  if (!listing.ok) {
    counters.errors.push(listing.error || `listing ${listing.status}`);
    if (!dryRun) {
      await db
        .collection("companies")
        .doc(company.slug)
        .set(
          {
            lastSyncAt: new Date().toISOString(),
            syncFailures: (company.syncFailures || 0) + 1,
            lastError: counters.errors[0] || "",
          },
          { merge: true },
        );
    }
    counters.skipped = true;
    return counters;
  }

  const snapshot = {
    jobCount: listing.jobCount,
    indiaJobCount: listing.indiaJobCount,
    latestUpdatedAt: listing.latestUpdatedAt || "",
  };
  const indiaJobs = listing.indiaJobs || [];

  const changed = force || companyChanged(company, snapshot);
  if (!changed) {
    if (!dryRun) {
      await db
        .collection("companies")
        .doc(company.slug)
        .set(
          {
            lastSyncAt: new Date().toISOString(),
            syncFailures: 0,
            jobCount: snapshot.jobCount,
            indiaJobCount: snapshot.indiaJobCount,
          },
          { merge: true },
        );
    }
    counters.skipped = true;
    return counters;
  }

  const existingSnap = await db
    .collection("jobs")
    .where("companySlug", "==", company.slug)
    .where("ats", "==", company.ats)
    .get();
  const existing = new Map();
  for (const doc of existingSnap.docs) {
    const d = doc.data();
    existing.set(String(d.externalId), {
      ref: doc.ref,
      fingerprint: d.fingerprint || "",
      status: d.status || "ACTIVE",
    });
  }

  const toProcess = [];
  for (const job of indiaJobs) {
    const fp = jobFingerprint({
      title: job.title,
      location: job.location,
      updatedAt: job.updatedAt,
    });
    const prev = existing.get(String(job.id));
    if (!force && prev && prev.fingerprint === fp && prev.status === "ACTIVE") {
      continue;
    }
    toProcess.push({ job, fingerprint: fp });
  }

  let bambooIndex = null;
  if (company.ats === "bamboohr" && toProcess.length > 0) {
    bambooIndex = await fetchBambooRawIndex(company.slug);
  }

  for (const { job, fingerprint } of toProcess) {
    const jobId = jobIdFor(company.ats, company.slug, job.id);
    const prefetched = bambooIndex ? bambooIndex.get(String(job.id)) : null;

    const detailRes = await fetchDetail(
      company.ats,
      company.slug,
      job.id,
      prefetched,
    );
    if (!detailRes.ok) {
      counters.errors.push(`detail ${jobId}: ${detailRes.error}`);
      if (!dryRun) {
        await db
          .collection("retry_queue")
          .doc(`detail:${jobId}`)
          .set(
            enqueueRetry("detail", { companySlug: company.slug, externalId: job.id, ats: company.ats }, 0, detailRes.error),
          );
      }
      continue;
    }
    const detail = detailRes.detail;

    const enrich = await callEnrich({
      descriptionHtml: detail.descriptionHtml,
      plainText: detail.plainText,
    });

    const html = clip(detail.descriptionHtml, HTML_MAX);

    const finalJob = {
      source: `ats:${company.ats}`,
      ats: company.ats,
      companySlug: company.slug,
      externalId: String(job.id),

      title: detail.title || job.title,
      company: company.name || company.slug,
      location: detail.location || job.location,
      applyUrl: detail.applyUrl || job.applyUrl,
      salary: detail.salary || "",
      department: detail.department || "",
      remote: !!(detail.remote || enrich.remote),
      employmentType: detail.employmentType || enrich.employmentType || "full-time",
      postedAt: detail.postedAt || "",
      updatedAt: detail.updatedAt || job.updatedAt || "",

      descriptionHtml: html,

      skills: enrich.skills || [],
      experience: enrich.experience || "",
      seniority: enrich.seniority || "mid",
      role: enrich.role || "engineering",

      status: enrich.partial ? "RETRY_ENRICHMENT" : "ACTIVE",
      fingerprint,
      indexedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(
        Date.now() + DEFAULT_TTL_DAYS * 86_400_000,
      ),
    };

    if (!dryRun) {
      await db.collection("jobs").doc(jobId).set(finalJob, { merge: true });
    }
    if (existing.has(String(job.id))) {
      counters.jobsUpdated += 1;
    } else {
      counters.jobsAdded += 1;
    }
  }

  const indiaIds = new Set(indiaJobs.map((j) => String(j.id)));
  const stillSeen = [];
  for (const [externalId, info] of existing.entries()) {
    if (indiaIds.has(externalId) && info.status === "ACTIVE") {
      stillSeen.push(info.ref);
    }
  }
  if (!dryRun && stillSeen.length) {
    const batch = db.batch();
    for (const ref of stillSeen) {
      batch.set(
        ref,
        {
          lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromMillis(
            Date.now() + DEFAULT_TTL_DAYS * 86_400_000,
          ),
        },
        { merge: true },
      );
    }
    await batch.commit();
  }

  if (!skipExpire && !dryRun) {
    const expirations = [];
    for (const [externalId, info] of existing.entries()) {
      if (!indiaIds.has(externalId) && info.status === "ACTIVE") {
        expirations.push(info.ref);
      }
    }
    if (expirations.length) {
      const batch = db.batch();
      const now = admin.firestore.FieldValue.serverTimestamp();
      for (const ref of expirations) {
        batch.set(ref, { status: "EXPIRED", expiredAt: now }, { merge: true });
      }
      await batch.commit();
      counters.jobsExpired = expirations.length;
    }
  }

  if (!dryRun) {
    await db.collection("companies").doc(company.slug).set(
      {
        jobCount: snapshot.jobCount,
        indiaJobCount: snapshot.indiaJobCount,
        latestUpdatedAt: snapshot.latestUpdatedAt,
        lastSyncAt: new Date().toISOString(),
        syncFailures: 0,
        lastError: "",
      },
      { merge: true },
    );
  }

  counters.elapsedMs = Date.now() - startedAt;
  return counters;
}
