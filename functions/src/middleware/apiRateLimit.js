import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { optionalAuth } from "./auth.js";

/** Tighter limit for payment order creation. */
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "resource-exhausted",
      message: "Too many payment requests. Please wait a minute and try again.",
    },
  },
  keyGenerator(req) {
    if (req.user?.uid) return `pay:${req.user.uid}`;
    return `pay:${ipKeyGenerator(req.ip)}`;
  },
});

/** Client usage track endpoint. */
export const usageTrackRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "resource-exhausted",
      message: "Too many usage track requests. Please wait a minute.",
    },
  },
  keyGenerator(req) {
    if (req.user?.uid) return `usage:${req.user.uid}`;
    return `usage:${ipKeyGenerator(req.ip)}`;
  },
});

export function withOptionalAuthRateLimit(limiter) {
  return (req, res, next) => {
    optionalAuth(req, res, (err) => {
      if (err) return next(err);
      limiter(req, res, next);
    });
  };
}
