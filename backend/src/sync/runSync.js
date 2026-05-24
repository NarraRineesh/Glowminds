import { admin, getFirestore } from "../config/firebase.js";
import { env } from "../config/env.js";
import { ATS_IDS, getPlatform } from "../config/platforms.js";
import { syncCompany } from "./syncCompany.js";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function listCompaniesForAts(ats, { limit, slugs } = {}) {
  const db = getFirestore();
  if (slugs && slugs.length) {
    const docs = await Promise.all(
      slugs.map((s) => db.collection("companies").doc(s).get()),
    );
    return docs
      .filter((d) => d.exists)
      .map((d) => ({ id: d.id, ...d.data() }));
  }
  let q = db
    .collection("companies")
    .where("ats", "==", ats)
    .where("active", "==", true);
  if (limit) q = q.limit(limit);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function runWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = { error: err?.message || String(err) };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function runProvider(ats, options = {}) {
  const platform = getPlatform(ats);
  const concurrency = Math.min(
    options.concurrency || env.syncConcurrency,
    platform.concurrency || env.syncConcurrency,
  );
  const startedAt = new Date();
  const db = getFirestore();

  const companies = await listCompaniesForAts(ats, {
    limit: options.limit,
    slugs: options.slugs,
  });

  console.log(
    `[sync:${ats}] starting (${companies.length} companies, concurrency=${concurrency})`,
  );

  const summary = {
    provider: ats,
    startedAt: startedAt.toISOString(),
    finishedAt: null,
    companiesScanned: 0,
    companiesSkipped: 0,
    jobsAdded: 0,
    jobsUpdated: 0,
    jobsExpired: 0,
    errors: [],
  };

  await runWithConcurrency(companies, concurrency, async (company) => {
    summary.companiesScanned += 1;
    try {
      const r = await syncCompany(company, {
        dryRun: options.dryRun,
        force: options.force,
      });
      if (r.skipped) summary.companiesSkipped += 1;
      summary.jobsAdded += r.jobsAdded || 0;
      summary.jobsUpdated += r.jobsUpdated || 0;
      summary.jobsExpired += r.jobsExpired || 0;
      if (r.errors?.length) {
        for (const e of r.errors) {
          summary.errors.push({ slug: company.slug, message: e });
        }
      }
    } catch (err) {
      summary.errors.push({
        slug: company.slug,
        message: err?.message || String(err),
      });
    }
    if (platform.delayMs) await sleep(platform.delayMs);
  });

  summary.finishedAt = new Date().toISOString();
  summary.elapsedMs = Date.now() - startedAt.getTime();

  if (!options.dryRun) {
    const runId = `${ats}-${startedAt.getTime()}`;
    await db
      .collection("sync_runs")
      .doc(runId)
      .set({
        ...summary,
        errors: summary.errors.slice(0, 50),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  console.log(
    `[sync:${ats}] done in ${summary.elapsedMs}ms: +${summary.jobsAdded} ~${summary.jobsUpdated} -${summary.jobsExpired} (${summary.companiesScanned}/${summary.companiesSkipped} scanned/skipped, ${summary.errors.length} errors)`,
  );

  return summary;
}

export async function runAllProviders(options = {}) {
  const out = [];
  for (const ats of ATS_IDS) {
    out.push(await runProvider(ats, options));
  }
  return out;
}
