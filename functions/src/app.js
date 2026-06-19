import express from "express";
import cors from "cors";
import { env, isAllowedCorsOrigin } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import aiRoutes from "./routes/ai/index.js";
import jobsSearchRoutes from "./routes/jobs/search.js";
import paymentRoutes from "./routes/payments/razorpay.js";
import paymentWebhookRoutes from "./routes/payments/webhook.js";
import usageRoutes from "./routes/usage/track.js";
import adminRoutes from "./routes/admin/index.js";
import configRoutes from "./routes/config/index.js";
import entitlementsRoutes from "./routes/entitlements/index.js";
import applicationsRoutes from "./routes/applications/index.js";
import resumesRoutes from "./routes/resumes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin(origin, cb) {
        if (isAllowedCorsOrigin(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    }),
  );

  // Razorpay webhook signature verification requires the raw request body.
  app.use(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentWebhookRoutes,
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      env: env.nodeEnv,
      uptimeSec: Math.round(process.uptime()),
    });
  });

  app.use("/api/ai", aiRoutes);
  app.use("/api/jobs", jobsSearchRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/usage", usageRoutes);
  app.use("/api/config", configRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/entitlements", entitlementsRoutes);
  app.use("/api/applications", applicationsRoutes);
  app.use("/api/resumes", resumesRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
