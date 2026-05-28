// Admin CRUD for the `companies/` collection.
//
// Every company doc carries enough config for the local `pipeline/` CLI to
// pull jobs from its ATS. `jobsApi` and `careersUrl` are derived from the
// platform registry — we compute them server-side instead of trusting the
// client. Live per-company sync is no longer exposed by the API (use the
// local pipeline to refresh).

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { ApiError } from "../../middleware/errors.js";
import { admin, getFirestore } from "../../config/firebase.js";
import { ATS_IDS, getPlatform } from "../../config/platforms.js";

const router = Router();

const SLUG_RE = /^[a-z0-9][a-z0-9-]*(?:\|wd\d+\|[a-z0-9-]+)?$/i;

function normalizeCompany(input = {}) {
  const slug = String(input.slug || "").trim();
  if (!SLUG_RE.test(slug)) {
    throw new ApiError(
      "invalid-argument",
      "Slug must be lowercase letters/numbers/hyphens (workday: company|wdN|siteId)",
    );
  }
  const ats = String(input.ats || "").trim();
  if (!ATS_IDS.includes(ats)) {
    throw new ApiError(
      "invalid-argument",
      `ats must be one of: ${ATS_IDS.join(", ")}`,
    );
  }
  const name = String(input.name || "").trim();
  if (!name) throw new ApiError("invalid-argument", "name is required");

  const platform = getPlatform(ats);
  const jobsApi = typeof platform.jobsApi === "function" ? platform.jobsApi(slug) : null;
  const careersUrl =
    typeof platform.careersUrl === "function" ? platform.careersUrl(slug) : null;

  return {
    name,
    slug,
    ats,
    website: input.website ? String(input.website).trim() : "",
    active: input.active !== false,
    jobsApi: jobsApi || "",
    careersUrl: careersUrl || "",
  };
}

function serializeCompany(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
    // Firestore timestamps → ISO strings for the wire.
    lastSyncAt:
      data.lastSyncAt?.toDate?.()?.toISOString?.() || data.lastSyncAt || null,
    createdAt:
      data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
    updatedAt:
      data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
  };
}

// GET /api/admin/companies
//   ?limit=25      page size (default 25, max 200)
//   &cursor=<slug> startAfter cursor (last slug of the previous page)
//   &ats=greenhouse  optional filter
//   &active=true|false
//   &q=<text>      case-insensitive name/slug substring search.
//                  When set, cursor is ignored — we scan up to SEARCH_POOL
//                  matching docs and return the first `limit` hits.
//
// Response: { companies, nextCursor, hasMore }
//   - nextCursor: pass this back as ?cursor= on the next request, or null
//   - hasMore: true when there's likely another page (results filled the limit)
//
// Total counts for the admin UI come from /api/admin/overview — we
// intentionally don't COUNT here so each page fetch stays one round-trip.
const LIST_DEFAULT = 25;
const LIST_MAX = 200;
const SEARCH_POOL = 500;

router.get("/companies", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getFirestore();
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || LIST_DEFAULT, 1),
      LIST_MAX,
    );
    const ats = req.query.ats ? String(req.query.ats) : null;
    const activeRaw = req.query.active;
    const cursor = req.query.cursor ? String(req.query.cursor) : null;
    const q = req.query.q ? String(req.query.q).trim().toLowerCase() : "";

    let base = db.collection("companies");
    if (ats) base = base.where("ats", "==", ats);
    if (activeRaw === "true") base = base.where("active", "==", true);
    if (activeRaw === "false") base = base.where("active", "==", false);

    // Search path: Firestore can't do substring matches natively, so we
    // pull a bounded pool and filter in-memory. Good enough for an admin
    // tool with hundreds of companies; switch to a search field index
    // (e.g. lowercase name array) if this ever holds you back.
    if (q) {
      const snap = await base.limit(SEARCH_POOL).get();
      const matches = snap.docs
        .map(serializeCompany)
        .filter(
          (c) =>
            (c.name || "").toLowerCase().includes(q) ||
            (c.slug || "").toLowerCase().includes(q),
        )
        .slice(0, limit);
      return res.json({
        companies: matches,
        nextCursor: null,
        hasMore: false,
        searched: true,
      });
    }

    // Cursor pagination path. Order by `slug` (always equal to the doc id
    // for this collection) so cursors are plain strings the client can
    // safely round-trip in URLs.
    let queryRef = base.orderBy("slug").limit(limit);
    if (cursor) queryRef = queryRef.startAfter(cursor);

    const snap = await queryRef.get();
    const companies = snap.docs.map(serializeCompany);
    const hasMore = companies.length === limit;
    const nextCursor = hasMore ? companies[companies.length - 1].slug : null;

    res.json({ companies, nextCursor, hasMore });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

// GET /api/admin/companies/:slug
router.get(
  "/companies/:slug",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db = getFirestore();
      const doc = await db.collection("companies").doc(req.params.slug).get();
      if (!doc.exists) throw new ApiError("not-found", "Company not found");
      res.json({ company: serializeCompany(doc) });
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

// POST /api/admin/companies
router.post("/companies", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = normalizeCompany(req.body || {});
    const db = getFirestore();
    const ref = db.collection("companies").doc(payload.slug);
    const existing = await ref.get();
    if (existing.exists) {
      throw new ApiError("already-exists", "Company with this slug exists");
    }
    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.set({
      ...payload,
      jobCount: 0,
      indiaJobCount: 0,
      syncFailures: 0,
      lastError: "",
      lastSyncAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const saved = await ref.get();
    res.status(201).json({ company: serializeCompany(saved) });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

// POST /api/admin/companies/bulk
//
// Body: { companies: [{ name, slug, ats, website?, active? }, ...] }
//   or: [...] (raw array)
//
// Each item is normalized + validated independently — runtime fields like
// `jobsApi`, `careersUrl`, `jobCount`, `indiaJobCount` are recomputed/
// initialised, so you can paste the same shape you'd export from the admin
// UI (extra keys are ignored).
//
// Response:
//   {
//     summary: { total, created, skipped, failed },
//     results: [{ index, slug, status: "created"|"skipped"|"error", reason? }]
//   }
//
// Skipped == slug already exists. Errors include validation failures and
// per-row Firestore errors. The endpoint is best-effort: a bad row never
// stops the rest.
//
// The cap below is a safety valve; the frontend chunks larger uploads
// into multiple requests so user-facing payloads are effectively unlimited.
const BULK_MAX = 1000;

router.post(
  "/companies/bulk",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const raw = Array.isArray(req.body)
        ? req.body
        : Array.isArray(req.body?.companies)
          ? req.body.companies
          : null;

      if (!raw) {
        throw new ApiError(
          "invalid-argument",
          "Expected an array of companies or { companies: [...] }",
        );
      }
      if (raw.length === 0) {
        throw new ApiError("invalid-argument", "No companies provided");
      }
      if (raw.length > BULK_MAX) {
        throw new ApiError(
          "invalid-argument",
          `Too many companies (max ${BULK_MAX}); split into smaller batches`,
        );
      }

      const db = getFirestore();
      const now = admin.firestore.FieldValue.serverTimestamp();
      const results = [];
      const summary = { total: raw.length, created: 0, skipped: 0, failed: 0 };

      // Process serially so we don't blow past Firestore's per-second
      // write quotas on a 500-item paste. Still finishes in seconds.
      for (let i = 0; i < raw.length; i += 1) {
        const item = raw[i];
        try {
          const payload = normalizeCompany(item || {});
          const ref = db.collection("companies").doc(payload.slug);
          const existing = await ref.get();
          if (existing.exists) {
            results.push({
              index: i,
              slug: payload.slug,
              status: "skipped",
              reason: "Already exists",
            });
            summary.skipped += 1;
            continue;
          }
          await ref.set({
            ...payload,
            jobCount: 0,
            indiaJobCount: 0,
            syncFailures: 0,
            lastError: "",
            lastSyncAt: null,
            createdAt: now,
            updatedAt: now,
          });
          results.push({
            index: i,
            slug: payload.slug,
            status: "created",
          });
          summary.created += 1;
        } catch (err) {
          results.push({
            index: i,
            slug: item?.slug || null,
            status: "error",
            reason: err?.message || String(err),
          });
          summary.failed += 1;
        }
      }

      res.json({ summary, results });
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

// PATCH /api/admin/companies/:slug — partial update (name/website/active).
// Slug + ats are immutable here; recreate the doc if you need to change them.
router.patch(
  "/companies/:slug",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db = getFirestore();
      const ref = db.collection("companies").doc(req.params.slug);
      const existing = await ref.get();
      if (!existing.exists) throw new ApiError("not-found", "Company not found");

      const patch = {};
      if (typeof req.body?.name === "string") patch.name = req.body.name.trim();
      if (typeof req.body?.website === "string") patch.website = req.body.website.trim();
      if (typeof req.body?.active === "boolean") patch.active = req.body.active;
      if (!Object.keys(patch).length) {
        throw new ApiError("invalid-argument", "Nothing to update");
      }
      patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await ref.set(patch, { merge: true });
      const saved = await ref.get();
      res.json({ company: serializeCompany(saved) });
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

// DELETE /api/admin/companies/:slug
// Does NOT delete jobs ingested for this company — those age out naturally.
router.delete(
  "/companies/:slug",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db = getFirestore();
      const ref = db.collection("companies").doc(req.params.slug);
      const existing = await ref.get();
      if (!existing.exists) throw new ApiError("not-found", "Company not found");
      await ref.delete();
      res.status(204).end();
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  },
);

export default router;
