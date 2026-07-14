// Job board queries against Supabase `jobs` table.

import { buildTitleTokens } from "../utils/tokens.js";
import {
  buildBoardSearchParams,
  buildSearchParams,
  rankJobs,
  scoreToMatch,
  dedupeJobs,
  applyJobFilters,
  jobMatchesLocation,
  profileReadyForJobMatches,
} from "./jobSearch.js";
import { supabaseRest, supabaseCount } from "./supabaseClient.js";

const JOB_SELECT =
  "id,title,company,location,apply_url,skills,min_experience,max_experience,employment_type,remote_type,updated_at,first_published,last_seen_at,created_at,ats";

/** Prefer real post date over sync/enrichment stamps (updated_at is often a bulk wave). */
function jobPostedAt(row) {
  return row?.first_published || row?.updated_at || row?.created_at || row?.last_seen_at || null;
}

/** Cached enriched-job total — exact COUNT on 300k+ rows takes several seconds. */
const enrichedCountCache = { value: null, at: 0, inflight: null };
const ENRICHED_COUNT_TTL_MS = 15 * 60 * 1000;

/** Title patterns for category when Supabase has no `role` column. */
const ROLE_TITLE_PATTERNS = {
  engineering: ["*engineer*", "*developer*", "*software*"],
  data: ["*data*", "*analyst*", "*ml *", "*machine learning*"],
  design: ["*design*", "*ux*", "*ui *", "*product designer*"],
  product: ["*product manager*", "*product owner*", "*product lead*"],
  devops: ["*devops*", "*sre*", "*platform engineer*", "*infrastructure*"],
  qa: ["*qa*", "*quality assurance*", "*test engineer*", "*sdet*"],
  frontend: ["*frontend*", "*front-end*", "*front end*", "*react*", "*ui engineer*"],
  backend: ["*backend*", "*back-end*", "*back end*", "*api engineer*"],
  mobile: ["*mobile*", "*android*", "*ios*", "*flutter*", "*react native*"],
};

async function fetchEnrichedJobCount() {
  // Prefer timestamp filter — bare `jobs?select=id` HEAD can 500 on this table.
  const count = await supabaseCount("jobs?select=id&enriched_at=gt.1970-01-01");
  if (count != null) return count;
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

async function resolveBoardTotal(boardCtx, filters, { softType = false } = {}) {
  // Soft type / newToday shrink the page after fetch — exact DB count is misleading.
  if (filters?.newToday || softType) return null;

  if (boardCtx.mode === "browse" && !boardCtx.roleKey && !filters?.type) {
    scheduleEnrichedCountRefresh();
    const cached = getCachedEnrichedCount();
    if (cached != null) return cached;
    // Await once on cold cache so browse pagination is correct.
    try {
      const count = await fetchEnrichedJobCount();
      if (Number.isFinite(count) && count >= 0) {
        enrichedCountCache.value = count;
        enrichedCountCache.at = Date.now();
        return count;
      }
    } catch {
      return null;
    }
    return null;
  }

  try {
    const { pathname } = buildCountQuery(boardCtx, filters);
    return await supabaseCount(pathname);
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
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}min ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function isPostedToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() < 24 * 60 * 60 * 1000;
}

function inferEmploymentType(empType, title = "") {
  const t = `${empType || ""} ${title || ""}`.toLowerCase();
  if (/\bintern(ship)?\b/.test(t)) return "Internship";
  if (/\bcontract(or|ing)?\b|\bfreelance\b/.test(t)) return "Contract";
  if (/\bpart[\s-]?time\b/.test(t)) return "Part-time";
  return "Full-time";
}

export function mapSupabaseJob(row, { match = 0, searchScore = 0, skillHits = 0, titleHits = 0 } = {}) {
  const tags = Array.isArray(row.skills) ? row.skills.slice(0, 6) : [];
  const remote = row.remote_type === "remote" || /remote/i.test(row.location || "");
  const postedAtIso = jobPostedAt(row);
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
    type: inferEmploymentType(row.employment_type, row.title),
    salary: "",
    sal: "",
    tags,
    posted,
    publishedAt: postedAtIso,
    isNew: isPostedToday(row.first_published || postedAtIso),
    description: "",
    desc: "",
    descHtml: "",
    url: row.apply_url || "",
    source: `ats:${row.ats || "unknown"}`,
    category: "",
    seniority: "",
    experience: row.min_experience ? `${row.min_experience}+ yrs` : "",
    match: match != null ? match : scoreToMatch(searchScore),
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
    postedAt: jobPostedAt(row) || "",
    updatedAt: row.updated_at || row.last_seen_at || "",
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

function appendRoleFilter(parts, roleKey) {
  if (!roleKey) return;
  const patterns = ROLE_TITLE_PATTERNS[roleKey];
  if (!patterns?.length) return;
  const or = patterns.map((p) => `title.ilike.${p}`).join(",");
  parts.push(`or=(${or})`);
}

function appendTypeFilter(parts, type) {
  if (!type) return;
  const t = String(type).toLowerCase();
  if (t === "contract") {
    parts.push("or=(employment_type.ilike.*contract*,title.ilike.*contract*,title.ilike.*freelance*)");
    // Avoid false positives like "Subcontracts".
    parts.push("title=not.ilike.*subcontract*");
  } else if (t === "internship") {
    parts.push("or=(employment_type.ilike.*intern*,title.ilike.*intern*)");
  } else if (t === "part-time") {
    parts.push("or=(employment_type.ilike.*part*,title.ilike.*part-time*,title.ilike.*part time*)");
  } else if (t === "full-time") {
    // Exclude obvious non-full-time titles when column is null for everyone.
    parts.push("title=not.ilike.*contract*");
    parts.push("title=not.ilike.*intern*");
    parts.push("title=not.ilike.*freelance*");
  }
}

function skillsContainFilter(skills) {
  const variants = [];
  for (const skill of skills.slice(0, 5)) {
    const s = String(skill || "").trim();
    if (!s) continue;
    variants.push(s.toLowerCase());
    if (s !== s.toLowerCase()) variants.push(s);
  }
  const unique = [...new Set(variants)];
  if (!unique.length) return null;
  if (unique.length === 1) {
    return `skills=cs.${encodeURIComponent(JSON.stringify([unique[0]]))}`;
  }
  const or = unique
    .map((s) => `skills.cs.${encodeURIComponent(JSON.stringify([s]))}`)
    .join(",");
  return `or=(${or})`;
}

function queryUsesOr(parts) {
  return parts.some((p) => p.startsWith("or="));
}

/**
 * Build list/count query. PostgREST allows one `or=` — when skills/role already
 * consume it, type is applied in-memory (softType) by the caller.
 */
function buildQueryParts(boardCtx, filters = {}, { forCount = false, offset = 0, limit = 10 } = {}) {
  const parts = forCount
    ? ["select=id", "enriched_at=not.is.null"]
    : [
        `select=${JOB_SELECT}`,
        "enriched_at=not.is.null",
        // Must use updated_at — matches jobs_enriched_updated_at_idx. Ordering by
        // first_published (no index) times out on 350k+ rows.
        "order=updated_at.desc.nullslast",
        `limit=${limit}`,
        `offset=${offset}`,
      ];

  if (boardCtx.mode === "skills" && boardCtx.userSkills.length) {
    const skillFilter = skillsContainFilter(boardCtx.userSkills);
    if (skillFilter) parts.push(skillFilter);
  } else if (boardCtx.mode === "title" && boardCtx.searchStr) {
    parts.push(`title=ilike.${encodeURIComponent(`*${boardCtx.searchStr}*`)}`);
  }

  appendRoleFilter(parts, boardCtx.roleKey);

  let softType = false;
  if (filters.type) {
    if (queryUsesOr(parts) && String(filters.type).toLowerCase() !== "full-time") {
      // Full-time uses `not.ilike` (AND), which doesn't need `or=`.
      softType = true;
    } else {
      appendTypeFilter(parts, filters.type);
    }
  }

  return { parts, softType };
}

function buildJobsQuery(boardCtx, { offset, limit, filters = {} }) {
  const { parts, softType } = buildQueryParts(boardCtx, filters, { offset, limit });
  return { pathname: `jobs?${parts.join("&")}`, softType };
}

function buildCountQuery(boardCtx, filters = {}) {
  const { parts, softType } = buildQueryParts(boardCtx, filters, { forCount: true });
  return { pathname: `jobs?${parts.join("&")}`, softType };
}

/** Resolve pagination total — never prefer a failed-count 0 over a row-based estimate. */
function resolvePaginationTotal(dbTotal, { offset, size, hasMore, jobCount }) {
  const estimate = hasMore ? offset + size + 1 : offset + jobCount;
  if (dbTotal == null || !Number.isFinite(dbTotal)) return estimate;
  // Suspicious: DB said 0 but we clearly have rows / more pages.
  if (dbTotal === 0 && (jobCount > 0 || hasMore)) return estimate;
  return dbTotal;
}

export async function searchBoardJobsSupabase({
  search = "",
  category = "",
  page = 1,
  pageSize = 10,
  cursor = null,
  filters = {},
  profile = null,
}) {
  // Best Match: profile-ranked pool (requires skills — no invented defaults).
  if (filters.minMatch != null && Number(filters.minMatch) > 0) {
    if (!profileReadyForJobMatches(profile)) {
      const size = Math.max(1, Math.trunc(pageSize) || 12);
      const safePage = Math.max(1, Math.trunc(page) || 1);
      return {
        jobs: [],
        pagination: {
          page: safePage,
          pageSize: size,
          total: 0,
          totalPages: 1,
          hasMore: false,
          nextCursor: null,
          from: 0,
          to: 0,
        },
        meta: { dbTotal: 0, docsRead: 0, source: "supabase-best-match", skipped: "profile-incomplete" },
        sources: { supabase: 0, docsRead: 0 },
        partialErrors: [],
      };
    }
    return searchBestMatchBoardSupabase({
      profile,
      category,
      page,
      pageSize,
      cursor,
      filters,
    });
  }

  const partialErrors = [];
  const boardCtx = buildBoardSearchParams({ search, category });
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const size = Math.max(1, Math.trunc(pageSize) || 12);
  const offset = cursor ? decodeOffsetCursor(cursor) : (safePage - 1) * size;

  const fetchLimit =
    filters.type || filters.newToday ? Math.min(50, size * 3 + 1) : size + 1;
  const { pathname, softType } = buildJobsQuery(boardCtx, {
    offset,
    limit: fetchLimit,
    filters,
  });

  let rows = [];
  let dbTotal = null;
  try {
    // Filtered boards: count first (Prefer:count can flake when raced with large GETs).
    // Browse: run in parallel; enriched total is cached after the first hit.
    if (filters.type || filters.newToday || softType) {
      dbTotal = await resolveBoardTotal(boardCtx, filters, { softType });
      rows = await supabaseRest(pathname);
    } else {
      [rows, dbTotal] = await Promise.all([
        supabaseRest(pathname),
        resolveBoardTotal(boardCtx, filters, { softType }),
      ]);
    }
  } catch (err) {
    partialErrors.push(`board:browse: ${err.message}`);
    if (!Array.isArray(rows)) rows = [];
  }

  const pageRows = Array.isArray(rows) ? rows : [];
  const fetchedMore = pageRows.length >= fetchLimit;

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

  // Always re-apply type after title-based inference (DB `ilike` is looser than
  // word-boundary matching). softType/newToday also need in-memory filters.
  const postFilters = { ...filters };
  delete postFilters.minMatch;
  jobs = applyJobFilters(jobs, postFilters);

  const hasMore = jobs.length > size || fetchedMore;
  jobs = jobs.slice(0, size);

  const total = resolvePaginationTotal(dbTotal, {
    offset,
    size,
    hasMore,
    jobCount: jobs.length,
  });
  const totalPages = Number.isFinite(total) ? Math.max(1, Math.ceil(total / size)) : null;
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

async function searchBestMatchBoardSupabase({
  profile,
  category,
  page = 1,
  pageSize = 10,
  cursor = null,
  filters = {},
}) {
  const partialErrors = [];
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const size = Math.max(1, Math.trunc(pageSize) || 12);
  const offset = cursor ? decodeOffsetCursor(cursor) : (safePage - 1) * size;
  const poolLimit = Math.min(80, Math.max(offset + size + 10, 40));

  const top = await getTopMatchedJobsSupabase({
    profile,
    category,
    limit: poolLimit,
  });
  if (top.partialErrors?.length) partialErrors.push(...top.partialErrors);

  // minMatch is a signal to use profile ranking, not a hard cutoff.
  // Title-only scores often land ~70–75; skills data is sparse in Supabase.
  const softFilters = { ...filters };
  delete softFilters.minMatch;
  let jobs = applyJobFilters(top.jobs || [], softFilters);
  const total = jobs.length;
  const pageJobs = jobs.slice(offset, offset + size);
  const hasMore = offset + size < total;
  const nextCursor = hasMore ? encodeOffsetCursor(offset + size) : null;

  return {
    jobs: pageJobs,
    pagination: {
      page: safePage,
      pageSize: size,
      total,
      totalPages: Math.max(1, Math.ceil(total / size) || 1),
      hasMore: Boolean(nextCursor),
      nextCursor,
      from: pageJobs.length ? offset + 1 : 0,
      to: pageJobs.length ? offset + pageJobs.length : 0,
    },
    meta: {
      dbTotal: total,
      docsRead: top.meta?.docsRead ?? 0,
      source: "supabase-best-match",
    },
    sources: { supabase: total, docsRead: top.meta?.docsRead ?? 0 },
    partialErrors,
  };
}

export async function countMatchingJobsSupabase(params) {
  const partialErrors = [];
  const boardCtx = buildBoardSearchParams({
    search: params.search ?? params.title ?? "",
    category: params.category,
  });
  const filters = params.filters || {};
  let dbTotal = null;
  try {
    const { pathname, softType } = buildCountQuery(boardCtx, filters);
    dbTotal = await resolveBoardTotal(boardCtx, filters, { softType });
    if (dbTotal == null && !softType && !filters?.newToday) {
      dbTotal = await supabaseCount(pathname);
    }
  } catch (err) {
    partialErrors.push(`count: ${err.message}`);
  }
  return { count: dbTotal ?? 0, dbTotal, truncated: false, partialErrors };
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
  if (!profileReadyForJobMatches(profile)) {
    return {
      jobs: [],
      queryUsed: "",
      searchParams: { title: "", skills: [], exp: null, explicitSearch: false },
      meta: { docsRead: 0, source: "supabase", skipped: "profile-incomplete" },
      sources: { supabase: 0, docsRead: 0 },
      partialErrors,
    };
  }

  const params = buildSearchParams(profile, { useProfile: true });
  const boardCtx = buildBoardSearchParams({ category });
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 10), 80);
  const poolSize = Math.min(120, Math.max(80, safeLimit * 3));

  if (!params.skills?.length && !params.title) {
    return {
      jobs: [],
      queryUsed: "",
      searchParams: params,
      meta: { docsRead: 0, source: "supabase", skipped: "profile-incomplete" },
      sources: { supabase: 0, docsRead: 0 },
      partialErrors,
    };
  }

  let rows = [];
  try {
    const parts = [
      `select=${JOB_SELECT}`,
      "enriched_at=not.is.null",
      "order=updated_at.desc.nullslast",
      `limit=${poolSize}`,
    ];
    // Prefer skill-containing pool when profile has skills.
    if (params.skills?.length) {
      const skillFilter = skillsContainFilter(params.skills);
      if (skillFilter) parts.push(skillFilter);
    } else if (params.title) {
      parts.push(`title=ilike.${encodeURIComponent(`*${params.title}*`)}`);
    }
    if (!queryUsesOr(parts)) appendRoleFilter(parts, boardCtx.roleKey);
    rows = await supabaseRest(`jobs?${parts.join("&")}`);
  } catch (err) {
    // Skills/cs may miss most rows (sparse skills) — fall back to recent jobs.
    try {
      const parts = [
        `select=${JOB_SELECT}`,
        "enriched_at=not.is.null",
        "order=updated_at.desc.nullslast",
        `limit=${poolSize}`,
      ];
      if (params.title) {
        parts.push(`title=ilike.${encodeURIComponent(`*${params.title}*`)}`);
      }
      if (!queryUsesOr(parts)) appendRoleFilter(parts, boardCtx.roleKey);
      rows = await supabaseRest(`jobs?${parts.join("&")}`);
      partialErrors.push(`top:skills-fallback: ${err.message}`);
    } catch (err2) {
      partialErrors.push(`top: ${err2.message}`);
    }
  }

  const ranked = rankJobs((rows || []).map(rowToRaw), {
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
    meta: { docsRead: (rows || []).length, source: "supabase" },
    sources: { supabase: jobs.length, docsRead: (rows || []).length },
    partialErrors,
  };
}

/** Admin: total enriched jobs. */
export async function getAdminJobStats() {
  scheduleEnrichedCountRefresh();
  const cached = getCachedEnrichedCount();
  if (cached != null) return { total: cached };
  try {
    const count = await fetchEnrichedJobCount();
    if (Number.isFinite(count) && count >= 0) {
      enrichedCountCache.value = count;
      enrichedCountCache.at = Date.now();
      return { total: count };
    }
  } catch {
    // fall through
  }
  return { total: 0 };
}

/** Admin: create a manual listing in Supabase. */
export async function createAdminJob({
  title,
  company = "",
  location = "",
  applyUrl = "",
  employmentType = "",
  remote = false,
} = {}) {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) throw new Error("title is required");

  const now = new Date().toISOString();
  const externalId = `manual-${Date.now()}`;
  const id = `manual:glowminds:${externalId}`;
  const row = {
    id,
    ats: "manual",
    company_slug: "glowminds",
    external_id: externalId,
    title: cleanTitle,
    company: String(company || "").trim() || "Glowminds",
    location: String(location || "").trim() || "",
    apply_url: String(applyUrl || "").trim() || "",
    skills: [],
    employment_type: String(employmentType || "").trim() || null,
    remote_type: remote ? "remote" : null,
    enriched_at: now,
    updated_at: now,
    first_published: now,
    last_seen_at: now,
    synced_at: now,
    created_at: now,
  };

  await supabaseRest("jobs", {
    method: "POST",
    body: row,
    prefer: "return=representation",
  });
  return mapSupabaseJob(row);
}

/** Admin: hard-delete a job from Supabase. */
export async function deleteAdminJob(jobId) {
  const id = String(jobId || "").trim();
  if (!id) throw new Error("jobId is required");
  await supabaseRest(`jobs?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return { ok: true, id };
}
