import { ApiError } from "./errors.js";
import { assertFeatureAccess, recordFeatureUsage } from "../services/featurePolicy.js";

/**
 * Enforces admin creditPolicies for a feature key (access + credits + usage).
 * Replaces requirePro() + requireCredits() pairs on AI/Pro routes.
 */
export function requireFeature(featureKey) {
  return async (req, res, next) => {
    try {
      if (!req.user?.uid) {
        throw new ApiError("unauthenticated", "Authentication required");
      }

      const charge = await assertFeatureAccess(req.user.uid, featureKey);
      req.creditCharge = {
        uid: charge.uid,
        featureKey: charge.featureKey,
        policyId: charge.policyId,
        cost: charge.cost,
        skipped: charge.skipped,
      };
      // Stash for post-success usage increment (optional callers).
      req.featurePolicy = charge.policy;
      next();
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  };
}

export { recordFeatureUsage };
