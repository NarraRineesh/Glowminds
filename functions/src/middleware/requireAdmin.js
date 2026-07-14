/** Require Firebase custom claim `isAdmin: true` (after requireAuth). */

export function requireAdmin(req, res, next) {
  if (!req.user?.uid) {
    return res.status(401).json({
      error: { code: "unauthenticated", message: "Missing Bearer token" },
    });
  }

  if (req.user.token?.isAdmin !== true) {
    return res.status(403).json({
      error: { code: "permission-denied", message: "Admin access required" },
    });
  }

  next();
}
