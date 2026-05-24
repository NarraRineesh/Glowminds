export function stripJsonFences(text) {
  let raw = String(text || "").trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
  }
  return raw.trim();
}
