import { ApiError } from "./errors.js";

/**
 * Middleware factory retained for route compatibility.
 * Credits are currently informational only, so this never blocks requests.
 */
export function requireCredits() {
  return async (req, res, next) => {
    try {
      if (!req.user?.uid) {
        throw new ApiError("unauthenticated", "Authentication required");
      }

      req.creditsDebited = { debited: 0, balanceAfter: null, skipped: true };
      next();
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  };
}

