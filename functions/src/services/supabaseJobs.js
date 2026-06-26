// Job board queries against Supabase `jobs` table.

import { buildTitleTokens } from "../utils/tokens.js";
import { buildBoardSearchParams, buildSearchParams, rankJobs, scoreToMatch, dedupeJobs, applyJobFilters, jobMatchesLocation } from "./jobSearch.js";
import { supabaseRest, supabaseCount } from "./supabaseClient.js";

const JOB_SELECT = "id,title,company,location,apply_url,skills,min_experience,max_experience,employment_type,remote_type,updated_at,first_published,ats";

/** Cached enriched-job total — exact COUNT on 300k+ rows takes ~5s. */
const enrichedCountCache = { value: null, at: 0, inflight: null };
const ENRICHED_COUNT_TTL_MS = 15 * 60 * 1000;

async function fetchEnrichedJobCount() {
  return supabaseCount("jobs?select=id&enriched_at=not.is.null");
}

function getCachedEnrichedCount() {
  if (enrichedCountCache.value != null && Date.now() - enrichedCountCache.at < ENRICHED_COUNT_TTL_MS) {
    return enrichedCountCache.value;
  }
  return null;
}

function scheduleEnrichedCountRefresh() {
  if (enrichedCountCache.inflight) return;
  enrichedCountCache.inflight = fetchEnrichedJobCount()
    .then((count) => {
      if (Number.isFinite(count) && count >= 0) {
        enrichedCountCache.value = count;
        enrichedCountCache.at = Date.now();
      }
    })
    .catch(() => {})
    .finally(() => {
      enrichedCountCache.inflight = null;
    });
}

async function resolveBoardTotal(boardCtx) {
  if (boardCtx.mode === "browse") {
    scheduleEnrichedCountRefresh();
    return getCachedEnrichedCount();
  }
  try {
    return await supabaseCount(buildCountQuery(boardCtx));
  } catch {
    return null;
  }
}

function companyEmoji(name) {
  if (!name) return "\u{1F4BC}";
  const emojis = ["\u{1F3E2}", "\u{1F680}", "\u{1F4BB}", "\u26A1", "\u{1F310}"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return emojis[Math.abs(hash) % emojis.length];
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}min ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function mapEmploymentType(empType) {
  const t = String(empType || "").toLowerCase();
  if (t.includes("intern")) return "Internship";
  if (t.includes("contract")) return "Contract";
  if (t.includes("part")) return "Part-time";
  return "Full-time";
}

export function mapSupabaseJob(row, { match = 0, searchScore = 0, skillHits = 0, titleHits = 0 } = {}) {
  const tags = Array.isArray(row.skills) ? row.skills.slice(0, 6) : [];
  const remote = row.remote_type === "remote" || /remote/i.test(row.location || "");
  const postedAtIso = row.updated_at || row.first_published || null;
  const posted = timeAgo(postedAtIso);
  return {
    id: row.id,
    title: row.title || "",
    company: row.company || "",
    co: row.company || "",
    logo: companyEmoji(row.company),
    location: row.location || "",
    loc: row.location || "",
    remote,
    type: mapEmploymentType(row.employment_type),
    salary: "",
    sal: "",
    tags,
    posted,
    publishedAt: postedAtIso,
    isNew: posted.includes("h ago") || posted.includes("min ago") || posted === "Just now",
    description: "",
    desc: "",
    descHtml: "",
    url: row.apply_url || "",
    source: `ats:${row.ats || "unknown"}`,
    category: "",
    seniority: "",
    experience: row.min_experience ? `${row.min_experience}+ yrs` : "",
    match: match || scoreToMatch(searchScore),
    searchScore,
    skillHits,
    titleHits,
    req: tags.length ? tags.map((t) => `${t} experience`) : ["See job listing for requirements"],
  };
}

function rowToRaw(row) {
  return {
    id: row.id,
    status: "ACTIVE",
    title: row.title || "",
    titleTokens: buildTitleTokens(row.title || ""),
    skills: Array.isArray(row.skills) ? row.skills : [],
    minExperience: row.min_experience || 0,
    maxExperience: row.max_experience || 0,
    postedAt: row.updated_at || row.first_published || "",
    updatedAt: row.updated_at || "",
  };
}

function decodeOffsetCursor(cursor) {
  if (!cursor) return 0;
  try {
    const { offset } = JSON.parse(Buffer.from(String(cursor), "base64url").toString("utf8"));
    return Number.isFinite(offset) ? Math.max(0, offset) : 0;
  } catch {
    return 0;
  }
}

function encodeOffsetCursor(offset) {
  return Buffer.from(JSON.stringify({ offset }), "utf8").toString("base64url");
}

function buildJobsQuery(boardCtx, { offset, limit }) {
  const parts = [`select=${JOB_SELECT}`, "enriched_at=not.is.null", "order=updated_at.desc.nullslast", `limit=${limit}`, `offset=${offset}`];

  if (boardCtx.mode === "skills" && boardCtx.userSkills.length) {
    const skill = boardCtx.userSkills[0];
    parts.push(`skills=cs.${encodeURIComponent(JSON.stringify([skill.toLowerCase()]))}`);
  } else if (boardCtx.mode === "title" && boardCtx.searchStr) {
    parts.push(`title=ilike.${encodeURIComponent(`*${boardCtx.searchStr}*`)}`);
  }

  return `jobs?${parts.join("&")}`;
}

function buildCountQuery(boardCtx) {
  const parts = ["select=id", "enriched_at=not.is.null"];
  if (boardCtx.mode === "skills" && boardCtx.userSkills.length) {
    const skill = boardCtx.userSkills[0];
    parts.push(`skills=cs.${encodeURIComponent(JSON.stringify([skill.toLowerCase()]))}`);
  } else if (boardCtx.mode === "title" && boardCtx.searchStr) {
    parts.push(`title=ilike.${encodeURIComponent(`*${boardCtx.searchStr}*`)}`);
  }
  return `jobs?${parts.join("&")}`;
}

export async function searchBoardJobsSupabase({
  search = "",
  category = "",
  page = 1,
  pageSize = 10,
  cursor = null,
  filters = {},
}) {
  const partialErrors = [];
  const boardCtx = buildBoardSearchParams({ search, category });
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const size = Math.max(1, Math.trunc(pageSize) || 10);
  const offset = cursor ? decodeOffsetCursor(cursor) : (safePage - 1) * size;

  let rows = [];
  let dbTotal = null;
  try {
    [rows, dbTotal] = await Promise.all([
      supabaseRest(buildJobsQuery(boardCtx, { offset, limit: size + 1 })),
      resolveBoardTotal(boardCtx),
    ]);
  } catch (err) {
    partialErrors.push(`board:browse: ${err.message}`);
    rows = [];
  }

  const hasMore = rows.length > size;
  const pageRows = rows.slice(0, size);

  const rankTitle = boardCtx.mode === "title" ? boardCtx.searchStr : "";
  const rankSkills = boardCtx.mode === "skills" ? boardCtx.userSkills : boardCtx.titleTokens;

  const ranked = pageRows.length
    ? rankJobs(pageRows.map(rowToRaw), {
      title: rankTitle,
      skills: rankSkills,
      explicitSearch: boardCtx.explicitSearch,
    })
    : [];

  let jobs = ranked.map(({ raw, score, skillHits, titleHits }) => {
    const row = pageRows.find((r) => r.id === raw.id) || pageRows[0];
    return mapSupabaseJob(row, { searchScore: score, skillHits, titleHits, match: scoreToMatch(score) });
  });

  jobs = dedupeJobs(jobs);
  jobs = applyJobFilters(jobs, filters);

  const total = dbTotal ?? (hasMore ? offset + size + 1 : offset + jobs.length);
  const totalPages = dbTotal != null ? Math.max(1, Math.ceil(dbTotal / size)) : null;
  const from = jobs.length ? offset + 1 : 0;
  const to = jobs.length ? offset + jobs.length : 0;
  const nextCursor = hasMore ? encodeOffsetCursor(offset + size) : null;

  return {
    jobs,
    pagination: {
      page: safePage,
      pageSize: size,
      total,
      totalPages,
      hasMore: Boolean(nextCursor),
      nextCursor,
      from,
      to,
    },
    meta: { dbTotal, docsRead: pageRows.length, source: "supabase" },
    sources: { supabase: total, docsRead: pageRows.length },
    partialErrors,
  };
}

export async function countMatchingJobsSupabase(params) {
  const partialErrors = [];
  const boardCtx = buildBoardSearchParams({
    search: params.search ?? params.title ?? "",
    category: params.category,
  });
  let dbTotal = 0;
  try {
    dbTotal = await supabaseCount(buildCountQuery(boardCtx));
  } catch (err) {
    partialErrors.push(`count: ${err.message}`);
  }
  return { count: dbTotal, dbTotal, truncated: false, partialErrors };
}

export async function getJobByDocIdSupabase(docId, { profile } = {}) {
  const id = String(docId || "").trim();
  if (!id) return null;
  let rows;
  try {
    rows = await supabaseRest(`jobs?id=eq.${encodeURIComponent(id)}&select=${JOB_SELECT}&limit=1`);
  } catch {
    return null;
  }
  const row = rows?.[0];
  if (!row) return null;

  let job = mapSupabaseJob(row);
  if (profile) {
    const params = buildSearchParams(profile, { useProfile: true });
    const ranked = rankJobs([rowToRaw(row)], params);
    if (ranked.length) {
      job = {
        ...job,
        match: scoreToMatch(ranked[0].score),
        searchScore: ranked[0].score,
        skillHits: ranked[0].skillHits,
        titleHits: ranked[0].titleHits,
      };
    }
  }
  return job;
}

export async function getTopMatchedJobsSupabase({
  profile,
  exp = null,
  location,
  category,
  limit = 10,
}) {
  const partialErrors = [];
  const params = buildSearchParams(profile, { useProfile: true });
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 10), 25);
  const poolSize = 80;

  let rows = [];
  try {
    rows = await supabaseRest(`jobs?select=${JOB_SELECT}&enriched_at=not.is.null&order=updated_at.desc.nullslast&limit=${poolSize}`);
  } catch (err) {
    partialErrors.push(`top: ${err.message}`);
  }

  const ranked = rankJobs(rows.map(rowToRaw), {
    title: params.title,
    skills: params.skills,
    exp: exp ?? params.exp,
    explicitSearch: false,
  });

  let jobs = ranked.map(({ raw, score, skillHits, titleHits }) => {
    const row = rows.find((r) => r.id === raw.id);
    return mapSupabaseJob(row, { searchScore: score, skillHits, titleHits, match: scoreToMatch(score) });
  });

  if (location) jobs = jobs.filter((j) => jobMatchesLocation(j, location));
  jobs = dedupeJobs(jobs).slice(0, safeLimit);

  return {
    jobs,
    queryUsed: [params.title, ...(params.skills || []).slice(0, 6)].filter(Boolean).join(" · "),
    searchParams: params,
    meta: { docsRead: rows.length, source: "supabase" },
    sources: { supabase: jobs.length, docsRead: rows.length },
    partialErrors,
  };
}
