import { env } from "../config/env.js";

export async function catalogFetch(path, { timeoutMs = 20_000 } = {}) {
  const url = `${env.jobsApiBase}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      throw new Error(data?.message || data?.error?.message || `Catalog ${res.status}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export function mapCatalogJob(row) {
  if (!row) return row;
  const location = [row.city, row.state, row.country].filter(Boolean).join(", ");
  const skills = Array.isArray(row.skills) ? row.skills : [];
  return {
    id: row.id,
    title: row.title || "",
    company: row.company_name || "",
    co: row.company_name || "",
    location,
    loc: location,
    remote: String(row.work_mode_label || "").toLowerCase() === "remote",
    type: row.employment_type_label || "",
    tags: skills,
    url: row.apply_url || "",
    publishedAt: row.posted_at || null,
    source: `ats:${row.ats_label || row.ats || "unknown"}`,
  };
}

export async function searchCatalogJobs({ q = "", page = 1, limit = 12 } = {}) {
  const params = new URLSearchParams();
  const query = String(q || "").trim();
  if (query) params.set("q", query);
  params.set("page", String(Math.max(1, Math.trunc(page) || 1)));
  params.set("limit", String(Math.min(50, Math.max(1, Math.trunc(limit) || 12))));
  const data = await catalogFetch(`/v1/jobs?${params.toString()}`);
  const items = Array.isArray(data?.items) ? data.items : [];
  const found = Number(data?.found) || items.length;
  const safePage = Number(data?.page) || page;
  const safeLimit = Number(data?.limit) || limit;
  const totalPages = Math.max(1, Math.ceil(found / safeLimit) || 1);
  return {
    jobs: items.map(mapCatalogJob),
    pagination: {
      page: safePage,
      pageSize: safeLimit,
      total: found,
      totalPages,
      hasMore: safePage < totalPages,
      nextCursor: null,
      from: items.length ? (safePage - 1) * safeLimit + 1 : 0,
      to: items.length ? (safePage - 1) * safeLimit + items.length : 0,
    },
  };
}

export async function getCatalogStats() {
  return catalogFetch("/v1/stats");
}

export async function getTrendingSkills({ limit = 30 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  const data = await catalogFetch(`/v1/skills/trending?${params}`);
  return Array.isArray(data?.items) ? data.items : [];
}
