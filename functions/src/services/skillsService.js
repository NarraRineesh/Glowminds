// Skill search and trends from Supabase skill intelligence tables.

import { supabaseRest } from "./supabaseClient.js";

const DEFAULT_ENGINEERING_CATEGORIES = ["Programming Languages", "Frontend", "Backend"];

const HEADLINE_RULES = [
  { re: /\b(front.?end|react|angular|vue|ui developer|web developer)\b/i, categories: ["Frontend"] },
  { re: /\b(back.?end|api developer|server.?side|node\.?js)\b/i, categories: ["Backend"] },
  { re: /\b(full.?stack|sde|software engineer|software developer|fresher|internship)\b/i, categories: ["Programming Languages", "Frontend", "Backend"] },
  { re: /\b(data scientist|data analyst|data engineer|analytics)\b/i, categories: ["Data Science"] },
  { re: /\b(machine learning|deep learning|ml|ai engineer)\b/i, categories: ["AI/ML", "Data Science"] },
  { re: /\b(devops|sre|platform engineer|cloud engineer)\b/i, categories: ["DevOps", "Cloud"] },
  { re: /\b(android|ios|mobile developer|flutter|react native)\b/i, categories: ["Mobile"] },
  { re: /\b(qa engineer|quality assurance|test engineer|sdet)\b/i, categories: ["Testing"] },
  { re: /\b(ui\/ux|product designer|figma|graphic designer)\b/i, categories: ["Design"] },
  { re: /\b(product manager|product owner)\b/i, categories: ["Product Management"] },
  { re: /\b(marketing|digital marketing|seo|growth)\b/i, categories: ["Marketing"] },
  { re: /\b(sales|business development|bdm)\b/i, categories: ["Sales"] },
  { re: /\b(finance|accountant|financial analyst)\b/i, categories: ["Finance"] },
  { re: /\b(hr|recruiter|talent acquisition)\b/i, categories: ["HR"] },
  { re: /\b(cyber|security engineer|infosec)\b/i, categories: ["Cybersecurity"] },
  { re: /\b(database|dba|sql developer)\b/i, categories: ["Database"] },
];

function bump(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function buildInFilter(values) {
  const list = [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
  if (!list.length) return "";
  return encodeURIComponent(`(${list.map((v) => `"${v.replace(/"/g, "")}"`).join(",")})`);
}

function inferCategoryCountsFromText(...texts) {
  const counts = new Map();
  const combined = texts.filter(Boolean).join(" ");
  if (!combined.trim()) return counts;
  for (const rule of HEADLINE_RULES) {
    if (rule.re.test(combined)) {
      for (const cat of rule.categories) bump(counts, cat, 2);
    }
  }
  return counts;
}

async function lookupSkillCategoryCounts(skillNames) {
  const names = [...new Set(skillNames.map((s) => String(s).trim().toLowerCase()).filter(Boolean))].slice(0, 20);
  const counts = new Map();
  if (!names.length) return counts;

  const inFilter = buildInFilter(names);
  try {
    const rows = await supabaseRest(`skills?select=name,category&name=in.${inFilter}&limit=30`);
    for (const row of rows || []) {
      if (row.category) bump(counts, row.category, 3);
    }
  } catch (err) {
    console.warn("skill category lookup:", err.message);
  }

  if ([...counts.values()].reduce((a, b) => a + b, 0) < 2) {
    try {
      const aliasRows = await supabaseRest(`skill_aliases?select=alias,skills(category)&alias=in.${inFilter}&limit=30`);
      for (const row of aliasRows || []) {
        if (row.skills?.category) bump(counts, row.skills.category, 2);
      }
    } catch (err) {
      console.warn("skill alias category lookup:", err.message);
    }
  }

  return counts;
}

export async function resolveUserSkillCategories(profile = {}) {
  const texts = [
    profile.headline,
    profile.summary,
    ...(Array.isArray(profile.experience) ? profile.experience.map((e) => `${e.role || ""} ${e.title || ""}`) : []),
  ];
  const merged = inferCategoryCountsFromText(...texts);

  const technical = (profile.skills?.technical || []).map((s) => String(s).trim()).filter(Boolean);
  const fromSkills = await lookupSkillCategoryCounts(technical);
  for (const [cat, weight] of fromSkills) bump(merged, cat, weight);

  const ranked = [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  if (ranked.length) return ranked.slice(0, 3);

  const combined = texts.join(" ");
  if (technical.length || /\b(sde|software|engineer|developer|fresher|intern|b\.?tech|cs)\b/i.test(combined)) {
    return DEFAULT_ENGINEERING_CATEGORIES.slice(0, 2);
  }
  return [];
}

export function formatDomainLabel(categories = []) {
  if (!categories.length) return null;
  if (categories.length === 1) return categories[0];
  if (categories.length === 2) return `${categories[0]} & ${categories[1]}`;
  return `${categories[0]}, ${categories[1]} +`;
}

const DOMAIN_SKILL_SEEDS = Object.freeze({
  "Programming Languages": ["python", "javascript", "java", "typescript", "go", "cpp", "csharp", "rust", "kotlin"],
  Frontend: ["react", "typescript", "javascript", "vue", "angular", "next.js", "html", "css", "tailwind", "redux"],
  Backend: ["nodejs", "python", "java", "spring boot", "go", "express", "fastapi", "django", "postgresql", "graphql"],
  "Data Science": ["python", "sql", "pandas", "numpy", "spark", "tableau", "statistics", "etl", "power bi"],
  "AI/ML": ["python", "machine learning", "tensorflow", "pytorch", "nlp", "deep learning", "llm", "scikit-learn"],
  DevOps: ["docker", "kubernetes", "terraform", "jenkins", "ci/cd", "linux", "ansible", "github actions"],
  Cloud: ["aws", "azure", "gcp", "kubernetes", "docker", "lambda", "cloudformation"],
  Mobile: ["react native", "flutter", "android", "ios", "kotlin", "swift"],
  Testing: ["selenium", "jest", "cypress", "playwright", "postman", "automation testing"],
  Design: ["figma", "ui", "ux", "sketch", "prototyping", "adobe xd"],
  Database: ["postgresql", "mysql", "mongodb", "redis", "sql", "oracle"],
  Cybersecurity: ["security", "siem", "penetration testing", "soc", "firewall"],
  "Product Management": ["product management", "agile", "scrum", "jira", "roadmap"],
  Marketing: ["seo", "google analytics", "content marketing", "social media", "sem"],
  Sales: ["crm", "salesforce", "b2b sales", "lead generation"],
  Finance: ["excel", "financial modeling", "accounting", "sap", "tally"],
  HR: ["recruitment", "hrms", "payroll", "talent acquisition"],
});

const NOISE_SKILL_RE = /driver'?s license|drug test|background check|bachelor|master'?s degree|work authorization/i;

function normalizeSkillToken(value) {
  return String(value || "").trim().toLowerCase();
}

function isNoiseSkill(name) {
  const n = normalizeSkillToken(name);
  if (!n || n.length < 2 || n.length > 48) return true;
  return NOISE_SKILL_RE.test(n);
}

function buildDomainSeeds(profile, categories) {
  const seeds = new Set();
  for (const skill of profile?.skills?.technical || []) {
    const n = normalizeSkillToken(skill);
    if (n) seeds.add(n);
  }
  for (const cat of categories) {
    for (const seed of DOMAIN_SKILL_SEEDS[cat] || []) seeds.add(seed);
  }
  return [...seeds].slice(0, 24);
}

function mapTrendRow(row) {
  return {
    name: formatSkillLabel(row.name),
    category: row.category || "Other",
    jobCount: row.job_count || 0,
    growth: formatGrowth(row.trend_score),
    importanceScore: row.importance_score || 50,
  };
}

async function getCooccurringSkillTrends(seedSkills, { exclude = new Set(), limit = 8 } = {}) {
  const freq = new Map();
  const seeds = seedSkills.map(normalizeSkillToken).filter(Boolean).slice(0, 4);
  if (!seeds.length) return [];

  await Promise.all(seeds.map(async (skill) => {
    try {
      const rows = await supabaseRest(
        `jobs?select=skills&enriched_at=not.is.null&skills=cs.${encodeURIComponent(JSON.stringify([skill]))}&limit=60`,
      );
      for (const row of rows || []) {
        for (const raw of row.skills || []) {
          const name = normalizeSkillToken(raw);
          if (!name || exclude.has(name) || seeds.includes(name) || isNoiseSkill(name)) continue;
          freq.set(name, (freq.get(name) || 0) + 1);
        }
      }
    } catch (err) {
      console.warn("skill cooccurrence:", skill, err.message);
    }
  }));

  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit * 2);
  if (!ranked.length) return [];

  const inFilter = buildInFilter(ranked.map(([name]) => name));
  const metaByName = new Map();
  try {
    const rows = await supabaseRest(
      `skills?select=name,category,job_count,trend_score&name=in.${inFilter}&order=job_count.desc&limit=${limit * 2}`,
    );
    for (const row of rows || []) metaByName.set(row.name, row);
  } catch {
    // use co-occurrence counts only
  }

  return ranked
    .map(([name, coCount]) => {
      const meta = metaByName.get(name);
      return {
        name: formatSkillLabel(name),
        category: meta?.category || "Other",
        jobCount: meta?.job_count || coCount,
        growth: formatGrowth(meta?.trend_score),
        score: coCount * 10 + (meta?.job_count || 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...rest }) => rest);
}

async function getDemandSkillTrendsBySeeds(seedSkills, { exclude = new Set(), limit = 8 } = {}) {
  const names = seedSkills
    .map(normalizeSkillToken)
    .filter((n) => n && !exclude.has(n) && !isNoiseSkill(n))
    .slice(0, 20);
  if (!names.length) return [];

  const inFilter = buildInFilter(names);
  try {
    const rows = await supabaseRest(
      `skills?select=name,category,job_count,trend_score&name=in.${inFilter}&order=job_count.desc&limit=${limit * 2}`,
    );
    return (rows || [])
      .filter((row) => (row.job_count || 0) > 0 && !exclude.has(row.name))
      .map(mapTrendRow)
      .slice(0, limit);
  } catch (err) {
    console.warn("skill trends by seed:", err.message);
    return [];
  }
}

async function getDomainSkillTrends(seedSkills, { exclude, limit }) {
  const cooccurring = await getCooccurringSkillTrends(seedSkills, { exclude, limit });
  if (cooccurring.length >= limit) return cooccurring;

  const bySeed = await getDemandSkillTrendsBySeeds(seedSkills, { exclude, limit: limit * 2 });
  const seen = new Set(cooccurring.map((t) => normalizeSkillToken(t.name)));
  const merged = [...cooccurring];
  for (const row of bySeed) {
    const key = normalizeSkillToken(row.name);
    if (seen.has(key) || exclude.has(key)) continue;
    seen.add(key);
    merged.push(row);
    if (merged.length >= limit) break;
  }
  return merged;
}

export async function getPersonalizedSkillTrends({ profile, limit = 8, mode = "demand" } = {}) {
  const safeLimit = Math.min(Math.max(1, limit), 20);
  const categories = await resolveUserSkillCategories(profile || {});
  const seedSkills = buildDomainSeeds(profile, categories);
  const userSkillSet = new Set(
    [...(profile?.skills?.technical || []), ...(profile?.skills?.soft || [])]
      .map(normalizeSkillToken)
      .filter(Boolean),
  );

  let trends = [];
  if (seedSkills.length) {
    trends = await getDomainSkillTrends(seedSkills, { exclude: userSkillSet, limit: safeLimit });
  } else if (categories.length) {
    trends = await getDomainSkillTrends(buildDomainSeeds({}, categories), { exclude: userSkillSet, limit: safeLimit });
  }

  if (trends.length < safeLimit) {
    const global = mode === "growth"
      ? await getTopGrowingSkills(safeLimit * 2)
      : await getSkillTrends(safeLimit * 2);
    const seen = new Set(trends.map((t) => normalizeSkillToken(t.name)));
    for (const row of global) {
      if (trends.length >= safeLimit) break;
      const key = normalizeSkillToken(row.name);
      if (userSkillSet.has(key) || seen.has(key) || isNoiseSkill(key)) continue;
      seen.add(key);
      trends.push(row);
    }
  }

  return {
    trends: trends.slice(0, safeLimit),
    domain: {
      categories,
      label: formatDomainLabel(categories),
    },
  };
}

export async function searchSkills(query, limit = 10) {
  const q = String(query || "").trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const safeLimit = Math.min(Math.max(1, limit), 25);
  const seen = new Map();

  try {
    const byName = await supabaseRest(
      `skills?select=id,name,category,subcategory,job_count,importance_score&name=ilike.${encodeURIComponent(`*${q}*`)}&order=job_count.desc&limit=${safeLimit}`,
    );
    for (const row of byName || []) {
      seen.set(row.name, {
        id: row.id,
        name: row.name,
        category: row.category || "Other",
        subcategory: row.subcategory || "",
        jobCount: row.job_count || 0,
        importanceScore: row.importance_score || 50,
        source: "canonical",
      });
    }
  } catch (err) {
    console.warn("skills search by name:", err.message);
  }

  if (seen.size < safeLimit) {
    try {
      const aliasRows = await supabaseRest(
        `skill_aliases?select=alias,skill_id,skills(id,name,category,subcategory,job_count,importance_score)&alias=ilike.${encodeURIComponent(`*${q}*`)}&limit=${safeLimit}`,
      );
      for (const row of aliasRows || []) {
        const skill = row.skills;
        if (!skill?.name || seen.has(skill.name)) continue;
        seen.set(skill.name, {
          id: skill.id,
          name: skill.name,
          category: skill.category || "Other",
          subcategory: skill.subcategory || "",
          jobCount: skill.job_count || 0,
          importanceScore: skill.importance_score || 50,
          source: "alias",
          matchedAlias: row.alias,
        });
      }
    } catch (err) {
      console.warn("skills search by alias:", err.message);
    }
  }

  return [...seen.values()]
    .sort((a, b) => (b.jobCount - a.jobCount) || a.name.localeCompare(b.name))
    .slice(0, safeLimit);
}

export async function getSkillTrends(limit = 8) {
  const safeLimit = Math.min(Math.max(1, limit), 20);

  try {
    const rows = await supabaseRest(
      `skills?select=name,category,job_count,trend_score,importance_score&order=job_count.desc&limit=${safeLimit * 4}`,
    );
    return (rows || [])
      .filter((row) => !isNoiseSkill(row.name) && (row.job_count || 0) >= 3)
      .map(mapTrendRow)
      .slice(0, safeLimit);
  } catch (err) {
    console.warn("skill trends:", err.message);
    return [];
  }
}

export async function getTopGrowingSkills(limit = 6) {
  const safeLimit = Math.min(Math.max(1, limit), 20);
  const month = new Date().toISOString().slice(0, 7) + "-01";

  try {
    const rows = await supabaseRest(
      `skill_trends?select=job_count,growth_percentage,skills(name,category)&month=eq.${month}&order=growth_percentage.desc&limit=${safeLimit}`,
    );
    if (rows?.length) {
      return rows.map((row) => ({
        name: formatSkillLabel(row.skills?.name || ""),
        category: row.skills?.category || "Other",
        jobCount: row.job_count || 0,
        growth: formatGrowth(row.growth_percentage),
      })).filter((r) => r.name);
    }
  } catch {
    // fall through to job_count sort
  }

  const fallback = await getSkillTrends(safeLimit);
  return fallback.map((r) => ({ ...r, growth: r.growth || "+—" }));
}

function formatSkillLabel(name) {
  if (!name) return "";
  return String(name)
    .split(/[\s./-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatGrowth(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "+—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Math.round(n)}%`;
}
