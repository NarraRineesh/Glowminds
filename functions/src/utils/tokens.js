// Token helpers — kept in sync with job-pipeline/src/utils/tokens.js and
// pipeline/search.html so enrich, search UI, and API rank the same way.

export function buildTitleTokens(title) {
  if (!title) return [];
  const out = new Set();
  for (const word of String(title).toLowerCase().split(/[^a-z0-9+#]+/)) {
    if (word.length >= 2) out.add(word);
  }
  return [...out];
}
