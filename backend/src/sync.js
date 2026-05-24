/**
 * Manual job-board sync (one-shot only).
 *
 * This script intentionally has NO cron / daemon mode — it only runs when you
 * invoke it explicitly via `npm run sync`. All scheduling should happen
 * outside the app (cron, GitHub Actions, etc.) so the API server is never
 * coupled to the background sync workload.
 *
 * Examples:
 *   npm run sync                       # sync every supported ATS, all companies
 *   npm run sync -- --provider lever   # only one provider
 *   npm run sync -- --slug stripe,brex # specific company slugs
 *   npm run sync -- --dry-run          # plan only, no Firestore writes
 *   npm run sync -- --limit 25 --concurrency 3
 */
import { getFirebaseApp, getFirestore } from "./config/firebase.js";
import { runProvider, runAllProviders } from "./sync/runSync.js";

function parseArgs(argv) {
  const args = { all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") args.all = true;
    else if (a === "--force") args.force = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--provider") args.provider = argv[++i];
    else if (a === "--slug")
      args.slugs = (argv[++i] || "").split(",").filter(Boolean);
    else if (a === "--limit") args.limit = parseInt(argv[++i], 10) || undefined;
    else if (a === "--concurrency")
      args.concurrency = parseInt(argv[++i], 10) || undefined;
  }
  return args;
}

async function main() {
  getFirebaseApp();
  const args = parseArgs(process.argv.slice(2));

  const opts = {
    dryRun: args.dryRun,
    force: args.force,
    limit: args.limit,
    slugs: args.slugs,
    concurrency: args.concurrency,
  };

  let summaries;
  if (args.all || (!args.provider && !args.slugs?.length)) {
    summaries = await runAllProviders(opts);
  } else if (args.provider) {
    summaries = [await runProvider(args.provider, opts)];
  } else if (args.slugs?.length) {
    const db = getFirestore();
    const docs = await Promise.all(
      args.slugs.map((s) => db.collection("companies").doc(s).get()),
    );
    const seen = new Set();
    summaries = [];
    for (const d of docs) {
      if (!d.exists) continue;
      const ats = d.data().ats;
      if (seen.has(ats)) continue;
      seen.add(ats);
      const slugsForAts = docs
        .filter((doc) => doc.exists && doc.data().ats === ats)
        .map((doc) => doc.id);
      summaries.push(await runProvider(ats, { ...opts, slugs: slugsForAts }));
    }
  }

  const totalErrors = summaries.reduce(
    (a, s) => a + (s.errors?.length || 0),
    0,
  );
  console.log(`[sync] complete. errors=${totalErrors}`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[sync] fatal:", err);
  process.exit(1);
});
