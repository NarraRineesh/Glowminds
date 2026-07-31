import { admin, getFirestore } from "../config/firebase.js";
import { ApiError } from "../middleware/errors.js";
import { DEFAULT_PRICING_FAQS } from "../constants/pricingFaqsDefaults.js";
import { ensureHashedIds, isHashedId } from "../utils/hashedId.js";

const DOC = "pricingFaqs";
const CACHE_TTL_MS = 60_000;
let cache = { data: null, expiresAt: 0 };

function cloneDefaults() {
  return structuredClone(DEFAULT_PRICING_FAQS);
}

function normalize(data) {
  const base = cloneDefaults();
  let faqs = [];
  if (Array.isArray(data?.faqs)) faqs = data.faqs;
  else if (Array.isArray(data?.pricingFaqs)) faqs = data.pricingFaqs;
  else if (Array.isArray(data)) faqs = data;

  if (!faqs.length) faqs = base.faqs;

  return {
    faqs: ensureHashedIds(
      faqs.map((f) => ({
        q: String(f?.q || ""),
        a: String(f?.a || ""),
        ...(f?.id && isHashedId(f.id) ? { id: f.id } : {}),
      })),
    ),
  };
}

export function invalidatePricingFaqsCache() {
  cache = { data: null, expiresAt: 0 };
}

export async function getPricingFaqs({ fresh = false } = {}) {
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

export async function updatePricingFaqs(patch, uid) {
  if (!patch || typeof patch !== "object") {
    throw new ApiError("invalid-argument", "Request body must be an object");
  }
  const next = normalize(patch);
  if (!Array.isArray(next.faqs)) {
    throw new ApiError("invalid-argument", "faqs must be an array");
  }
  const db = getFirestore();
  await db.collection("config").doc(DOC).set({
    ...next,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: uid || null,
  });
  invalidatePricingFaqsCache();
  return getPricingFaqs({ fresh: true });
}
