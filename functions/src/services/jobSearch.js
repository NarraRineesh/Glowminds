import { getFirestore } from "../config/firebase.js";
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

const POOL_DEFAULT = 100;
const POOL_MAX = 250;

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
    descHtml: data.descriptionHtml || "",
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

// OR-with-ranking search — mirrors pipeline/search.html `searchJobs`.
//
// Title and skills are NOT AND'd: a job qualifies if it hits at least one
// title token OR at least one skill. Rank = skillHits * 2 + titleHits.
function rankJobs(rawJobs, { title = "", skills = [], exp = null } = {}) {
  const titleTokens = buildTitleTokens(title);
  const wantSkills = new Set(parseSkillsInput(skills));
  const userYears = exp === "" || exp == null ? null : Number(exp);
  const hasInput = titleTokens.length > 0 || wantSkills.size > 0;

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

function jobMatchesLocation(job, location) {
  if (!location) return true;
  const loc = location.trim().toLowerCase();
  // The ATS sync filters jobs to India already, so a generic "India" or
  // empty location passes everything through.
  if (!loc || loc === "india") return true;
  if (job.remote) return true;
  return (job.location || "").toLowerCase().includes(loc);
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

// Reads ACTIVE jobs from Firestore, ranks with pipeline-style OR search.
export async function searchAllJobs({
  title = "",
  skills = [],
  exp = null,
  location,
  category,
  limitPerSource,
  poolSize,
}) {
  const db = getFirestore();
  const requested = Number(limitPerSource) || 30;
  const cap = Math.min(Math.max(Number(poolSize) || requested * 4, 50), POOL_MAX);
  const target = Math.min(Math.max(cap, requested, POOL_DEFAULT), POOL_MAX);

  let q = db.collection("jobs").where("status", "==", "ACTIVE");

  const roleKey = category ? CATEGORY_TO_ROLE[String(category).toLowerCase()] : null;
  if (roleKey) q = q.where("role", "==", roleKey);

  q = q.orderBy("indexedAt", "desc").limit(target);

  const partialErrors = [];
  let docs = [];
  try {
    const snap = await q.get();
    docs = snap.docs;
  } catch (err) {
    console.warn("jobSearch firestore:", err);
    partialErrors.push(`firestore: ${err.message || "query failed"}`);
  }

  const rawJobs = docs.map((doc) => {
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

  const ranked = rankJobs(rawJobs, { title, skills, exp });

  let jobs = ranked.map(({ raw, score, skillHits, titleHits }) => ({
    ...mapFirestoreJob(raw.id, raw.data),
    match: scoreToMatch(score),
    searchScore: score,
    skillHits,
    titleHits,
  }));

  if (location) jobs = jobs.filter((j) => jobMatchesLocation(j, location));

  const merged = dedupeJobs(jobs).slice(0, requested);

  return {
    jobs: merged,
    sources: { firestore: merged.length },
    partialErrors,
  };
}
