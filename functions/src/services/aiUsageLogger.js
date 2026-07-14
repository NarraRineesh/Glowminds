/**
 * Persist per-call LLM token usage for admin cost tracking.
 * Fire-and-forget — never blocks AI responses.
 */

import { admin, getFirestore } from "../config/firebase.js";
import { estimateCostUsd } from "../constants/aiCostRates.js";
import { userEntitlementsRef } from "./userCollections.js";

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function sanitizeUsage(usage = {}) {
  const promptTokens = Math.max(0, Math.trunc(Number(usage.promptTokens) || 0));
  const completionTokens = Math.max(
    0,
    Math.trunc(Number(usage.completionTokens) || 0),
  );
  const totalTokens =
    Math.max(0, Math.trunc(Number(usage.totalTokens) || 0)) ||
    promptTokens + completionTokens;
  return { promptTokens, completionTokens, totalTokens };
}

/**
 * @param {object} opts
 * @param {string|null} opts.userId
 * @param {string} opts.task
 * @param {string} opts.provider
 * @param {string} opts.model
 * @param {{ promptTokens?: number, completionTokens?: number, totalTokens?: number }} [opts.usage]
 * @param {string} [opts.featureKey]
 */
export async function recordAiUsage({
  userId = null,
  task,
  provider,
  model,
  usage = {},
  featureKey = null,
}) {
  if (!task || !provider || !model) return;

  const { promptTokens, completionTokens, totalTokens } = sanitizeUsage(usage);
  const estimatedCostUsd = estimateCostUsd(model, promptTokens, completionTokens);
  const db = getFirestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const inc = admin.firestore.FieldValue.increment;

  try {
    const batch = db.batch();

    const logRef = db.collection("aiUsageLogs").doc();
    batch.set(logRef, {
      userId: userId || null,
      task: String(task),
      provider: String(provider),
      model: String(model),
      featureKey: featureKey || null,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd,
      createdAt: now,
    });

    const statsRef = db.collection("adminDailyStats").doc(dayKey());
    batch.set(
      statsRef,
      {
        date: dayKey(),
        calls: inc(1),
        promptTokens: inc(promptTokens),
        completionTokens: inc(completionTokens),
        totalTokens: inc(totalTokens),
        estimatedCostUsd: inc(estimatedCostUsd),
        byTask: {
          [task]: {
            calls: inc(1),
            totalTokens: inc(totalTokens),
            estimatedCostUsd: inc(estimatedCostUsd),
          },
        },
        byProvider: {
          [provider]: {
            calls: inc(1),
            totalTokens: inc(totalTokens),
            estimatedCostUsd: inc(estimatedCostUsd),
          },
        },
        updatedAt: now,
      },
      { merge: true },
    );

    if (userId) {
      batch.set(
        userEntitlementsRef(userId),
        {
          userId,
          tokenUsage: {
            promptTokens: inc(promptTokens),
            completionTokens: inc(completionTokens),
            totalTokens: inc(totalTokens),
            estimatedCostUsd: inc(estimatedCostUsd),
            calls: inc(1),
          },
          updatedAt: now,
        },
        { merge: true },
      );
    }

    await batch.commit();
  } catch (err) {
    console.warn(`[aiUsage] failed task=${task}:`, err.message);
  }
}

export function recordAiUsageAsync(opts) {
  void recordAiUsage(opts);
}
