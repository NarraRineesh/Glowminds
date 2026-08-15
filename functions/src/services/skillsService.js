import { getTrendingSkills } from "./jobsCatalog.js";

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
];

const DOMAIN_SKILL_SEEDS = Object.freeze({
  "Programming Languages": ["python", "javascript", "java", "typescript", "go"],
  Frontend: ["react", "typescript", "javascript", "vue", "angular", "next.js"],
  Backend: ["nodejs", "python", "java", "spring boot", "go", "express"],
  "Data Science": ["python", "sql", "pandas", "spark", "tableau"],
  "AI/ML": ["python", "machine learning", "tensorflow", "pytorch", "nlp"],
  DevOps: ["docker", "kubernetes", "terraform", "ci/cd", "linux"],
  Cloud: ["aws", "azure", "gcp", "kubernetes", "docker"],
  Mobile: ["react native", "flutter", "android", "ios", "kotlin"],
  Testing: ["selenium", "jest", "cypress", "playwright"],
  Design: ["figma", "ui", "ux", "prototyping"],
  "Product Management": ["product management", "agile", "scrum", "jira"],
});

function bump(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function normalizeSkillToken(value) {
  return String(value || "").trim().toLowerCase();
}

function formatSkillLabel(name) {
  return String(name || "")
    .split(/[\s/_-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function userHasSkill(userSkillSet, name) {
  const n = normalizeSkillToken(name);
  if (userSkillSet.has(n)) return true;
  for (const s of userSkillSet) {
    if (n.includes(s) || s.includes(n)) return true;
  }
  return false;
}

export function formatDomainLabel(categories = []) {
  if (!categories.length) return null;
  if (categories.length === 1) return categories[0];
  if (categories.length === 2) return `${categories[0]} & ${categories[1]}`;
  return `${categories[0]}, ${categories[1]} +`;
}

export function resolveCategoriesFromRole(role = "") {
  const counts = new Map();
  for (const rule of HEADLINE_RULES) {
    if (rule.re.test(role)) {
      for (const cat of rule.categories) bump(counts, cat, 2);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  return ranked.length ? ranked.slice(0, 3) : DEFAULT_ENGINEERING_CATEGORIES.slice(0, 2);
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

export async function getSkillGap({ profile = {}, targetRole = "" } = {}) {
  const role = String(targetRole || profile.headline || "").trim() || "Software Engineer";
  const categories = resolveCategoriesFromRole(role);
  const userSkills = [
    ...(profile.skills?.technical || []),
    ...(profile.skills?.soft || []),
  ]
    .map(normalizeSkillToken)
    .filter(Boolean);
  const userSkillSet = new Set(userSkills);
  const seedNames = new Set(buildDomainSeeds({}, categories));

  let trending = [];
  try {
    trending = await getTrendingSkills({ limit: 40 });
  } catch {
    trending = [];
  }

  const byName = new Map();
  for (const row of trending) {
    const name = normalizeSkillToken(row.skill_name || row.name);
    if (!name) continue;
    byName.set(name, {
      name,
      category: categories[0] || "Catalog",
      job_count: row.active_job_count || 0,
      importance_score: 50,
    });
  }
  for (const seed of seedNames) {
    if (!byName.has(seed)) {
      byName.set(seed, {
        name: seed,
        category: categories[0] || "Other",
        job_count: 0,
        importance_score: 50,
      });
    }
  }

  const ranked = [...byName.values()]
    .sort((a, b) => (b.job_count || 0) - (a.job_count || 0))
    .slice(0, 30);

  const haveSkills = [];
  const missingSkills = [];
  for (const row of ranked) {
    const entry = {
      name: formatSkillLabel(row.name),
      category: row.category || "Other",
      jobCount: row.job_count || 0,
      growth: "",
      importanceScore: row.importance_score || 50,
    };
    if (userHasSkill(userSkillSet, row.name)) haveSkills.push(entry);
    else missingSkills.push(entry);
  }

  const coverage =
    ranked.length === 0 ? 0 : Math.round((haveSkills.length / ranked.length) * 100);

  return {
    targetRole: role,
    domain: {
      categories,
      label: formatDomainLabel(categories),
    },
    coverage,
    haveSkills,
    missingSkills: missingSkills.slice(0, 24),
    profileSkillCount: userSkills.length,
  };
}
