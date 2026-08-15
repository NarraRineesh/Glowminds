import { getFirestore } from "../config/firebase.js";

const MAX_SKILLS = 8;

export function normalizeSkillName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildQueryHeader({ headline = "", skills = [] } = {}) {
  const title = String(headline || "").trim();
  const list = [...new Set(
    (Array.isArray(skills) ? skills : [])
      .map(normalizeSkillName)
      .filter(Boolean),
  )].slice(0, MAX_SKILLS);

  let q = "";
  if (title && list.length) q = `${title} with skills ${list.join(" ")}`;
  else if (title) q = title;
  else if (list.length) q = list.join(" ");

  return { q, headline: title, skills: list };
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

export async function getQueryHeaderForUser(uid) {
  const { profile } = await loadProfileContext(uid);
  const headline = String(profile.headline || "").trim()
    || [profile.careerLevel, "software"].filter(Boolean).join(" ");
  return buildQueryHeader({
    headline,
    skills: profile.skills?.technical || [],
  });
}
