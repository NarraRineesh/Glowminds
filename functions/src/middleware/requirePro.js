import { getFirestore } from "../config/firebase.js";
import { hasProAccess } from "../constants/plans.js";
import { ApiError } from "./errors.js";

/**
 * Requires an active Pro subscription on users/{uid}.subscription.
 * Admins bypass via custom claim. Must run after requireAuth.
 */
export async function requirePro(req, res, next) {
  try {
    if (!req.user?.uid) {
      throw new ApiError("unauthenticated", "Authentication required");
    }

    if (req.user.token?.admin === true) {
      req.subscription = null;
      return next();
    }

    const snap = await getFirestore().collection("users").doc(req.user.uid).get();
    const sub = snap.exists ? snap.get("subscription") : null;

    if (!hasProAccess(sub, false)) {
      throw new ApiError(
        "pro-required",
        "Glowminds Pro is required for this feature.",
        403,
      );
    }

    req.subscription = sub;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
}
