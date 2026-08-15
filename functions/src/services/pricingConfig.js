import { admin, getFirestore } from "../config/firebase.js";
import { ApiError } from "../middleware/errors.js";
import { DEFAULT_PRICING_CONFIG } from "../constants/pricingDefaults.js";
import {
  FREE_CREDIT_FEATURES,
  PRO_ONLY_CREDIT_FEATURES,
} from "../constants/featureAccess.js";
import {
  decryptPricingPayload,
  encryptPricingPayload,
  isPricingEncryptionEnabled,
} from "../utils/pricingCrypto.js";
import { ensureHashedId, ensureHashedIds, isHashedId, newHashedId } from "../utils/hashedId.js";

const CACHE_TTL_MS = 60_000;
let cache = { data: null, expiresAt: 0 };

function cloneDefaults() {
  return structuredClone(DEFAULT_PRICING_CONFIG);
}

function toNonNegativeInt(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

function toIntOrNegOne(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < -1) return null;
  return n;
}

/** Normalize legacy plans map → array. */
function coercePlansArray(rawPlans, basePlans) {
  if (Array.isArray(rawPlans) && rawPlans.length) {
    return rawPlans.map((p) => ensureHashedId({ ...p }));
  }
  if (rawPlans && typeof rawPlans === "object") {
    const fromMap = Object.entries(rawPlans).map(([key, plan]) =>
      ensureHashedId({
        key: plan?.key || key,
        ...plan,
        id: isHashedId(plan?.id) ? plan.id : undefined,
      }),
    );
    if (fromMap.length) return fromMap;
  }
  return structuredClone(basePlans);
}

function migrateCreditPolicies(data, basePolicies) {
  if (Array.isArray(data?.creditPolicies) && data.creditPolicies.length) {
    return data.creditPolicies.map((p) => ensureHashedId({ ...p }));
  }

  const costs = data?.creditCosts || {};
  const keys = new Set([
    ...Object.keys(costs),
    ...PRO_ONLY_CREDIT_FEATURES,
    ...FREE_CREDIT_FEATURES,
    ...basePolicies.map((p) => p.key),
  ]);

  const byKey = new Map(basePolicies.map((p) => [p.key, p]));
  const out = [];
  for (const key of keys) {
    const base = byKey.get(key);
    const access = PRO_ONLY_CREDIT_FEATURES.has(key)
      ? "pro"
      : FREE_CREDIT_FEATURES.has(key)
        ? "free"
        : base?.access || "pro";
    const creditCost =
      costs[key] != null ? Number(costs[key]) || 0 : base?.creditCost ?? 0;
    out.push(
      ensureHashedId({
        ...(base || {}),
        key,
        label: base?.label || key,
        enabled: base?.enabled !== false,
        access,
        creditCost,
        usageLimitPerPeriod: base?.usageLimitPerPeriod || {
          free: access === "pro" ? 0 : -1,
          pro: -1,
        },
      }),
    );
  }
  return out.length ? out : structuredClone(basePolicies);
}

function deriveLegacyViews(config) {
  const plans = Array.isArray(config.plans) ? config.plans : [];
  const freePlan = plans.find((p) => p.key === "free" || p.tier === "free") || plans.find((p) => !p.amountPaise);
  const proPlan = plans.find((p) => p.tier === "pro" && p.amountPaise > 0) || plans.find((p) => p.key === "yearly");

  config.freeLimits = {
    applications: freePlan?.limits?.applications ?? 10,
    resumes: freePlan?.limits?.resumes ?? 1,
    aiCredits: freePlan?.aiCreditsPerPeriod ?? 10,
    template: freePlan?.limits?.template ?? "onyx",
  };
  config.proLimits = {
    applications: proPlan?.limits?.applications ?? -1,
    resumes: proPlan?.limits?.resumes ?? -1,
    aiCreditsPerMonth: proPlan?.aiCreditsPerPeriod ?? 100,
  };

  const creditCosts = {};
  for (const policy of config.creditPolicies || []) {
    if (policy?.key) creditCosts[policy.key] = Number(policy.creditCost) || 0;
  }
  config.creditCosts = creditCosts;
  return config;
}

function normalizeCardFeatures(list) {
  if (!Array.isArray(list)) return [];
  return list.map((f) =>
    ensureHashedId({
      text: String(f?.text || ""),
      included: f?.included !== false,
      ...(f?.badge ? { badge: String(f.badge) } : {}),
      ...(f?.id && isHashedId(f.id) ? { id: f.id } : {}),
    }),
  );
}

function normalizePlan(plan, baseByKey = new Map()) {
  if (!plan || typeof plan !== "object") return null;
  const key = String(plan.key || plan.id || "plan").slice(0, 64);
  const base = baseByKey.get(key) || {};
  const amountPaise = toNonNegativeInt(plan.amountPaise) ?? toNonNegativeInt(base.amountPaise) ?? 0;
  const durationDays = toNonNegativeInt(plan.durationDays) ?? toNonNegativeInt(base.durationDays) ?? 0;
  const aiCredits = toNonNegativeInt(plan.aiCreditsPerPeriod) ?? toNonNegativeInt(base.aiCreditsPerPeriod);
  const cardFeaturesRaw =
    Array.isArray(plan.cardFeatures) && plan.cardFeatures.length
      ? plan.cardFeatures
      : base.cardFeatures;
  return ensureHashedId({
    ...base,
    ...plan,
    key,
    label: String(plan.label || base.label || key),
    amountPaise,
    durationDays,
    tier: plan.tier === "pro" || amountPaise > 0 ? (plan.tier || base.tier || "pro") : "free",
    visible: plan.visible !== false,
    highlighted: Boolean(plan.highlighted ?? base.highlighted),
    sortOrder: Number.isFinite(Number(plan.sortOrder))
      ? Number(plan.sortOrder)
      : Number(base.sortOrder) || 0,
    ...(aiCredits != null ? { aiCreditsPerPeriod: aiCredits } : {}),
    limits: {
      applications:
        toIntOrNegOne(plan.limits?.applications) ??
        toIntOrNegOne(base.limits?.applications) ??
        (amountPaise > 0 ? -1 : 10),
      resumes:
        toIntOrNegOne(plan.limits?.resumes) ??
        toIntOrNegOne(base.limits?.resumes) ??
        (amountPaise > 0 ? -1 : 1),
      template: plan.limits?.template ?? base.limits?.template ?? null,
    },
    cardFeatures: normalizeCardFeatures(cardFeaturesRaw),
  });
}

function normalizePolicy(policy) {
  if (!policy || typeof policy !== "object" || !policy.key) return null;
  const access = ["free", "pro", "disabled"].includes(policy.access) ? policy.access : "pro";
  return ensureHashedId({
    ...policy,
    key: String(policy.key),
    label: String(policy.label || policy.key),
    enabled: policy.enabled !== false,
    access,
    creditCost: toNonNegativeInt(policy.creditCost) ?? 0,
    usageLimitPerPeriod: {
      free: toIntOrNegOne(policy.usageLimitPerPeriod?.free) ?? (access === "pro" ? 0 : -1),
      pro: toIntOrNegOne(policy.usageLimitPerPeriod?.pro) ?? -1,
    },
  });
}

function syncDerivedPricingFields(config) {
  const symbol = config.currencySymbol || "₹";
  for (const plan of config.plans || []) {
    if (plan.amountPaise != null && !plan.displayPrice) {
      plan.displayPrice = `${symbol}${Math.round(plan.amountPaise / 100)}`;
    }
  }
  return deriveLegacyViews(config);
}

export function mergeWithDefaults(data) {
  const base = cloneDefaults();
  if (!data || typeof data !== "object") return syncDerivedPricingFields(base);

  const baseByKey = new Map(base.plans.map((p) => [p.key, p]));
  let plans = coercePlansArray(data.plans, base.plans)
    .map((p) => normalizePlan(p, baseByKey))
    .filter(Boolean);

  // Ensure default free/monthly/yearly/lifetime keys exist when migrating from 2-plan map.
  for (const basePlan of base.plans) {
    if (!plans.some((p) => p.key === basePlan.key)) {
      plans.push(normalizePlan(basePlan, baseByKey));
    }
  }
  plans = plans.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const creditPolicies = migrateCreditPolicies(data, base.creditPolicies)
    .map(normalizePolicy)
    .filter(Boolean);

  const merged = {
    currency: data.currency || base.currency,
    currencySymbol: data.currencySymbol || base.currencySymbol,
    plans: plans.length ? plans : base.plans,
    creditPolicies: creditPolicies.length ? creditPolicies : base.creditPolicies,
    marketing: { ...base.marketing, ...(data.marketing || {}) },
  };

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
    const fields = pricingFieldsFromDoc(raw);
    config = mergeWithDefaults(fields);
    const legacyPlansMap = fields.plans && !Array.isArray(fields.plans);
    const missingPolicies = !Array.isArray(fields.creditPolicies);
    const remotePlanKeys = new Set();
    if (Array.isArray(fields.plans)) {
      for (const p of fields.plans) if (p?.key) remotePlanKeys.add(p.key);
    } else if (fields.plans && typeof fields.plans === "object") {
      for (const [k, p] of Object.entries(fields.plans)) remotePlanKeys.add(p?.key || k);
    }
    const missingDefaultPlans = DEFAULT_PRICING_CONFIG.plans.some((p) => !remotePlanKeys.has(p.key));
    if (legacyPlansMap || missingPolicies || missingDefaultPlans || (isPricingEncryptionEnabled() && raw?.encrypted !== true)) {
      await ref.set(buildStoredPricingDoc(config, { uid: raw?.updatedBy || null }));
    }
  }

  cache = { data: config, expiresAt: Date.now() + CACHE_TTL_MS };
  return config;
}

function validatePricingConfig(config) {
  if (!Array.isArray(config.plans) || !config.plans.length) {
    throw new ApiError("invalid-argument", "plans must be a non-empty array");
  }
  const ids = new Set();
  const keys = new Set();
  for (const plan of config.plans) {
    if (!isHashedId(plan.id)) {
      throw new ApiError("invalid-argument", `plan id must be 16 hex digits (${plan.key})`);
    }
    if (ids.has(plan.id)) throw new ApiError("invalid-argument", `duplicate plan id ${plan.id}`);
    ids.add(plan.id);
    if (keys.has(plan.key)) throw new ApiError("invalid-argument", `duplicate plan key ${plan.key}`);
    keys.add(plan.key);
    if (plan.amountPaise > 0 && plan.durationDays <= 0) {
      throw new ApiError("invalid-argument", `paid plan ${plan.key} needs durationDays > 0`);
    }
  }
  if (!Array.isArray(config.creditPolicies)) {
    throw new ApiError("invalid-argument", "creditPolicies must be an array");
  }
  const pIds = new Set();
  const pKeys = new Set();
  for (const policy of config.creditPolicies) {
    if (!isHashedId(policy.id)) {
      throw new ApiError("invalid-argument", `creditPolicy id must be 16 hex digits (${policy.key})`);
    }
    if (pIds.has(policy.id)) throw new ApiError("invalid-argument", `duplicate creditPolicy id`);
    pIds.add(policy.id);
    if (pKeys.has(policy.key)) throw new ApiError("invalid-argument", `duplicate creditPolicy key ${policy.key}`);
    pKeys.add(policy.key);
  }
}

export async function updatePricingConfig(patch, uid) {
  if (!patch || typeof patch !== "object") {
    throw new ApiError("invalid-argument", "Request body must be an object");
  }

  // Full replace semantics for plans/creditPolicies when provided as arrays.
  const current = await getPricingConfig({ fresh: true });
  const next = mergeWithDefaults({
    ...current,
    ...patch,
    plans: patch.plans != null ? patch.plans : current.plans,
    creditPolicies: patch.creditPolicies != null ? patch.creditPolicies : current.creditPolicies,
    marketing: { ...(current.marketing || {}), ...(patch.marketing || {}) },
  });

  // Backfill any missing ids before validate.
  next.plans = ensureHashedIds(next.plans);
  next.creditPolicies = ensureHashedIds(next.creditPolicies);
  for (const plan of next.plans) {
    plan.cardFeatures = ensureHashedIds(plan.cardFeatures || []);
  }

  validatePricingConfig(next);

  const db = getFirestore();
  await db.collection("config").doc("pricing").set(
    buildStoredPricingDoc(next, { uid }),
    { merge: false },
  );

  invalidatePricingCache();
  return getPricingConfig({ fresh: true });
}

/** Lookup plan by hashed id or legacy key (yearly/monthly). */
export function findPlan(config, planIdOrKey) {
  const plans = config?.plans || [];
  return (
    plans.find((p) => p.id === planIdOrKey) ||
    plans.find((p) => p.key === planIdOrKey) ||
    null
  );
}

export function listPaidPlans(config) {
  return (config?.plans || []).filter((p) => Number(p.amountPaise) > 0 && p.visible !== false);
}

/** Map for Razorpay — keyed by hashed id and by key for compat. */
export function billingPlansFromConfig(config) {
  const cfg = config || DEFAULT_PRICING_CONFIG;
  const out = {};
  for (const p of listPaidPlans(cfg)) {
    const entry = {
      id: p.id,
      key: p.key,
      amount: p.amountPaise,
      label: p.label,
      durationDays: p.durationDays,
      period: p.period || null,
      aiCreditsPerPeriod: p.aiCreditsPerPeriod,
      tier: p.tier || "pro",
    };
    out[p.id] = entry;
    if (p.key) out[p.key] = entry;
  }
  return out;
}

export function getCreditPolicyByKey(config, featureKey) {
  return (config?.creditPolicies || []).find((p) => p.key === featureKey) || null;
}

export { newHashedId, isHashedId };
