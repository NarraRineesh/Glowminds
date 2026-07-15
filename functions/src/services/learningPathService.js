// AI Learning Path — generate, persist, and track progress in Firestore.

import { admin } from "../config/firebase.js";
import { ApiError } from "../middleware/errors.js";
import { completionTask } from "./aiClient.js";
import { stripJsonFences } from "../utils/stripJsonFences.js";
import {
  learningPathRef,
  learningPathsCol,
  learningPathVersionRef,
} from "./userCollections.js";

const MAX_FOCUS_SKILLS = 6;
const LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const MAX_HISTORY = 50;
const PATH_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

function assertPathId(pathId) {
  const id = String(pathId || "").trim();
  if (!PATH_ID_RE.test(id)) {
    throw new ApiError("invalid-argument", "A valid learning path ID is required");
  }
  return id;
}

function isoDate(value) {
  return value?.toDate?.()?.toISOString?.() || value || null;
}

function calculateProgress(weeks = []) {
  const items = weeks.flatMap((week) => week.items || []);
  const total = items.length;
  const completed = items.filter((item) => item.done).length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

function serializePath(data = {}) {
  return {
    ...data,
    pathId: data.pathId || data.id || null,
    progress: data.progress || calculateProgress(data.weeks || []),
    createdAt: isoDate(data.createdAt),
    updatedAt: isoDate(data.updatedAt),
    activatedAt: isoDate(data.activatedAt),
    archivedAt: isoDate(data.archivedAt),
  };
}

function pathSummary(data = {}) {
  const path = serializePath(data);
  return {
    pathId: path.pathId,
    targetRole: path.targetRole || "",
    focusSkills: path.focusSkills || [],
    hoursPerWeek: path.hoursPerWeek || 8,
    level: path.level || "beginner",
    status: path.status || "archived",
    progress: path.progress,
    createdAt: path.createdAt,
    updatedAt: path.updatedAt,
    activatedAt: path.activatedAt,
  };
}

// Migrated users hit only the cheap read; the transaction runs once per
// legacy (pre-history) document and never again.
const migratedUids = new Set();

async function migrateLegacyActivePath(uid) {
  const activeRef = learningPathRef(uid);

  if (migratedUids.has(uid)) {
    const snap = await activeRef.get();
    return snap.exists ? snap.data() || {} : null;
  }

  const snap = await activeRef.get();
  if (!snap.exists) return null;
  const current = snap.data() || {};
  if (current.pathId) {
    migratedUids.add(uid);
    return current;
  }

  const migrated = await activeRef.firestore.runTransaction(async (transaction) => {
    const txSnap = await transaction.get(activeRef);
    if (!txSnap.exists) return null;
    const data = txSnap.data() || {};
    if (data.pathId) return data;

    const versionRef = learningPathsCol(uid).doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const next = {
      ...data,
      userId: uid,
      pathId: versionRef.id,
      status: "active",
      schemaVersion: 2,
      progress: calculateProgress(data.weeks || []),
      updatedAt: now,
      activatedAt: now,
    };
    transaction.set(versionRef, next, { merge: false });
    transaction.set(activeRef, next, { merge: false });
    const nowIso = new Date().toISOString();
    return { ...next, updatedAt: nowIso, activatedAt: nowIso };
  });
  migratedUids.add(uid);
  return migrated;
}

function clampHours(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 8;
  return Math.min(40, Math.max(2, Math.trunc(n)));
}

function normalizeFocusSkills(skills) {
  const out = [];
  const seen = new Set();
  for (const raw of skills || []) {
    const name = String(raw || "").trim();
    if (!name || name.length > 48) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= MAX_FOCUS_SKILLS) break;
  }
  return out;
}

function youtubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function docsSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} official documentation`)}`;
}

function enrichResources(item) {
  const queries = Array.isArray(item.resourceQueries) && item.resourceQueries.length
    ? item.resourceQueries.map((q) => String(q).trim()).filter(Boolean).slice(0, 3)
    : [`${item.skill || ""} tutorial`, `${item.skill || ""} documentation`].filter(Boolean);

  return {
    ...item,
    resourceQueries: queries,
    resources: queries.flatMap((q) => [
      { label: `YouTube: ${q}`, url: youtubeSearchUrl(q), kind: "youtube" },
      { label: `Docs: ${q}`, url: docsSearchUrl(q), kind: "docs" },
    ]).slice(0, 4),
  };
}

function normalizePlan(raw, { targetRole, focusSkills, hoursPerWeek, level }) {
  const weeks = Array.isArray(raw?.weeks) ? raw.weeks : [];
  const normalizedWeeks = weeks.slice(0, 8).map((week, wi) => {
    const items = (Array.isArray(week?.items) ? week.items : []).slice(0, 6).map((item, ii) => {
      const base = {
        id: String(item?.id || `w${wi + 1}-i${ii + 1}`),
        skill: String(item?.skill || focusSkills[ii] || focusSkills[0] || "Skill").trim(),
        topics: Array.isArray(item?.topics)
          ? item.topics.map((t) => String(t).trim()).filter(Boolean).slice(0, 5)
          : [],
        miniProject: String(item?.miniProject || "").trim(),
        resourceQueries: Array.isArray(item?.resourceQueries) ? item.resourceQueries : [],
        done: false,
      };
      return enrichResources(base);
    });
    return {
      week: Number(week?.week) || wi + 1,
      title: String(week?.title || `Week ${wi + 1}`).trim(),
      focus: String(week?.focus || "").trim(),
      items,
    };
  });

  return {
    targetRole,
    focusSkills,
    hoursPerWeek,
    level,
    summary: String(raw?.summary || "").trim(),
    weeks: normalizedWeeks,
  };
}

export async function generateLearningPath(uid, {
  targetRole = "",
  focusSkills = [],
  hoursPerWeek = 8,
  level = "beginner",
  profile = {},
} = {}) {
  const role = String(targetRole || profile.headline || "Software Engineer").trim();
  const skills = normalizeFocusSkills(focusSkills);
  if (!skills.length) {
    throw new ApiError("invalid-argument", "Select at least one skill to focus on");
  }
  const hours = clampHours(hoursPerWeek);
  const safeLevel = LEVELS.has(String(level).toLowerCase())
    ? String(level).toLowerCase()
    : "beginner";

  const owned = [
    ...(profile.skills?.technical || []),
    ...(profile.skills?.soft || []),
  ].map((s) => String(s).trim()).filter(Boolean).slice(0, 20);

  const prompt = `You are an expert career coach building a practical upskilling plan for the Indian tech job market.

Target role: ${role}
Current level: ${safeLevel}
Hours available per week: ${hours}
Skills to close (focus): ${JSON.stringify(skills)}
Skills the candidate already has: ${JSON.stringify(owned)}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence plan overview",
  "weeks": [
    {
      "week": 1,
      "title": "short week title",
      "focus": "what this week emphasizes",
      "items": [
        {
          "id": "w1-i1",
          "skill": "exact skill name from the focus list",
          "topics": ["topic 1", "topic 2"],
          "miniProject": "one small hands-on project",
          "resourceQueries": ["search query for youtube", "search query for docs"]
        }
      ]
    }
  ]
}

Rules:
- Create ${Math.min(8, Math.max(4, Math.ceil(skills.length * 1.2)))} weeks of plan
- Each week 1-3 items, cover all focus skills across the plan
- resourceQueries are SEARCH QUERIES only (never invent specific URLs or course names that may not exist)
- Mini-projects must be finishable in the weekly hours
- Be concrete and India/tech-career practical
- Return ONLY valid JSON`;

  const { text } = await completionTask("learning-path", prompt, { uid });
  let parsed;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch {
    throw new ApiError("internal", "AI returned an invalid learning path. Please try again.");
  }

  const plan = normalizePlan(parsed, {
    targetRole: role,
    focusSkills: skills,
    hoursPerWeek: hours,
    level: safeLevel,
  });

  if (!plan.weeks.length) {
    throw new ApiError("internal", "AI returned an empty learning path. Please try again.");
  }

  const nowIso = new Date().toISOString();
  const versionRef = learningPathsCol(uid).doc();
  const doc = {
    userId: uid,
    pathId: versionRef.id,
    status: "active",
    schemaVersion: 2,
    ...plan,
    progress: calculateProgress(plan.weeks),
    createdAt: nowIso,
    updatedAt: nowIso,
    activatedAt: nowIso,
  };

  const activeRef = learningPathRef(uid);
  await activeRef.firestore.runTransaction(async (transaction) => {
    const currentSnap = await transaction.get(activeRef);
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (currentSnap.exists) {
      const current = currentSnap.data() || {};
      const oldRef = current.pathId
        ? learningPathVersionRef(uid, current.pathId)
        : learningPathsCol(uid).doc();
      transaction.set(oldRef, {
        ...current,
        userId: uid,
        pathId: oldRef.id,
        status: "archived",
        schemaVersion: 2,
        progress: calculateProgress(current.weeks || []),
        archivedAt: timestamp,
      }, { merge: false });
    }

    const stored = {
      ...doc,
      createdAt: timestamp,
      updatedAt: timestamp,
      activatedAt: timestamp,
    };
    transaction.set(versionRef, stored, { merge: false });
    transaction.set(activeRef, stored, { merge: false });
  });

  return doc;
}

export async function getLearningPath(uid) {
  const data = await migrateLegacyActivePath(uid);
  if (!data) return null;
  return serializePath(data);
}

export async function updateLearningPathProgress(uid, { itemId, done } = {}) {
  const id = String(itemId || "").trim();
  if (!id) throw new ApiError("invalid-argument", "itemId is required");
  if (typeof done !== "boolean") {
    throw new ApiError("invalid-argument", "done must be a boolean");
  }

  const ref = learningPathRef(uid);
  return ref.firestore.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) {
      throw new ApiError("not-found", "No learning path found. Generate one first.");
    }

    const data = snap.data() || {};
    const weeks = Array.isArray(data.weeks) ? data.weeks : [];
    let found = false;
    const nextWeeks = weeks.map((week) => ({
      ...week,
      items: (week.items || []).map((item) => {
        if (item.id !== id) return item;
        found = true;
        return { ...item, done };
      }),
    }));
    if (!found) throw new ApiError("not-found", "Learning path item not found");

    const progress = calculateProgress(nextWeeks);
    const update = {
      weeks: nextWeeks,
      progress,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    transaction.set(ref, update, { merge: true });
    if (data.pathId) {
      transaction.set(learningPathVersionRef(uid, data.pathId), update, { merge: true });
    }
    return { weeks: nextWeeks, progress };
  });
}

export async function listLearningPathHistory(uid, { limit = 20 } = {}) {
  await migrateLegacyActivePath(uid);
  const safeLimit = Math.min(MAX_HISTORY, Math.max(1, Number(limit) || 20));
  const snap = await learningPathsCol(uid)
    .orderBy("createdAt", "desc")
    .limit(safeLimit)
    .get();
  return snap.docs.map((doc) => pathSummary({ pathId: doc.id, ...doc.data() }));
}

export async function getLearningPathById(uid, pathId) {
  const id = assertPathId(pathId);
  await migrateLegacyActivePath(uid);
  const snap = await learningPathVersionRef(uid, id).get();
  if (!snap.exists) throw new ApiError("not-found", "Learning path not found");
  return serializePath({ pathId: snap.id, ...snap.data() });
}

export async function activateLearningPath(uid, pathId) {
  const id = assertPathId(pathId);
  await migrateLegacyActivePath(uid);
  const activeRef = learningPathRef(uid);
  const selectedRef = learningPathVersionRef(uid, id);

  return activeRef.firestore.runTransaction(async (transaction) => {
    const [activeSnap, selectedSnap] = await Promise.all([
      transaction.get(activeRef),
      transaction.get(selectedRef),
    ]);
    if (!selectedSnap.exists) throw new ApiError("not-found", "Learning path not found");

    const selected = selectedSnap.data() || {};
    const selectedWithoutArchive = { ...selected };
    delete selectedWithoutArchive.archivedAt;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const current = activeSnap.exists ? activeSnap.data() || {} : null;
    if (current?.pathId && current.pathId !== id) {
      transaction.set(learningPathVersionRef(uid, current.pathId), {
        status: "archived",
        archivedAt: timestamp,
      }, { merge: true });
    }

    const activated = {
      ...selectedWithoutArchive,
      userId: uid,
      pathId: id,
      status: "active",
      schemaVersion: 2,
      updatedAt: timestamp,
      activatedAt: timestamp,
    };
    transaction.set(selectedRef, {
      ...activated,
      archivedAt: admin.firestore.FieldValue.delete(),
    }, { merge: true });
    transaction.set(activeRef, activated, { merge: false });

    return serializePath({
      ...selected,
      pathId: id,
      status: "active",
      updatedAt: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
      archivedAt: null,
    });
  });
}

export async function deleteLearningPath(uid, pathId) {
  const id = assertPathId(pathId);
  await migrateLegacyActivePath(uid);
  const activeRef = learningPathRef(uid);
  const selectedRef = learningPathVersionRef(uid, id);

  await activeRef.firestore.runTransaction(async (transaction) => {
    const [activeSnap, selectedSnap] = await Promise.all([
      transaction.get(activeRef),
      transaction.get(selectedRef),
    ]);
    if (!selectedSnap.exists) throw new ApiError("not-found", "Learning path not found");
    if (activeSnap.exists && activeSnap.data()?.pathId === id) {
      transaction.delete(activeRef);
    }
    transaction.delete(selectedRef);
  });
  return { ok: true, id };
}
