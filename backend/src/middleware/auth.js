import { getAuth } from "../config/firebase.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);

  if (!match) {
    return res.status(401).json({
      error: { code: "unauthenticated", message: "Missing Bearer token" },
    });
  }

  const idToken = match[1].trim();
  if (!idToken) {
    return res.status(401).json({
      error: { code: "unauthenticated", message: "Empty Bearer token" },
    });
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      token: decoded,
    };
    next();
  } catch (err) {
    res.status(401).json({
      error: {
        code: "unauthenticated",
        message: "Invalid or expired token",
      },
    });
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) return next();

  getAuth()
    .verifyIdToken(match[1].trim())
    .then((decoded) => {
      req.user = {
        uid: decoded.uid,
        email: decoded.email || null,
        token: decoded,
      };
      next();
    })
    .catch(() => next());
}
