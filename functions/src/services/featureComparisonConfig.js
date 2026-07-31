import { admin, getFirestore } from "../config/firebase.js";
import { ApiError } from "../middleware/errors.js";
import { DEFAULT_FEATURE_COMPARISON } from "../constants/featureComparisonDefaults.js";
import { ensureHashedId, ensureHashedIds, isHashedId } from "../utils/hashedId.js";

const DOC = "featureComparison";
const CACHE_TTL_MS = 60_000;
let cache = { data: null, expiresAt: 0 };

function cloneDefaults() {
  return structuredClone(DEFAULT_FEATURE_COMPARISON);
}

function migrateLegacyComparison(raw) {
  if (raw?.columns && raw?.rows) return raw;
  // Legacy pricingComparison array on old pricing docs may be passed in.
  if (Array.isArray(raw) || Array.isArray(raw?.pricingComparison)) {
    const rows = Array.isArray(raw) ? raw : raw.pricingComparison;
    return {
      title: "Feature Comparison",
      columns: cloneDefaults().columns,
      rows: rows.map((r) =>
        ensureHashedId({
          feature: r.feature || "",
          values: {
            free: r.freeDetail ?? (r.freeIncluded ? "Included" : "-"),
            monthly: r.proDetail ?? (r.proIncluded ? "Included" : "-"),
            yearly: r.proDetail ?? (r.proIncluded ? "Included" : "-"),
            lifetime: r.proDetail ?? (r.proIncluded ? "Included" : "-"),
          },
        }),
      ),
    };
  }
  return null;
}

function normalize(data) {
  const base = cloneDefaults();
  const migrated = migrateLegacyComparison(data) || data || {};
  const columns = ensureHashedIds(
    (Array.isArray(migrated.columns) && migrated.columns.length
      ? migrated.columns
      : base.columns
    ).map((c) => ({
      ...c,
      key: String(c.key || c.planKey || ""),
      label: String(c.label || c.key || ""),
      planKey: c.planKey || c.key || "",
    })),
  );
  const rows = ensureHashedIds(
    (Array.isArray(migrated.rows) && migrated.rows.length ? migrated.rows : base.rows).map((r) => ({
      feature: String(r.feature || ""),
      values: r.values && typeof r.values === "object" ? r.values : {},
      ...(r.id && isHashedId(r.id) ? { id: r.id } : {}),
    })),
  );
  return {
    title: String(migrated.title || base.title),
    columns,
    rows,
  };
}

export function invalidateFeatureComparisonCache() {
  cache = { data: null, expiresAt: 0 };
}

export async function getFeatureComparison({ fresh = false } = {}) {
  if (!fresh && cache.data && Date.now() < cache.expiresAt) return cache.data;
  const db = getFirestore();
  const ref = db.collection("config").doc(DOC);
  const snap = await ref.get();
  let data;
  if (!snap.exists) {
    data = cloneDefaults();
    await ref.set({
      ...data,
      seeded: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    data = normalize(snap.data());
  }
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export async function updateFeatureComparison(patch, uid) {
  if (!patch || typeof patch !== "object") {
    throw new ApiError("invalid-argument", "Request body must be an object");
  }
  const next = normalize(patch);
  if (!next.columns.length) {
    throw new ApiError("invalid-argument", "columns must be a non-empty array");
  }
  const db = getFirestore();
  await db.collection("config").doc(DOC).set({
    ...next,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: uid || null,
  });
  invalidateFeatureComparisonCache();
  return getFeatureComparison({ fresh: true });
}
