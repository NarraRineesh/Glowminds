/** Decode HTML entities; repeat for double-encoded ATS payloads. */
export function decodeHtmlEntities(text) {
  if (!text) return "";
  let s = String(text);
  for (let i = 0; i < 3; i += 1) {
    const prev = s;
    s = s
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/&amp;/gi, "&");
    if (s === prev) break;
  }
  return s;
}

export function normalizeDescriptionHtml(html) {
  return decodeHtmlEntities(html);
}

export function stripHtml(html) {
  const decoded = decodeHtmlEntities(html);
  return decoded
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
