import { debitCredits, getCreditCost } from "../services/creditService.js";
import { getPricingConfig } from "../services/pricingConfig.js";
import { ApiError } from "./errors.js";

/**
 * Middleware factory — debit credits for an AI action before the route handler.
 * Must run after requireAuth. Admins bypass debits.
 *
 * @param {string} action - key in pricing.creditCosts
 * @param {{ idempotencyFromBody?: string }} [opts]
 */
export function requireCredits(action, opts = {}) {
  const { idempotencyFromBody } = opts;

  return async (req, res, next) => {
    try {
      if (!req.user?.uid) {
        throw new ApiError("unauthenticated", "Authentication required");
      }

      const isAdmin = req.user.token?.admin === true;
      const idempotencyKey = idempotencyFromBody
        ? req.body?.[idempotencyFromBody]
        : undefined;

      const result = await debitCredits(req.user.uid, action, {
        idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
        isAdmin,
      });

      req.creditsDebited = result;
      next();
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  };
}

/** Attach pricing credit cost to request without debiting (e.g. zero-cost routes). */
export async function attachCreditCost(action) {
  const pricing = await getPricingConfig();
  return getCreditCost(pricing, action);
}
