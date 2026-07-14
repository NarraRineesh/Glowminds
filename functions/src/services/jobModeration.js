import { getFirestore } from "../config/firebase.js";

const DOC = "config/jobModeration";
const CACHE_TTL_MS = 60_000;

const moderationCache = { value: null, at: 0, inflight: null };

function emptyModeration() {
  return { hiddenIds: [], boostedIds: [], updatedAt: null };
}

export async function getJobModeration() {
  if (moderationCache.value && Date.now() - moderationCache.at < CACHE_TTL_MS) {
    return moderationCache.value;
  }
  if (moderationCache.inflight) return moderationCache.inflight;

  moderationCache.inflight = (async () => {
    try {
      const snap = await getFirestore().doc(DOC).get();
      const data = snap.exists ? snap.data() : {};
      const value = {
        hiddenIds: Array.isArray(data.hiddenIds) ? data.hiddenIds.map(String) : [],
        boostedIds: Array.isArray(data.boostedIds) ? data.boostedIds.map(String) : [],
        updatedAt: data.updatedAt || null,
      };
      moderationCache.value = value;
      moderationCache.at = Date.now();
      return value;
    } catch {
      return moderationCache.value || emptyModeration();
    } finally {
      moderationCache.inflight = null;
    }
  })();

  return moderationCache.inflight;
}

export async function updateJobModeration({ hideId, unhideId, boostId, unboostId } = {}) {
  const current = await getJobModeration();
  let hiddenIds = new Set(current.hiddenIds);
  let boostedIds = new Set(current.boostedIds);

  if (hideId) hiddenIds.add(String(hideId));
  if (unhideId) hiddenIds.delete(String(unhideId));
  if (boostId) boostedIds.add(String(boostId));
  if (unboostId) boostedIds.delete(String(unboostId));

  const payload = {
    hiddenIds: [...hiddenIds].slice(0, 2000),
    boostedIds: [...boostedIds].slice(0, 500),
    updatedAt: new Date().toISOString(),
  };
  await getFirestore().doc(DOC).set(payload, { merge: true });
  moderationCache.value = payload;
  moderationCache.at = Date.now();
  return payload;
}

export function applyJobModeration(jobs, moderation) {
  if (!Array.isArray(jobs) || !jobs.length) return jobs || [];
  const hidden = new Set(moderation?.hiddenIds || []);
  const boosted = new Set(moderation?.boostedIds || []);
  const visible = jobs.filter((j) => j?.id && !hidden.has(String(j.id)));
  if (!boosted.size) return visible;
  return [...visible].sort((a, b) => {
    const ab = boosted.has(String(a.id)) ? 1 : 0;
    const bb = boosted.has(String(b.id)) ? 1 : 0;
    return bb - ab;
  });
}
