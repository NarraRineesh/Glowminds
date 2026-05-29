import { getFirestore } from "../config/firebase.js";
import { normalizeDescriptionHtml, stripHtml } from "../utils/html.js";
import { buildTitleTokens } from "../utils/tokens.js";

// Maps frontend category slugs to the canonical `role` bucket the
// Python extractor stamps on every synced job document.
const CATEGORY_TO_ROLE = {
  "software-dev": "engineering",
  engineering: "engineering",
  data: "data",
  design: "design",
  product: "product",
  devops: "devops",
  qa: "qa",
  frontend: "frontend",
  backend: "backend",
  mobile: "mobile",
};

const DEFAULT_PAGE_SIZE = 10;
/** Max jobs loaded + ranked per search (pagination slices this list). */
const MAX_RANKED_JOBS = 120;
const RANKED_LIST_CACHE_TTL_MS = 120_000;

/** Cached ranked lists keyed by search params (not page). */
const rankedListCache = new Map();

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}min ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function companyEmoji(name) {
  if (!name) return "\u{1F4BC}";
  const n = String(name).toLowerCase();
  if (n.includes("google")) return "\u{1F50D}";
  if (n.includes("amazon") || n.includes("aws")) return "\u{1F4E6}";
  if (n.includes("microsoft")) return "\u{1FA9F}";
  if (n.includes("apple")) return "\u{1F34E}";
  if (n.includes("meta") || n.includes("facebook")) return "\u{1F4D8}";
  const emojis = [
    "\u{1F3E2}",
    "\u{1F680}",
    "\u{1F4BB}",
    "\u26A1",
    "\u{1F310}",
    "\u{1F527}",
    "\u{1F4E1}",
    "\u{1F3AF}",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return emojis[Math.abs(hash) % emojis.length];
}

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

function mapEmploymentType(empType) {
  const t = String(empType || "").toLowerCase();
  if (t.includes("intern")) return "Internship";
  if (t.includes("contract")) return "Contract";
  if (t.includes("part")) return "Part-time";
  return "Full-time";
}

function tsToIso(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate().toISOString();
    } catch {
      return "";
    }
  }
  if (value instanceof Date) return value.toISOString();
  return "";
}

// Maps a Firestore `jobs/{docId}` document into the unified job shape the
// frontend already consumes (id, title, company, tags, posted, ...).
function mapFirestoreJob(docId, data) {
  const tags = Array.isArray(data.skills) ? data.skills.slice(0, 6) : [];
  const descPlain = stripHtml(data.descriptionHtml || "");
  const postedAtIso = data.postedAt || tsToIso(data.indexedAt);
  const posted = timeAgo(postedAtIso);
  const loc = data.location || (data.remote ? "Remote" : "");
  const type = mapEmploymentType(data.employmentType);

  return {
    id: docId,
    title: data.title || "",
    company: data.company || "",
    co: data.company || "",
    logo: companyEmoji(data.company),
    location: loc,
    loc,
    remote: !!data.remote,
    type,
    salary: data.salary || "",
    sal: data.salary || "",
    tags,
    posted,
    publishedAt: postedAtIso || null,
    isNew:
      posted.includes("h ago") ||
      posted.includes("min ago") ||
      posted === "Just now",
    description: descPlain,
    desc: descPlain,
    descHtml: normalizeDescriptionHtml(data.descriptionHtml || ""),
    url: data.applyUrl || "",
    source: data.source || `ats:${data.ats || "unknown"}`,
    category: data.role || "",
    seniority: data.seniority || "",
    experience: data.experience || "",
    match: 0,
    req: extractRequirements(data.descriptionHtml || ""),
  };
}

function parseSkillsInput(skills) {
  if (Array.isArray(skills)) {
    return skills.map((s) => String(s).toLowerCase().trim()).filter(Boolean);
  }
  if (typeof skills === "string" && skills.trim()) {
    return skills
      .split(",")
      .map((s) => s.toLowerCase().trim())
      .filter(Boolean);
  }
  return [];
}

function jobMatchesQueryTokens(token, jobSkills, jobTitleTokens) {
  if (jobSkills.includes(token) || jobTitleTokens.includes(token)) return true;
  return jobSkills.some((s) => s.includes(token)) || jobTitleTokens.some((t) => t.includes(token));
}

// OR-with-ranking search — mirrors pipeline/search.html `searchJobs`.
//
// Profile mode: a job qualifies if it hits at least one title token OR skill.
// Explicit search: every query token must appear in the job title or skills.
function rankJobs(rawJobs, { title = "", skills = [], exp = null, explicitSearch = false } = {}) {
  const titleTokens = buildTitleTokens(title);
  const wantSkills = new Set(parseSkillsInput(skills));
  const userYears = exp === "" || exp == null ? null : Number(exp);
  const hasInput = titleTokens.length > 0 || wantSkills.size > 0;
  const queryTokens = explicitSearch
    ? [...new Set([...titleTokens, ...wantSkills])]
    : [];

  const out = [];
  for (const j of rawJobs) {
    if (j.status !== "ACTIVE") continue;

    if (userYears != null && Number.isFinite(userYears)) {
      const lo = j.minExperience || 0;
      const hi = j.maxExperience || 0;
      if (lo > 0 && userYears < lo) continue;
      if (hi > 0 && userYears > hi) continue;
    }

    const jobSkills = (j.skills || []).map((s) => String(s).toLowerCase());
    const jobTitleTokens =
      j.titleTokens?.length > 0 ? j.titleTokens : buildTitleTokens(j.title);

    if (explicitSearch && queryTokens.length > 0) {
      const matchesAll = queryTokens.every((t) =>
        jobMatchesQueryTokens(t, jobSkills, jobTitleTokens),
      );
      if (!matchesAll) continue;
    }

    let skillHits = 0;
    for (const s of jobSkills) if (wantSkills.has(s)) skillHits += 1;

    let titleHits = 0;
    for (const t of jobTitleTokens) if (titleTokens.includes(t)) titleHits += 1;

    const score = skillHits * 2 + titleHits;
    if (hasInput && score === 0) continue;

    out.push({ raw: j, score, skillHits, titleHits });
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const da = Date.parse(a.raw.postedAt || a.raw.updatedAt || 0) || 0;
    const db = Date.parse(b.raw.postedAt || b.raw.updatedAt || 0) || 0;
    return db - da;
  });

  return out;
}

function scoreToMatch(score) {
  if (!score) return 60;
  return Math.min(99, 55 + score * 8);
}

function profileExperienceYears(profile) {
  if (profile?.isFresher) return 0;
  const entries = Array.isArray(profile?.experience) ? profile.experience : [];
  if (!entries.length) return null;

  let totalMonths = 0;
  for (const entry of entries) {
    const start = entry?.startDate || entry?.from;
    const end = entry?.endDate || entry?.to || entry?.currently ? new Date() : null;
    const startMs = start ? Date.parse(start) : NaN;
    const endMs = end ? Date.parse(end) : Date.now();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;
    totalMonths += Math.max(0, (endMs - startMs) / (30.44 * 24 * 3600 * 1000));
  }
  if (totalMonths <= 0) return null;
  return Math.round(totalMonths / 12);
}

export function buildSearchParams(profile, overrides = {}) {
  const {
    search = "",
    title = "",
    skills,
    exp,
    useProfile = true,
  } = overrides;

  let titleStr = String(title || "").trim();
  let skillList = parseSkillsInput(skills);
  let userExp = exp;
  const searchStr = String(search || "").trim();
  const hasExplicitTitleOrSkills = Boolean(titleStr || skillList.length);

  // Typed search overrides profile title/skills (e.g. "pega developer").
  if (searchStr && !hasExplicitTitleOrSkills) {
    if (searchStr.includes(",")) {
      skillList = parseSkillsInput(searchStr);
    } else {
      titleStr = searchStr;
      // Also query the skills index — "pega" often lives in skills, not title.
      skillList = buildTitleTokens(searchStr);
    }
    return {
      title: titleStr,
      skills: skillList,
      exp: userExp === undefined || userExp === "" ? null : userExp,
      explicitSearch: true,
    };
  }

  // Single search box: "node, postgres" -> skills; "backend engineer" -> title.
  if (!titleStr && !skillList.length && searchStr) {
    if (searchStr.includes(",")) skillList = parseSkillsInput(searchStr);
    else titleStr = searchStr;
  }

  if (useProfile !== false && profile) {
    const technical = (profile.skills?.technical || [])
      .map((s) => String(s).trim())
      .filter(Boolean);
    if (!skillList.length && technical.length) skillList = technical;

    if (!titleStr) {
      titleStr = String(profile.headline || "").trim();
      if (!titleStr && profile.isFresher) titleStr = "fresher internship";
      else if (!titleStr) titleStr = "software engineer";
    }

    if (userExp === undefined || userExp === null || userExp === "") {
      userExp = profileExperienceYears(profile);
    }
  }

  if (useProfile === false && !titleStr && !skillList.length) {
    titleStr = String(search || "").trim();
  }

  return {
    title: titleStr,
    skills: skillList,
    exp: userExp === undefined || userExp === "" ? null : userExp,
    explicitSearch: false,
  };
}

/** @deprecated Use buildSearchParams — kept for callers expecting a query string. */
export function buildJobSearchQuery(profile, userSearch = "") {
  const { title, skills } = buildSearchParams(profile, { search: userSearch });
  const parts = [];
  if (title) parts.push(title);
  if (skills.length) parts.push(skills.slice(0, 6).join(", "));
  return parts.join(" ").trim() || (profile?.isFresher ? "fresher internship" : "software engineer");
}

function normalizeLocation(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\bbanglore\b/g, "bangalore");
}

function jobMatchesLocation(job, location) {
  if (!location) return true;
  const loc = normalizeLocation(location);
  // The ATS sync filters jobs to India already, so a generic "India" or
  // empty location passes everything through.
  if (!loc || loc === "india") return true;
  if (job.remote) return true;
  const jobLoc = normalizeLocation(job.location);
  return jobLoc.includes(loc) || loc.includes(jobLoc);
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((j) => {
    const key = (j.url || `${j.co}|${j.title}`).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyJobFilters(jobs, filters = {}) {
  let out = jobs;
  if (filters.type) {
    out = out.filter((j) => j.type === filters.type);
  }
  if (filters.minMatch != null && Number.isFinite(Number(filters.minMatch))) {
    const min = Number(filters.minMatch);
    out = out.filter((j) => (j.match || 0) >= min);
  }
  if (filters.newToday) {
    out = out.filter((j) => j.isNew);
  }
  return out;
}

function paginateJobs(jobs, { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const size = Math.max(1, Math.trunc(pageSize) || DEFAULT_PAGE_SIZE);
  const total = jobs.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const start = (safePage - 1) * size;
  const paged = jobs.slice(start, start + size);
  return {
    jobs: paged,
    pagination: {
      page: safePage,
      pageSize: size,
      total,
      totalPages,
      hasMore: safePage < totalPages,
      from: total === 0 ? 0 : start + 1,
      to: start + paged.length,
    },
  };
}

export async function loadProfileContext(uid) {
  const snap = await getFirestore().collection("users").doc(uid).get();
  const profile = snap.exists ? snap.data()?.profile || {} : {};
  const technical = (profile.skills?.technical || [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  const soft = (profile.skills?.soft || [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  return {
    profile,
    skillTerms: [...technical, ...soft],
    scoringSkills: technical.length ? technical : [...technical, ...soft],
  };
}

async function runJobQuery(q, partialErrors, label) {
  try {
    const snap = await q.get();
    return snap.docs;
  } catch (err) {
    console.warn(`jobSearch firestore ${label}:`, err);
    partialErrors.push(`${label}: ${err.message || "query failed"}`);
    return [];
  }
}

/** Build a Firestore query — one indexed query, no in-memory pool scan. */
function buildJobQuery(db, { roleKey, userSkills, titleTokens, hasInput }) {
  let q = db.collection("jobs").where("status", "==", "ACTIVE");
  if (roleKey) q = q.where("role", "==", roleKey);

  // Firestore array-contains-any accepts at most 10 values.
  if (hasInput && userSkills.length > 0) {
    q = q.where("skills", "array-contains-any", userSkills.slice(0, 10));
  } else if (hasInput && titleTokens.length > 0) {
    q = q.where("titleTokens", "array-contains-any", titleTokens.slice(0, 10));
  }

  return q.orderBy("indexedAt", "desc");
}

function docsToRawJobs(docs) {
  return docs.map((doc) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      status: data.status || "ACTIVE",
      title: data.title || "",
      titleTokens: data.titleTokens || [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      minExperience: data.minExperience || 0,
      maxExperience: data.maxExperience || 0,
      postedAt: data.postedAt || tsToIso(data.indexedAt),
      updatedAt: tsToIso(data.updatedAt) || data.postedAt || "",
      data,
    };
  });
}

function mapRankedJobs(ranked) {
  return ranked.map(({ raw, score, skillHits, titleHits }) => ({
    ...mapFirestoreJob(raw.id, raw.data),
    match: scoreToMatch(score),
    searchScore: score,
    skillHits,
    titleHits,
  }));
}

function rankedListCacheKey(params) {
  const { page, pageSize, includeRankedList, poolSize, ...rest } = params;
  return JSON.stringify(rest);
}

async function buildRankedJobList({
  title = "",
  skills = [],
  exp = null,
  location,
  category,
  filters = {},
  explicitSearch = false,
}) {
  const db = getFirestore();
  const userSkills = parseSkillsInput(skills);
  const titleTokens = buildTitleTokens(title);
  const hasInput = userSkills.length > 0 || titleTokens.length > 0;
  const roleKey = category ? CATEGORY_TO_ROLE[String(category).toLowerCase()] : null;
  const partialErrors = [];

  const q = buildJobQuery(db, { roleKey, userSkills, titleTokens, hasInput });
  const queryLabel = hasInput
    ? userSkills.length > 0
      ? "skills"
      : "titleTokens"
    : "recent";

  const docs = await runJobQuery(q.limit(MAX_RANKED_JOBS), partialErrors, queryLabel);

  const ranked = rankJobs(docsToRawJobs(docs), { title, skills, exp, explicitSearch });
  let jobs = mapRankedJobs(ranked);

  if (location) jobs = jobs.filter((j) => jobMatchesLocation(j, location));
  jobs = dedupeJobs(jobs);
  jobs = applyJobFilters(jobs, filters);

  return {
    jobs,
    dbTotal: docs.length,
    truncated: docs.length >= MAX_RANKED_JOBS,
    docsRead: docs.length,
    partialErrors,
  };
}

async function getRankedJobList(params) {
  const key = rankedListCacheKey(params);
  const hit = rankedListCache.get(key);
  if (hit && Date.now() - hit.at < RANKED_LIST_CACHE_TTL_MS) {
    return hit.data;
  }

  const data = await buildRankedJobList(params);
  rankedListCache.set(key, { at: Date.now(), data });
  if (rankedListCache.size > 40) {
    const oldest = [...rankedListCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) rankedListCache.delete(oldest[0]);
  }
  return data;
}

// Paginate a stable ranked list (built once per search, cached server-side).
export async function searchAllJobs({
  title = "",
  skills = [],
  exp = null,
  location,
  category,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  poolSize,
  filters = {},
  explicitSearch = false,
  includeRankedList = false,
}) {
  void poolSize;

  const safePage = Math.max(1, Math.trunc(page) || 1);
  const size = Math.max(1, Math.trunc(pageSize) || DEFAULT_PAGE_SIZE);

  const {
    jobs: allJobs,
    dbTotal,
    truncated,
    docsRead,
    partialErrors,
  } = await getRankedJobList({
    title,
    skills,
    exp,
    location,
    category,
    filters,
    explicitSearch,
  });

  const { jobs, pagination } = paginateJobs(allJobs, { page: safePage, pageSize: size });

  return {
    jobs,
    pagination,
    rankedJobs: includeRankedList ? allJobs : undefined,
    meta: { dbTotal, truncated, docsRead },
    sources: { firestore: pagination.total, docsRead },
    partialErrors,
  };
}

/** Total matching jobs (same ranked list as search). */
export async function countMatchingJobs(params) {
  const { jobs, dbTotal, truncated, partialErrors } = await getRankedJobList({
    title: params.title || "",
    skills: params.skills || [],
    exp: params.exp ?? null,
    location: params.location,
    category: params.category,
    filters: params.filters || {},
    explicitSearch: params.explicitSearch ?? false,
  });

  return {
    count: jobs.length,
    dbTotal,
    truncated,
    partialErrors,
  };
}

/** Fetch one ACTIVE job by Firestore doc id (supports encoded ids with %2F). */
export async function getJobByDocId(docId, { profile } = {}) {
  const id = String(docId || "").trim();
  if (!id) return null;

  const snap = await getFirestore().collection("jobs").doc(id).get();
  if (!snap.exists) return null;

  const data = snap.data() || {};
  if (data.status && data.status !== "ACTIVE") return null;

  let job = mapFirestoreJob(snap.id, data);

  if (profile) {
    const params = buildSearchParams(profile, { useProfile: true });
    const ranked = rankJobs(
      [
        {
          id: snap.id,
          status: data.status || "ACTIVE",
          title: data.title || "",
          titleTokens: data.titleTokens || [],
          skills: Array.isArray(data.skills) ? data.skills : [],
          minExperience: data.minExperience || 0,
          maxExperience: data.maxExperience || 0,
          postedAt: data.postedAt || tsToIso(data.indexedAt),
          updatedAt: tsToIso(data.updatedAt) || data.postedAt || "",
          data,
        },
      ],
      params,
    );
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
