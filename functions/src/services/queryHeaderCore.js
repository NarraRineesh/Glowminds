const MAX_SKILLS = 8;

const ROLE_STOP = new Set([
  "the", "and", "for", "with", "from", "seeking", "looking", "aspiring",
  "passionate", "motivated", "experienced", "results", "driven",
  "at", "as", "in", "to", "of", "a", "an", "or",
]);

const ROLE_NOUNS = new Set([
  "developer", "engineer", "designer", "analyst", "scientist", "manager",
  "intern", "internship", "architect", "programmer", "consultant",
]);

const ROLE_QUALIFIERS = new Set([
  "software", "frontend", "front", "backend", "back", "fullstack", "full",
  "stack", "senior", "junior", "staff", "principal", "lead", "associate",
  "data", "product", "project", "program", "android", "ios", "mobile", "web",
  "cloud", "devops", "sre", "ml", "ai", "qa", "sdet", "sde", "ui", "ux",
]);

const KNOWN_ROLES = [
  "software development engineer",
  "machine learning engineer",
  "full stack developer",
  "fullstack developer",
  "full-stack developer",
  "front end developer",
  "front-end developer",
  "frontend developer",
  "back end developer",
  "back-end developer",
  "backend developer",
  "software engineer",
  "software developer",
  "data scientist",
  "data engineer",
  "data analyst",
  "product manager",
  "project manager",
  "devops engineer",
  "android developer",
  "ios developer",
  "mobile developer",
  "ui ux designer",
  "ux designer",
  "ui developer",
  "qa engineer",
  "sde intern",
  "sde",
  "fresher internship",
];

export function normalizeSkillName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function splitConcatenatedWords(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_/|·,;:]+/g, " ")
    .replace(/[—–]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripToken(word) {
  return String(word || "").replace(/[^a-zA-Z0-9+#]/g, "");
}

/**
 * Short catalog query from a headline / preferred-role blob.
 * "Sof developer Soft developerFrontend developer" → "frontend developer"
 */
export function cleanHeadlineQuery(raw) {
  const spaced = splitConcatenatedWords(raw);
  if (!spaced) return "";

  const hay = ` ${spaced.toLowerCase()} `;
  for (const phrase of KNOWN_ROLES) {
    if (hay.includes(` ${phrase} `) || hay.includes(` ${phrase.replace(/-/g, " ")} `)) {
      return phrase.replace(/-/g, " ");
    }
  }

  const tokens = spaced.split(/\s+/).map(stripToken).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const noun = tokens[i].toLowerCase();
    if (!ROLE_NOUNS.has(noun)) continue;
    const prev = tokens[i - 1] || "";
    const prevKey = prev.toLowerCase();
    if (prev && prev.length >= 2 && !ROLE_STOP.has(prevKey)) {
      if (prev.length <= 3 && !ROLE_QUALIFIERS.has(prevKey)) return noun;
      return `${prev} ${tokens[i]}`;
    }
    return tokens[i];
  }

  return tokens
    .filter((w) => w.length >= 2 && !ROLE_STOP.has(w.toLowerCase()))
    .slice(0, 4)
    .join(" ")
    .trim();
}

export function buildQueryHeader({ headline = "", skills = [], preferredRole = "" } = {}) {
  const title = String(headline || "").trim();
  const list = [...new Set(
    (Array.isArray(skills) ? skills : [])
      .map(normalizeSkillName)
      .filter(Boolean),
  )].slice(0, MAX_SKILLS);

  // Do not append skills into q — the catalog tokenizes the whole string and
  // a mashed "headline with skills …" query returns unrelated hits.
  const q = cleanHeadlineQuery(preferredRole)
    || cleanHeadlineQuery(title)
    || (list.length ? list.slice(0, 3).join(" ") : "");

  return { q, headline: title, skills: list };
}
