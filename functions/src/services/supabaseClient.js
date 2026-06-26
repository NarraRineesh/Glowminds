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

export async function supabaseRest(pathname, { method = "GET", body, prefer, range } = {}) {
  if (!isSupabaseEnabled()) {
    throw new Error("Supabase is not configured");
  }
  const url = `${env.supabaseUrl}/rest/v1/${pathname}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...headers(prefer),
      ...(range ? { Range: range } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${method} ${pathname} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (method === "HEAD") {
    const cr = res.headers.get("content-range") || "";
    const m = cr.match(/\/(\d+)/);
    return { count: m ? Number.parseInt(m[1], 10) : 0 };
  }
  if (ct.includes("json")) return res.json();
  return null;
}

export async function supabaseCount(pathname) {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${pathname}`, {
    method: "HEAD",
    headers: { ...headers("count=exact") },
  });
  if (!res.ok) return 0;
  const cr = res.headers.get("content-range") || "";
  const m = cr.match(/\/(\d+)/);
  return m ? Number.parseInt(m[1], 10) : 0;
}
