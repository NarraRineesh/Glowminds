import { ApiError } from "./errors.js";
import { ensureCreditsForFeature } from "../services/creditService.js";
import { getPricingConfig } from "../services/pricingConfig.js";

/**
 * Blocks AI routes when the user lacks credits for the feature.
 * Debits happen after a successful handler via finalizeCreditCharge().
 */
export function requireCredits(featureKey) {
  return async (req, res, next) => {
    try {
      if (!req.user?.uid) {
        throw new ApiError("unauthenticated", "Authentication required");
      }

      const pricing = await getPricingConfig();
      const check = await ensureCreditsForFeature(req.user.uid, featureKey, pricing);

      if (!check.allowed) {
        throw new ApiError("permission-denied", check.message || "Insufficient AI credits");
      }

      req.creditCharge = {
        uid: req.user.uid,
        featureKey,
        cost: check.cost ?? 0,
        skipped: !check.cost,
      };
      next();
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  };
}
