import { getFirestore } from "../config/firebase.js";

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

export function buildJobSearchQuery(profile, userSearch = "") {
  const manual = String(userSearch || "").trim();
  if (manual.length >= 2) return manual;

  const technical = (profile?.skills?.technical || [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 6);
  const soft = (profile?.skills?.soft || [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 2);
  const headline = String(profile?.headline || "").trim();

  const parts = [...technical, ...soft];
  if (headline && parts.length < 4) {
    parts.unshift(headline.split(/\s+/).slice(0, 3).join(" "));
  }
  if (parts.length) return parts.join(" ");
  if (headline) return headline;
  return profile?.isFresher ? "fresher internship" : "software developer";
}

export function calculateMatchScore(job, userSkills = []) {
  const skills = (userSkills || [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (!skills.length || !job.tags?.length) {
    if (!skills.length) return 60;
    const desc = (job.desc || "").toLowerCase();
    let hits = 0;
    for (const skill of skills) {
      if (desc.includes(skill.toLowerCase())) hits += 1;
    }
    return Math.min(85, 58 + Math.round((hits / Math.max(skills.length, 1)) * 25));
  }

  const normalizedUser = skills.map((s) => s.toLowerCase());
  const normalizedTags = job.tags.map((t) => String(t).toLowerCase());
  const jobDesc = (job.desc || "").toLowerCase();

  let score = 60;
  let matched = 0;
  for (const skill of normalizedUser) {
    if (normalizedTags.some((t) => t.includes(skill) || skill.includes(t))) {
      matched += 1;
    } else if (jobDesc.includes(skill)) {
      matched += 0.5;
    }
  }

  const ratio = matched / Math.max(normalizedTags.length, 1);
  score += Math.round(ratio * 35);
  return Math.min(99, Math.max(55, score));
}

function jobMatchesQuery(job, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const hay = [job.title, job.co, job.company, job.desc, ...(job.tags || [])]
    .join(" ")
    .toLowerCase();
  if (hay.includes(q)) return true;
  return q.split(/\s+/).some((term) => term.length > 2 && hay.includes(term));
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

// Reads ACTIVE jobs from Firestore (`jobs/`), populated by the ATS sync
// worker, and applies in-memory filters for query text + location. No
// external job-board APIs are called — the DB is the only source of truth.
export async function searchAllJobs({
  query,
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

  let jobs = docs.map((doc) => mapFirestoreJob(doc.id, doc.data()));

  if (query) jobs = jobs.filter((j) => jobMatchesQuery(j, query));
  if (location) jobs = jobs.filter((j) => jobMatchesLocation(j, location));

  const merged = dedupeJobs(jobs);

  return {
    jobs: merged,
    sources: { firestore: merged.length },
    partialErrors,
  };
}
