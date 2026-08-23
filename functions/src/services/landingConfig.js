import { admin, getFirestore } from "../config/firebase.js";
import { DEFAULT_LANDING_CONFIG } from "../constants/landingDefaults.js";
import {
  decryptPricingPayload,
  encryptPricingPayload,
  isPricingEncryptionEnabled,
} from "../utils/pricingCrypto.js";

const CACHE_TTL_MS = 60_000;
let cache = { data: null, expiresAt: 0 };

const LANDING_META_KEYS = new Set([
  "encrypted",
  "algorithm",
  "iv",
  "tag",
  "ciphertext",
  "updatedAt",
  "updatedBy",
  "seeded",
]);

function cloneDefaults() {
  return structuredClone(DEFAULT_LANDING_CONFIG);
}

function isStaleLandingCopy(value) {
  return /98765\s*43210|HSR Layout|52,?000|52K\+|94%/.test(JSON.stringify(value || {}));
}

function rewriteStaleLanding(config) {
  if (!isStaleLandingCopy(config)) return config;
  const defaults = cloneDefaults();
  return {
    ...config,
    heroMetrics: defaults.heroMetrics,
    stats: defaults.stats,
    aboutMetrics: defaults.aboutMetrics,
    socialProof: defaults.socialProof,
    contactInfo: defaults.contactInfo,
  };
}


function mergeWithDefaults(data) {
  const base = cloneDefaults();
  if (!data || typeof data !== "object") return base;

  return {
    ...base,
    ...data,
    heroMetrics: Array.isArray(data.heroMetrics) ? data.heroMetrics : base.heroMetrics,
    stats: { ...base.stats, ...(data.stats || {}) },
    aboutMetrics: Array.isArray(data.aboutMetrics) ? data.aboutMetrics : base.aboutMetrics,
    socialProof: { ...base.socialProof, ...(data.socialProof || {}) },
    contactInfo: Array.isArray(data.contactInfo) ? data.contactInfo : base.contactInfo,
  };
}

function landingFieldsFromDoc(data) {
  if (!data || typeof data !== "object") return {};
  if (data.encrypted === true) {
    return decryptPricingPayload({
      iv: data.iv,
      tag: data.tag,
      data: data.ciphertext,
    });
  }

  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (!LANDING_META_KEYS.has(key)) out[key] = value;
  }
  return out;
}

function buildStoredLandingDoc(config, { uid, seeded = false } = {}) {
  const meta = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: uid || null,
    ...(seeded ? { seeded: true } : {}),
  };

  if (isPricingEncryptionEnabled()) {
    const enc = encryptPricingPayload(config);
    return {
      encrypted: true,
      algorithm: "aes-256-gcm",
      iv: enc.iv,
      tag: enc.tag,
      ciphertext: enc.data,
      ...meta,
    };
  }

  return { ...config, ...meta };
}

export function landingConfigForPublicApi(config) {
  if (!isPricingEncryptionEnabled()) {
    return { config };
  }
  const enc = encryptPricingPayload(config);
  return {
    encrypted: true,
    v: 1,
    algorithm: "aes-256-gcm",
    ...enc,
  };
}

export async function getLandingConfig({ fresh = false } = {}) {
  if (!fresh && cache.data && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const db = getFirestore();
  const ref = db.collection("config").doc("landing");
  const snap = await ref.get();

  let config;
  if (!snap.exists) {
    config = cloneDefaults();
    await ref.set(buildStoredLandingDoc(config, { seeded: true }));
  } else {
    const raw = snap.data();
    const fields = landingFieldsFromDoc(raw);
    const shouldBackfillDefaults =
      !fields.stats || !fields.aboutMetrics || !fields.socialProof || !fields.contactInfo;
    config = rewriteStaleLanding(mergeWithDefaults(fields));
    if (
      shouldBackfillDefaults ||
      isStaleLandingCopy(fields) ||
      (isPricingEncryptionEnabled() && raw?.encrypted !== true)
    ) {
      await ref.set(buildStoredLandingDoc(config, { uid: raw?.updatedBy || null }));
    }
  }

  cache = { data: config, expiresAt: Date.now() + CACHE_TTL_MS };
  return config;
}
