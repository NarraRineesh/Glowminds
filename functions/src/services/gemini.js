import { env } from "../config/env.js";

const BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_TIMEOUT_MS = 60_000;

// Errors thrown out of this module must NEVER mention "Gemini" or any
// external model id — they bubble straight to the HTTP client. Real
// details go to console.warn for the operator only.
function friendlyError(status) {
  if (status === 429 || status === 503) {
    return "The AI service is busy right now. Please try again in a moment.";
  }
  if (status === 401 || status === 403) {
    return "The AI service is unavailable. Please contact support.";
  }
  if (status === 400) {
    return "The AI request was rejected. Please adjust your input and try again.";
  }
  return "The AI service is temporarily unavailable. Please try again.";
}

function getApiKey() {
  const key = env.geminiApiKey;
  if (!key || !String(key).trim()) {
    console.warn("[ai] primary AI key is not configured");
    throw new Error("The AI service is not configured.");
  }
  return String(key).trim();
}

// Map an OpenAI-shaped message history into Gemini's `contents` schema.
// System messages are extracted into `systemInstruction` because Gemini
// does not accept a "system" role inside `contents`.
function toGeminiPayload({ system, history = [], userMessage }) {
  const contents = [];
  for (const m of history) {
    const text = String(m.text || m.content || "").trim();
    if (!text) continue;
    const role = m.role === "user" ? "user" : "model";
    contents.push({ role, parts: [{ text }] });
  }
  if (userMessage) {
    contents.push({ role: "user", parts: [{ text: String(userMessage) }] });
  }
  const payload = { contents };
  if (system) {
    payload.systemInstruction = { parts: [{ text: String(system) }] };
  }
  return payload;
}

function extractText(data) {
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return "";
  return parts
    .map((p) => p?.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn(`[ai] primary request aborted after ${timeoutMs}ms`);
      throw new Error("The AI request took too long. Please try again.");
    }
    console.warn(`[ai] primary fetch failed: ${err.message}`);
    throw new Error("The AI service is temporarily unavailable. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}

// Low-level call. Caller picks the model (e.g. "gemini-2.5-flash").
//
// `thinkingBudget` controls Gemini 2.5's hidden chain-of-thought tokens:
//   0       → disabled (default — fastest, cheapest)
//   N>0     → up to N thinking tokens before the visible answer
//   -1      → "dynamic" (model decides)
// We default to 0 because every route in this app has a tightly-scoped
// prompt that doesn't benefit from extended reasoning.
export async function geminiGenerate({
  model,
  system,
  history = [],
  userMessage,
  temperature = 0.7,
  maxOutputTokens = 2048,
  responseMimeType,
  thinkingBudget = 0,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/${encodeURIComponent(model)}:generateContent`;
  const body = toGeminiPayload({ system, history, userMessage });
  body.generationConfig = {
    temperature,
    maxOutputTokens,
    ...(responseMimeType ? { responseMimeType } : {}),
    thinkingConfig: { thinkingBudget },
  };

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const rawMsg =
      data?.error?.message || data?.message || `HTTP ${res.status}`;
    console.warn(
      `[ai] primary call failed model=${model} status=${res.status} msg=${rawMsg}`,
    );
    throw new Error(friendlyError(res.status));
  }
  const text = extractText(data);
  if (!text) {
    const reason = data?.promptFeedback?.blockReason || "empty response";
    console.warn(`[ai] primary empty response model=${model} reason=${reason}`);
    throw new Error("The AI service returned no answer. Please try again.");
  }
  const meta = data?.usageMetadata || {};
  const usage = {
    promptTokens: Number(meta.promptTokenCount) || 0,
    completionTokens: Number(meta.candidatesTokenCount) || 0,
    totalTokens: Number(meta.totalTokenCount) || 0,
  };
  return { text, model, usage };
}

// Convenience: single-turn prompt.
export async function geminiText(
  prompt,
  {
    model,
    system,
    temperature,
    maxOutputTokens,
    responseMimeType,
    thinkingBudget,
  } = {},
) {
  const { text } = await geminiGenerate({
    model,
    system,
    userMessage: prompt,
    temperature,
    maxOutputTokens,
    responseMimeType,
    thinkingBudget,
  });
  return text;
}

export const GEMINI_MODELS = {
  FLASH_LITE: "gemini-2.5-flash-lite",
  FLASH: "gemini-2.5-flash",
};
