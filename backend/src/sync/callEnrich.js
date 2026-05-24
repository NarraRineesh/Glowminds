import { env } from "../config/env.js";

const ENRICH_TIMEOUT_MS = 10_000;

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function partial() {
  return {
    skills: [],
    experience: "",
    seniority: "mid",
    role: "engineering",
    remote: false,
    employmentType: "full-time",
    elapsedMs: 0,
    partial: true,
  };
}

export async function callEnrich({ rawHtml, plainText, descriptionHtml }) {
  const fallbackPlain =
    plainText || stripHtml(descriptionHtml || rawHtml || "");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENRICH_TIMEOUT_MS);

  try {
    const res = await fetch(`${env.enrichUrl}/enrich`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawHtml: rawHtml || descriptionHtml || "",
        plainText: fallbackPlain,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`enrich ${res.status}`);
    }
    const json = await res.json();
    return { ...json, partial: false };
  } catch (err) {
    console.warn(`[enrich] fallback: ${err.message || err}`);
    return partial();
  } finally {
    clearTimeout(timer);
  }
}
