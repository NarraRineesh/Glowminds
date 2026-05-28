import { ApiError } from "./errors.js";

// Mount AFTER `requireAuth` — relies on req.user.token (the decoded
// Firebase ID token). Grant the claim once via:
//   await admin.auth().setCustomUserClaims(uid, { admin: true })
// The user has to sign out / back in to refresh their token.
export function requireAdmin(req, _res, next) {
  if (req.user?.token?.admin === true) return next();
  next(new ApiError("permission-denied", "Admin access required"));
}
