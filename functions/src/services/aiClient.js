// Unified AI client.
//
// Routes each task to the cheapest/most-appropriate model and falls back to
// OpenRouter free models if the primary provider fails (rate limit, outage,
// quota, etc). Use the per-task entry points (chatTask, completionTask) so
// the model choice stays in ONE place, not scattered across routes.
//
// Task profile cheatsheet (kept here on purpose so adding a new endpoint is
// a one-line registry change instead of digging through services):
//
//   gemini-flash-lite → cheapest, JSON-friendly, used for grammar/paraphrase
//   gemini-flash      → faster reasoning, used for chat + evaluation + scoring
//   openrouter        → fallback for everyone; primary for "creative" cover letter
//
// All Gemini calls default to `thinkingConfig: { thinkingBudget: 0 }` (no
// extended reasoning) because every prompt here is tightly scoped. A task
// can opt in to thinking by setting `thinkingBudget` in its config.
//
// Each task can override temperature, maxTokens, and whether we ask Gemini
// for `application/json` responseMimeType (avoids the JSON-in-markdown dance).

import { geminiGenerate, GEMINI_MODELS } from "./gemini.js";
import { generate as openrouterGenerate } from "./openrouter.js";
import { trackAsync } from "./usageTracker.js";
import { recordAiUsageAsync } from "./aiUsageLogger.js";
import { env } from "../config/env.js";

const PROVIDERS = {
  GEMINI_FLASH_LITE: "gemini-flash-lite",
  GEMINI_FLASH: "gemini-flash",
  OPENROUTER: "openrouter",
};

// Per-task config. Keep prompts in the route files; this only owns model
// selection + generation params.
const TASKS = {
  "career-chat": {
    primary: PROVIDERS.OPENROUTER,
    fallback: PROVIDERS.GEMINI_FLASH,
    temperature: 0.7,
    maxTokens: 1536,
  },
  "interview-questions": {
    primary: PROVIDERS.GEMINI_FLASH_LITE,
    fallback: PROVIDERS.OPENROUTER,
    temperature: 0.8,
    // 50 MCQs × ~160 tokens each ≈ 8K; keep a healthy margin.
    maxTokens: 12000,
    json: true,
  },
  "evaluate-session": {
    primary: PROVIDERS.GEMINI_FLASH_LITE,
    fallback: PROVIDERS.OPENROUTER,
    temperature: 0.4,
    maxTokens: 4096,
    json: true,
  },
  "profile-review": {
    primary: PROVIDERS.GEMINI_FLASH_LITE,
    fallback: PROVIDERS.OPENROUTER,
    temperature: 0.4,
    maxTokens: 2048,
    json: true,
  },
  "cover-letter": {
    primary: PROVIDERS.OPENROUTER,
    fallback: PROVIDERS.GEMINI_FLASH,
    temperature: 0.75,
    maxTokens: 2048,
  },
  grammar: {
    primary: PROVIDERS.OPENROUTER,
    fallback: PROVIDERS.GEMINI_FLASH_LITE,
    temperature: 0.2,
    maxTokens: 1536,
    json: true,
  },
  paraphrase: {
    primary: PROVIDERS.OPENROUTER,
    fallback: PROVIDERS.GEMINI_FLASH_LITE,
    temperature: 0.7,
    maxTokens: 2048,
    json: true,
  },
  "resume-review": {
    primary: PROVIDERS.GEMINI_FLASH,
    fallback: PROVIDERS.OPENROUTER,
    temperature: 0.35,
    maxTokens: 4096,
    json: true,
  },
  "linkedin-audit": {
    primary: PROVIDERS.GEMINI_FLASH_LITE,
    fallback: PROVIDERS.OPENROUTER,
    temperature: 0.4,
    maxTokens: 3072,
    json: true,
  },
  "job-fit": {
    primary: PROVIDERS.GEMINI_FLASH_LITE,
    fallback: PROVIDERS.OPENROUTER,
    temperature: 0.35,
    maxTokens: 3072,
    json: true,
  },
  "salary-negotiate": {
    primary: PROVIDERS.GEMINI_FLASH_LITE,
    fallback: PROVIDERS.OPENROUTER,
    temperature: 0.5,
    maxTokens: 2048,
    json: true,
  },
};

function taskConfig(task) {
  const cfg = TASKS[task];
  if (!cfg) {
    throw new Error(`Unknown AI task "${task}". Add it to aiClient.TASKS.`);
  }
  return cfg;
}

function providerOrder(cfg) {
  const order = [cfg.primary];
  if (cfg.fallback && cfg.fallback !== cfg.primary) order.push(cfg.fallback);
  // If the caller's env is missing one of the keys we still try the other.
  return order.filter((p) => providerAvailable(p));
}

function providerAvailable(provider) {
  if (provider === PROVIDERS.OPENROUTER) return !!env.openrouterApiKey;
  return !!env.geminiApiKey;
}

function geminiModelFor(provider) {
  return provider === PROVIDERS.GEMINI_FLASH
    ? GEMINI_MODELS.FLASH
    : GEMINI_MODELS.FLASH_LITE;
}

async function runOne({ provider, cfg, system, history, userMessage, prompt }) {
  if (provider === PROVIDERS.OPENROUTER) {
    const { text, model, usage } = await openrouterGenerate({
      system,
      history,
      userMessage: userMessage ?? prompt,
      temperature: cfg.temperature,
      maxTokens: cfg.maxTokens,
    });
    return { text, provider, model, usage };
  }

  const model = geminiModelFor(provider);
  const { text, usage } = await geminiGenerate({
    model,
    system,
    history: history || [],
    userMessage: userMessage ?? prompt,
    temperature: cfg.temperature,
    maxOutputTokens: cfg.maxTokens,
    responseMimeType: cfg.json ? "application/json" : undefined,
    // Per-task override; defaults to 0 inside geminiGenerate (no thinking).
    thinkingBudget: cfg.thinkingBudget,
  });
  return { text, provider, model, usage };
}

// Multi-turn chat (history of prior {role, text/content} messages).
//
// Pass `uid` to attribute the usage to a user; omit/null means only the
// global counter ticks. Tracking is fire-and-forget so a slow Firestore
// write never blocks the AI response.
//
// Pass `skipAutoTrack: true` when the route wants to record a custom
// weight after parsing the result (e.g. interview-questions counts each
// generated MCQ, not the single API call).
export async function chatTask(
  task,
  { system, history, userMessage, uid, skipAutoTrack = false } = {},
) {
  const cfg = taskConfig(task);
  const order = providerOrder(cfg);
  if (!order.length) {
    console.warn(`[ai] task=${task} no providers configured`);
    throw new Error("The AI service is not configured.");
  }

  let lastErr;
  for (let i = 0; i < order.length; i += 1) {
    const provider = order[i];
    const role = i === 0 ? "primary" : "fallback";
    try {
      const result = await runOne({ provider, cfg, system, history, userMessage });
      if (!skipAutoTrack) trackAsync(uid || null, `ai.${task}`);
      recordAiUsageAsync({
        userId: uid || null,
        task,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
      });
      return result;
    } catch (err) {
      lastErr = err;
      // Server log uses anonymous role only — never the provider/model id.
      console.warn(`[ai] task=${task} role=${role} failed: ${err.message}`);
    }
  }
  // Already-sanitized message from the underlying provider client.
  throw (
    lastErr ||
    new Error("The AI service is temporarily unavailable. Please try again.")
  );
}

// Single-turn completion (no prior history).
export async function completionTask(
  task,
  prompt,
  { system, uid, skipAutoTrack = false } = {},
) {
  return chatTask(task, { system, userMessage: prompt, uid, skipAutoTrack });
}

export { PROVIDERS, TASKS };
