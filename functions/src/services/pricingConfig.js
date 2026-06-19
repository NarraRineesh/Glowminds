import { admin, getFirestore } from "../config/firebase.js";
import { ApiError } from "../middleware/errors.js";
import { DEFAULT_PRICING_CONFIG } from "../constants/pricingDefaults.js";
import {
  decryptPricingPayload,
  encryptPricingPayload,
  isPricingEncryptionEnabled,
} from "../utils/pricingCrypto.js";

const CACHE_TTL_MS = 60_000;
let cache = { data: null, expiresAt: 0 };

function cloneDefaults() {
  return structuredClone(DEFAULT_PRICING_CONFIG);
}

function formatDisplayPrice(symbol, amountInr) {
  return `${symbol}${amountInr}`;
}

function syncDerivedPricingFields(config) {
  const symbol = config.currencySymbol || "₹";
  const yearly = config.plans?.yearly;
  const monthly = config.plans?.monthly;

  if (yearly?.amountPaise != null) {
    const yearlyInr = Math.round(yearly.amountPaise / 100);
    yearly.displayPrice = formatDisplayPrice(symbol, yearlyInr);
    if (config.pricing?.pro) {
      config.pricing.pro.price = yearly.displayPrice;
      config.pricing.pro.period = yearly.period || "/year";
    }
    const monthlyEq = Math.max(1, Math.round(yearlyInr / 12));
    config.marketing = config.marketing || {};
    if (!config.marketing.monthlyEquivalent) {
      config.marketing.monthlyEquivalent = `${symbol}${monthlyEq}/month`;
    }
    if (!config.marketing.proTagline) {
      config.marketing.proTagline =
        `Just ${symbol}${monthlyEq}/month billed yearly — less than a cup of coffee`;
    }
    if (!config.marketing.billingBlurb) {
      config.marketing.billingBlurb =
        `One payment of ${yearly.displayPrice}${yearly.period || "/year"} — about ${symbol}${monthlyEq}/month. Secure checkout via Razorpay (UPI, cards, net banking).`;
    }
    if (!config.marketing.termsBillingText) {
      config.marketing.termsBillingText =
        `Pro subscriptions are billed annually at ${yearly.displayPrice}${yearly.period || "/year"}. Payments are processed securely through Razorpay. You can cancel your subscription at any time from your dashboard. Cancellations take effect at the end of the current billing period.`;
    }
  }

  if (monthly?.amountPaise != null) {
    const monthlyInr = Math.round(monthly.amountPaise / 100);
    monthly.displayPrice = formatDisplayPrice(symbol, monthlyInr);
  }

  return config;
}

function mergeWithDefaults(data) {
  const base = cloneDefaults();
  if (!data || typeof data !== "object") return syncDerivedPricingFields(base);

  const merged = {
    ...base,
    ...data,
    plans: {
      ...base.plans,
      ...(data.plans || {}),
      yearly: normalizePlanFields({ ...base.plans.yearly, ...(data.plans?.yearly || {}) }),
      monthly: normalizePlanFields({ ...base.plans.monthly, ...(data.plans?.monthly || {}) }),
    },
    freeLimits: { ...base.freeLimits, ...(data.freeLimits || {}) },
    proLimits: { ...base.proLimits, ...(data.proLimits || {}) },
    creditCosts: { ...base.creditCosts, ...(data.creditCosts || {}) },
    pricing: {
      free: { ...base.pricing.free, ...(data.pricing?.free || {}) },
      pro: { ...base.pricing.pro, ...(data.pricing?.pro || {}) },
    },
    marketing: { ...base.marketing, ...(data.marketing || {}) },
    freeFeatures: Array.isArray(data.freeFeatures) ? data.freeFeatures : base.freeFeatures,
    proFeatures: Array.isArray(data.proFeatures) ? data.proFeatures : base.proFeatures,
    pricingComparison: Array.isArray(data.pricingComparison)
      ? data.pricingComparison
      : base.pricingComparison,
    pricingFaqs: Array.isArray(data.pricingFaqs) ? data.pricingFaqs : base.pricingFaqs,
  };

  if (merged.plans.yearly?.amountPaise === 39900) {
    merged.plans.yearly = { ...merged.plans.yearly, ...base.plans.yearly };
  }
  if (merged.plans.monthly?.amountPaise === 4900) {
    merged.plans.monthly = { ...merged.plans.monthly, ...base.plans.monthly };
  }

  return syncDerivedPricingFields(merged);
}

export function invalidatePricingCache() {
  cache = { data: null, expiresAt: 0 };
}

const PRICING_META_KEYS = new Set([
  "encrypted",
  "algorithm",
  "iv",
  "tag",
  "ciphertext",
  "updatedAt",
  "updatedBy",
  "seeded",
]);

function pricingFieldsFromDoc(data) {
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
    if (!PRICING_META_KEYS.has(key)) out[key] = value;
  }
  return out;
}

function buildStoredPricingDoc(config, { uid, seeded = false } = {}) {
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

/** Public API wire format — encrypt JSON when a key is configured. */
export function pricingConfigForPublicApi(config) {
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

export async function getPricingConfig({ fresh = false } = {}) {
  if (!fresh && cache.data && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const db = getFirestore();
  const ref = db.collection("config").doc("pricing");
  const snap = await ref.get();

  let config;
  if (!snap.exists) {
    config = cloneDefaults();
    await ref.set(buildStoredPricingDoc(config, { seeded: true }));
  } else {
    const raw = snap.data();
    config = mergeWithDefaults(pricingFieldsFromDoc(raw));
    // Re-write plaintext docs as encrypted once a key is configured.
    if (isPricingEncryptionEnabled() && raw?.encrypted !== true) {
      await ref.set(buildStoredPricingDoc(config, { uid: raw?.updatedBy || null }));
    }
  }

  cache = { data: config, expiresAt: Date.now() + CACHE_TTL_MS };
  return config;
}

function toPositiveInt(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

function toNonNegativeInt(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

function normalizePlanFields(plan) {
  if (!plan || typeof plan !== "object") return plan;
  const amountPaise = toPositiveInt(plan.amountPaise);
  const durationDays = toPositiveInt(plan.durationDays);
  return {
    ...plan,
    ...(amountPaise != null ? { amountPaise } : {}),
    ...(durationDays != null ? { durationDays } : {}),
  };
}

function validatePlan(plan, label) {
  if (!plan || typeof plan !== "object") {
    throw new ApiError("invalid-argument", `${label} plan is required`);
  }
  const amountPaise = toPositiveInt(plan.amountPaise);
  if (amountPaise == null) {
    throw new ApiError("invalid-argument", `${label} amountPaise must be a positive integer`);
  }
  const durationDays = toPositiveInt(plan.durationDays);
  if (durationDays == null) {
    throw new ApiError("invalid-argument", `${label} durationDays must be a positive integer`);
  }
}

function validatePricingPatch(patch) {
  if (!patch || typeof patch !== "object") {
    throw new ApiError("invalid-argument", "Request body must be an object");
  }

  if (patch.plans) {
    for (const [id, plan] of Object.entries(patch.plans)) {
      if (!plan || typeof plan !== "object") continue;
      if (plan.amountPaise != null && toPositiveInt(plan.amountPaise) == null) {
        throw new ApiError("invalid-argument", `${id} amountPaise must be a positive integer`);
      }
      if (plan.durationDays != null && toPositiveInt(plan.durationDays) == null) {
        throw new ApiError("invalid-argument", `${id} durationDays must be a positive integer`);
      }
    }
  }

  if (patch.freeLimits) {
    const { applications, resumes } = patch.freeLimits;
    if (applications != null && toNonNegativeInt(applications) == null) {
      throw new ApiError("invalid-argument", "freeLimits.applications must be a non-negative integer");
    }
    if (resumes != null && toNonNegativeInt(resumes) == null) {
      throw new ApiError("invalid-argument", "freeLimits.resumes must be a non-negative integer");
    }
  }

  for (const key of ["freeFeatures", "proFeatures", "pricingComparison", "pricingFaqs"]) {
    if (patch[key] != null && !Array.isArray(patch[key])) {
      throw new ApiError("invalid-argument", `${key} must be an array`);
    }
  }
}

function validatePricingConfig(config) {
  validatePlan(config.plans?.yearly, "yearly");
  validatePlan(config.plans?.monthly, "monthly");
}

export async function updatePricingConfig(patch, uid) {
  validatePricingPatch(patch);
  const current = await getPricingConfig({ fresh: true });
  const next = mergeWithDefaults({ ...current, ...patch, plans: {
    ...current.plans,
    ...(patch.plans || {}),
    yearly: normalizePlanFields({ ...current.plans.yearly, ...(patch.plans?.yearly || {}) }),
    monthly: normalizePlanFields({ ...current.plans.monthly, ...(patch.plans?.monthly || {}) }),
  } });

  validatePricingConfig(next);

  const db = getFirestore();
  await db.collection("config").doc("pricing").set(
    buildStoredPricingDoc(next, { uid }),
    { merge: false },
  );

  invalidatePricingCache();
  return getPricingConfig({ fresh: true });
}

/** Map pricing config plans to Razorpay `{ amount, label, durationDays }` shape. */
export function billingPlansFromConfig(config) {
  const cfg = config || DEFAULT_PRICING_CONFIG;
  const out = {};
  for (const id of ["yearly", "monthly"]) {
    const p = cfg.plans?.[id];
    if (!p) continue;
    out[id] = {
      amount: p.amountPaise,
      label: p.label,
      durationDays: p.durationDays,
    };
  }
  return out;
}
