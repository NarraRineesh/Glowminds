// Minimal Supabase PostgREST client for Cloud Functions (server-side only).

import { env } from "../config/env.js";

export function isSupabaseEnabled() {
  return Boolean(env.supabaseUrl && env.supabaseServiceKey);
}

function headers(prefer) {
  return {
    apikey: env.supabaseServiceKey,
    authorization: `Bearer ${env.supabaseServiceKey}`,
    "content-type": "application/json",
    ...(prefer ? { prefer } : {}),
  };
}

function parseContentRangeTotal(contentRange) {
  const m = String(contentRange || "").match(/\/(\d+|\*)/);
  if (!m || m[1] === "*") return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

export async function supabaseRest(pathname, { method = "GET", body, prefer, range, timeoutMs } = {}) {
  if (!isSupabaseEnabled()) {
    throw new Error("Supabase is not configured");
  }
  const url = `${env.supabaseUrl}/rest/v1/${pathname}`;
  const signal =
    Number.isFinite(timeoutMs) && timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...headers(prefer),
        ...(range ? { Range: range } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(signal ? { signal } : {}),
    });
  } catch (err) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      throw new Error(`Supabase ${method} ${pathname} -> timeout after ${timeoutMs}ms`);
    }
    throw err;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${method} ${pathname} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (method === "HEAD") {
    return { count: parseContentRangeTotal(res.headers.get("content-range")) ?? 0 };
  }
  if (ct.includes("json")) return res.json();
  return null;
}

/**
 * Exact row count via PostgREST Prefer: count=exact.
 * Returns null on failure (never 0-as-unknown — callers distinguish empty vs error).
 */
export async function supabaseCount(pathname) {
  if (!isSupabaseEnabled()) return null;
  const url = `${env.supabaseUrl}/rest/v1/${pathname}`;

  // Prefer GET + Range 0-0: bare HEAD without filters can 500 on large tables.
  const attempts = [
    { method: "GET", range: "0-0" },
    { method: "HEAD" },
  ];

  for (const attempt of attempts) {
    try {
      const res = await fetch(url, {
        method: attempt.method,
        headers: {
          ...headers("count=exact"),
          ...(attempt.range ? { Range: attempt.range } : {}),
        },
      });
      if (!res.ok) continue;
      const total = parseContentRangeTotal(res.headers.get("content-range"));
      if (total != null) return total;
    } catch {
      // try next strategy
    }
  }
  return null;
}
