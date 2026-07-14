/**
 * Estimated USD cost per 1M tokens by model id.
 * Used for admin cost dashboards — not billed to users.
 * OpenRouter free-tier models are $0.
 */

export const AI_COST_RATES_USD_PER_M = {
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "owl-alpha": { input: 0, output: 0 },
  "deepseek/deepseek-v4-flash:free": { input: 0, output: 0 },
};

const DEFAULT_RATE = { input: 0.15, output: 0.6 };

export function estimateCostUsd(model, promptTokens = 0, completionTokens = 0) {
  const rate = AI_COST_RATES_USD_PER_M[model] || DEFAULT_RATE;
  const input = (Number(promptTokens) || 0) / 1_000_000 * rate.input;
  const output = (Number(completionTokens) || 0) / 1_000_000 * rate.output;
  return Math.round((input + output) * 1_000_000) / 1_000_000;
}
