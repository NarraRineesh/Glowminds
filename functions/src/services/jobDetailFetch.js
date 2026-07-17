import { decodeHtmlEntities, normalizeDescriptionHtml, stripHtml } from "../utils/html.js";

const CACHE_TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; Glowminds/1.0; +https://glowminds.in)";

/** @type {Map<string, { at: number, data: object }>} */
const descriptionCache = new Map();

function extractRequirements(html) {
  const text = stripHtml(html);
  const lines = text
    .split(/[.;\u2022\n]/)
    .filter((l) => l.trim().length > 15 && l.trim().length < 200);
  const reqKeywords =
    /experience|proficien|knowledge|familiar|skill|require|must have|strong|years/i;
  const reqs = lines.filter((l) => reqKeywords.test(l)).slice(0, 5);
  return reqs.length
    ? reqs.map((r) => r.trim())
    : ["See full job description for details"];
}

function buildFromHtml(descHtml) {
  const html = normalizeDescriptionHtml(descHtml || "");
  const plain = stripHtml(html);
  if (!plain && !html) return null;
  return {
    description: plain,
    desc: plain,
    descHtml: html,
    req: extractRequirements(html || plain),
  };
}

function buildFromPlain(plainText) {
  const plain = String(plainText || "").trim();
  if (!plain) return null;
  return {
    description: plain,
    desc: plain,
    descHtml: "",
    req: extractRequirements(plain),
  };
}

async function fetchRemote(url, { json = true } = {}) {
  const target = String(url || "").trim();
  if (!target || !/^https?:\/\//i.test(target)) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(target, {
      signal: ctrl.signal,
      headers: {
        Accept: json ? "application/json" : "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return json ? await res.json() : await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function externalIdFromRow(row) {
  const explicit = String(row?.external_id || "").trim();
  if (explicit) return explicit;
  const id = String(row?.id || "").trim();
  const parts = id.split(":");
  if (parts.length >= 3) return parts.slice(2).join(":");
  return "";
}

function parseGreenhouse(data) {
  return buildFromHtml(data?.content || "");
}

function parseLever(data) {
  const html = data?.description || data?.descriptionBody || "";
  if (html) return buildFromHtml(html);
  return buildFromPlain(data?.descriptionPlain || data?.descriptionBodyPlain || "");
}

function parseWorkday(data) {
  const info = data?.jobPostingInfo || data;
  return buildFromHtml(info?.jobDescription || info?.description || "");
}

function parseAshby(data, externalId) {
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  const needle = String(externalId || "").trim();
  const match =
    jobs.find((j) => String(j?.id || "") === needle) ||
    jobs.find((j) => String(j?.applyUrl || j?.jobUrl || "").includes(needle));
  if (!match) return null;
  const html = match.descriptionHtml || "";
  if (html) return buildFromHtml(html);
  return buildFromPlain(match.descriptionPlain || "");
}

function parseBambooHtml(html) {
  const text = String(html || "");
  const meta =
    text.match(
      /<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["'][^>]*>/i,
    ) ||
    text.match(
      /<meta\s+content=["']([\s\S]*?)["']\s+property=["']og:description["'][^>]*>/i,
    );
  if (meta?.[1]) {
    const plain = decodeHtmlEntities(meta[1]).replace(/\s+/g, " ").trim();
    if (plain.length > 40) return buildFromPlain(plain);
  }
  return null;
}

async function fetchJobDescription(row) {
  const ats = String(row?.ats || "").toLowerCase();
  const detailUrl = String(row?.detail_api_url || "").trim();
  const applyUrl = String(row?.apply_url || "").trim();
  const externalId = externalIdFromRow(row);

  switch (ats) {
    case "greenhouse": {
      if (!detailUrl.includes("boards-api.greenhouse.io")) return null;
      const data = await fetchRemote(detailUrl, { json: true });
      return data ? parseGreenhouse(data) : null;
    }
    case "lever": {
      const url = detailUrl.includes("api.lever.co")
        ? detailUrl
        : detailUrl
          ? `${detailUrl}${detailUrl.includes("?") ? "&" : "?"}mode=json`
          : "";
      if (!url) return null;
      const data = await fetchRemote(url, { json: true });
      return data ? parseLever(data) : null;
    }
    case "workday": {
      if (!detailUrl.includes("/wday/cxs/")) return null;
      const data = await fetchRemote(detailUrl, { json: true });
      return data ? parseWorkday(data) : null;
    }
    case "ashby": {
      if (!detailUrl.includes("api.ashbyhq.com")) return null;
      const data = await fetchRemote(detailUrl, { json: true });
      return data ? parseAshby(data, externalId) : null;
    }
    case "bamboohr": {
      const pageUrl = applyUrl || detailUrl;
      const html = await fetchRemote(pageUrl, { json: false });
      return html ? parseBambooHtml(html) : null;
    }
    default:
      return null;
  }
}

/** Attach description fields to a mapped job using ATS detail APIs. */
export async function enrichJobWithDescription(row, job) {
  if (!row?.id || !job) return job;

  const cached = descriptionCache.get(row.id);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...job, ...cached.data };
  }

  const detail = await fetchJobDescription(row);
  if (!detail) return job;

  descriptionCache.set(row.id, { at: Date.now(), data: detail });
  return { ...job, ...detail };
}
