import { hasProAccess } from "../constants/plans.js";
import { readSubscription } from "../services/userCollections.js";
import { ApiError } from "./errors.js";

/** Blocks free-tier users from Pro-only API features. */
export function requirePro() {
  return async (req, res, next) => {
    try {
      if (!req.user?.uid) {
        throw new ApiError("unauthenticated", "Authentication required");
      }

      const sub = await readSubscription(req.user.uid);
      if (!hasProAccess(sub)) {
        throw new ApiError(
          "permission-denied",
          "Glowminds Pro is required for this feature. Upgrade to unlock AI coaching, interviews, cover letters, and smart job matching.",
        );
      }

      next();
    } catch (err) {
      next(err instanceof ApiError ? err : new ApiError("internal", err.message));
    }
  };
}
