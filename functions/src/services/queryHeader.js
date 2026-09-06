import { getFirestore } from "../config/firebase.js";
import { buildQueryHeader } from "./queryHeaderCore.js";

export { normalizeSkillName, cleanHeadlineQuery, buildQueryHeader } from "./queryHeaderCore.js";

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
  const prefs = profile.preferences || {};
  const preferredRole = String(prefs.preferredRole || "").trim()
    || (Array.isArray(prefs.preferredRoles)
      ? prefs.preferredRoles.map((r) => String(r || "").trim()).filter(Boolean).join(" ")
      : "");
  const headline = String(profile.headline || "").trim()
    || [profile.careerLevel, "software"].filter(Boolean).join(" ");
  return buildQueryHeader({
    headline,
    preferredRole,
    skills: profile.skills?.technical || [],
  });
}
