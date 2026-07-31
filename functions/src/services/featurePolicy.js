import { hasProAccess } from "../constants/plans.js";
import { ApiError } from "../middleware/errors.js";
import {
  getCreditPolicyByKey,
  getPricingConfig,
} from "./pricingConfig.js";
import { ensureCreditsForFeature } from "./creditService.js";
import {
  readEntitlements,
  readSubscription,
  userEntitlementsRef,
} from "./userCollections.js";
import { admin } from "../config/firebase.js";

/**
 * Resolve credit policy by feature key from admin JSON.
 * @returns {Promise<object>}
 */
export async function resolveCreditPolicy(featureKey, pricing) {
  const config = pricing || (await getPricingConfig());
  const policy = getCreditPolicyByKey(config, featureKey);
  if (!policy) {
    throw new ApiError("failed-precondition", `Unknown feature policy: ${featureKey}`);
  }
  return { config, policy };
}

function tierKey(isPro) {
  return isPro ? "pro" : "free";
}

/**
 * Enforce enabled + access + usageLimitPerPeriod + credits for a feature key.
 * Sets req.creditCharge when used as middleware context builder.
 */
export async function assertFeatureAccess(uid, featureKey, pricing) {
  const { config, policy } = await resolveCreditPolicy(featureKey, pricing);

  if (policy.enabled === false || policy.access === "disabled") {
    throw new ApiError("permission-denied", `${policy.label || featureKey} is currently unavailable.`);
  }

  const sub = await readSubscription(uid);
  const isPro = hasProAccess(sub);

  if (policy.access === "pro" && !isPro) {
    throw new ApiError(
      "permission-denied",
      "Glowminds Pro is required for this feature. Upgrade to unlock AI coaching, interviews, cover letters, and smart job matching.",
    );
  }

  // Usage limit per credit period (in addition to credit balance).
  const limit = policy.usageLimitPerPeriod?.[tierKey(isPro)];
  if (limit != null && limit !== -1) {
    const ent = await readEntitlements(uid);
    const used = Number(ent?.featureUsage?.[policy.id] || ent?.featureUsage?.[featureKey] || 0);
    if (used >= limit) {
      throw new ApiError(
        "permission-denied",
        `You've reached the usage limit for ${policy.label || featureKey} this period.`,
      );
    }
  }

  const check = await ensureCreditsForFeature(uid, featureKey, config);
  if (!check.allowed) {
    throw new ApiError("permission-denied", check.message || "Insufficient AI credits");
  }

  return {
    uid,
    featureKey,
    policyId: policy.id,
    cost: check.cost ?? 0,
    skipped: !check.cost,
    policy,
  };
}

/** Increment per-feature usage counter after a successful charge. */
export async function recordFeatureUsage(uid, policyIdOrKey) {
  if (!uid || !policyIdOrKey) return;
  const ref = userEntitlementsRef(uid);
  await ref.set(
    {
      featureUsage: {
        [policyIdOrKey]: admin.firestore.FieldValue.increment(1),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
