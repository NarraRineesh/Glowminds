// OpenRouter fallback client.
//
// `generate()` is the only export — it covers both single-shot prompts
// (`{ prompt }` or `{ userMessage }`) and multi-turn chat (`{ history, userMessage }`).
// Returns `{ text, model }` on success. On failure throws a sanitized
// Error whose message is safe to surface to end users (no provider/model
// ids ever leak). Real diagnostics go to `console.warn` for the operator.

import { env } from "../config/env.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Tried in order; first one that returns a usable response wins.
// Keep this list fresh: entries silently 404 when OpenRouter drops them
// (that takes the whole fallback chain down whenever Gemini is busy).
const FREE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "tencent/hy3:free",
  "openrouter/free",
];

const MODEL_TIMEOUT_MS = 45_000;   // per-model network timeout
const TOTAL_BUDGET_MS = 90_000;    // walk-the-fallbacks ceiling
const HISTORY_LIMIT = 20;          // most recent messages kept from `history`
const MIN_TOKENS = 64;
const MAX_TOKENS = 16_384;         // generous so big MCQ batches don't get truncated

function friendlyError(status) {
  if (status === 429 || status === 503) return "The AI service is busy right now. Please try again in a moment.";
  if (status === 401 || status === 403) return "The AI service is unavailable. Please contact support.";
  if (status === 400) return "The AI request was rejected. Please adjust your input and try again.";
  return "The AI service is temporarily unavailable. Please try again.";
}

function resolveApiKey() {
  const key = env.openrouterApiKey;
  if (!key || !String(key).trim()) {
    console.warn("[ai] fallback AI key is not configured");
    throw new Error("The AI service is not configured.");
  }
  return String(key).trim();
}

function buildMessages({ system, history, userMessage, prompt }) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  for (const h of (history || []).slice(-HISTORY_LIMIT)) {
    messages.push({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text || h.content || "",
    });
  }
  const userText = userMessage ?? prompt;
  if (userText !== undefined && userText !== null && String(userText).length > 0) {
    messages.push({ role: "user", content: String(userText) });
  }
  return messages;
}

function extractMessageContent(data) {
  const msg = data?.choices?.[0]?.message;
  if (!msg) return "";
  // Multimodal-style array of content blocks comes first — string coercion
  // on an array would otherwise produce a useless comma-joined dump.
  if (Array.isArray(msg.content)) {
    return msg.content
      .filter((p) => p?.type === "text" && p.text)
      .map((p) => p.text)
      .join("\n")
      .trim();
  }
  const text = msg.content ?? msg.text ?? "";
  return text ? String(text).trim() : "";
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn(`[ai] fallback request aborted after ${timeoutMs}ms`);
      throw new Error("The AI request took too long. Please try again.");
    }
    console.warn(`[ai] fallback fetch failed: ${err.message}`);
    throw new Error("The AI service is temporarily unavailable. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generate a completion against the OpenRouter fallback pool.
 *
 * @param {object} opts
 * @param {string} [opts.system]       System prompt.
 * @param {Array}  [opts.history]      Prior turns: `{ role, text|content }[]`.
 * @param {string} [opts.userMessage]  Latest user turn (preferred).
 * @param {string} [opts.prompt]       Alias for `userMessage` (single-shot use).
 * @param {number} [opts.temperature]  Default 0.7.
 * @param {number} [opts.maxTokens]    Clamped to [64, 16384]. Default 2048.
 * @param {string} [opts.model]        Skip the fallback list and use this model only.
 * @returns {Promise<{ text: string, model: string, usage: { promptTokens: number, completionTokens: number, totalTokens: number } }>}
 */
export async function generate(opts = {}) {
  const messages = buildMessages(opts);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    throw new Error("No user message provided.");
  }

  const apiKey = resolveApiKey();
  const modelsToTry = opts.model ? [opts.model] : FREE_MODELS;
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = Math.min(
    Math.max(Number(opts.maxTokens) || 1024, MIN_TOKENS),
    MAX_TOKENS,
  );

  const startedAt = Date.now();
  let lastError;

  for (const modelId of modelsToTry) {
    if (Date.now() - startedAt > TOTAL_BUDGET_MS) break;

    try {
      const res = await fetchWithTimeout(
        OPENROUTER_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": env.openrouterSiteUrl,
            "X-Title": env.openrouterAppName,
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        },
        MODEL_TIMEOUT_MS,
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const rawMsg = data?.error?.message || data?.message || res.statusText;
        console.warn(
          `[ai] fallback call failed model=${modelId} status=${res.status} msg=${rawMsg}`,
        );
        lastError = new Error(friendlyError(res.status));
        continue;
      }

      const content = extractMessageContent(data);
      if (!content) {
        console.warn(`[ai] fallback empty response model=${modelId}`);
        lastError = new Error("The AI service returned no answer. Please try again.");
        continue;
      }

      const u = data?.usage || {};
      const usage = {
        promptTokens: Number(u.prompt_tokens) || 0,
        completionTokens: Number(u.completion_tokens) || 0,
        totalTokens: Number(u.total_tokens) || 0,
      };
      return { text: content, model: modelId, usage };
    } catch (err) {
      // err.message is already sanitized when it comes from fetchWithTimeout
      // (or from the `friendlyError`-driven branches above). Any unexpected
      // runtime error is replaced with a generic message.
      lastError = err.message?.startsWith("The AI ")
        ? err
        : new Error("The AI service is temporarily unavailable. Please try again.");
      console.warn(`[ai] fallback model=${modelId} threw: ${err.message}`);
    }
  }

  throw (
    lastError ||
    new Error("The AI service is temporarily unavailable. Please try again.")
  );
}
