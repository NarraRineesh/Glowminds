import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { optionalAuth } from "./auth.js";

/** Per-UID when authenticated, otherwise per-IP. */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "resource-exhausted",
      message: "Too many AI requests. Please wait a minute and try again.",
    },
  },
  keyGenerator(req) {
    if (req.user?.uid) return req.user.uid;
    return ipKeyGenerator(req.ip);
  },
});

/** Resolve optional auth before rate-limit key selection. */
export function aiRateLimitStack(req, res, next) {
  optionalAuth(req, res, (err) => {
    if (err) return next(err);
    aiRateLimit(req, res, next);
  });
}
