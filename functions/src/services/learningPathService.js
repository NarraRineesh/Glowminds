// AI Learning Path — generate, persist, and track progress in Firestore.

import { admin } from "../config/firebase.js";
import { ApiError } from "../middleware/errors.js";
import { completionTask } from "./aiClient.js";
import { stripJsonFences } from "../utils/stripJsonFences.js";
import { learningPathRef } from "./userCollections.js";

const MAX_FOCUS_SKILLS = 6;
const LEVELS = new Set(["beginner", "intermediate", "advanced"]);

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

  const now = new Date().toISOString();
  const doc = {
    userId: uid,
    ...plan,
    createdAt: now,
    updatedAt: now,
  };

  await learningPathRef(uid).set(
    {
      ...doc,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: false },
  );

  return doc;
}

export async function getLearningPath(uid) {
  const snap = await learningPathRef(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
  };
}

export async function updateLearningPathProgress(uid, { itemId, done } = {}) {
  const id = String(itemId || "").trim();
  if (!id) throw new ApiError("invalid-argument", "itemId is required");

  const ref = learningPathRef(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError("not-found", "No learning path found. Generate one first.");

  const data = snap.data() || {};
  const weeks = Array.isArray(data.weeks) ? data.weeks : [];
  let found = false;
  const nextWeeks = weeks.map((week) => ({
    ...week,
    items: (week.items || []).map((item) => {
      if (item.id !== id) return item;
      found = true;
      return { ...item, done: Boolean(done) };
    }),
  }));

  if (!found) throw new ApiError("not-found", "Learning path item not found");

  await ref.set(
    {
      weeks: nextWeeks,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const total = nextWeeks.reduce((n, w) => n + (w.items || []).length, 0);
  const completed = nextWeeks.reduce(
    (n, w) => n + (w.items || []).filter((i) => i.done).length,
    0,
  );

  return {
    weeks: nextWeeks,
    progress: {
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0,
    },
  };
}
