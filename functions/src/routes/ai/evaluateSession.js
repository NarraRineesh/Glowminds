import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireCredits } from "../../middleware/requireCredits.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";
import { withCreditDebit } from "../../utils/creditResponse.js";

const MAX_ITEMS = 50;

const router = Router();

// Single batch AI call that runs at the END of a mock interview.
//
// For MCQ sessions we do NOT score per-question (the client computes
// `selectedIndex === correctIndex` itself). The AI's only job here is
// topic-level coaching: which categories the candidate fumbled, what to
// study next, and an overall verdict.
//
// Body shape:
//   {
//     role: "Software Engineer",
//     items: [{ question, type, difficulty, options, correctIndex, selectedIndex }]
//   }
router.post("/evaluate-session", requireAuth, requireCredits("interviewSession"), async (req, res, next) => {
  try {
    const { role = "Software Engineer", items = [] } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError("invalid-argument", "items[] is required");
    }
    if (items.length > MAX_ITEMS) {
      throw new ApiError(
        "invalid-argument",
        `Too many items (max ${MAX_ITEMS})`,
      );
    }

    const cleaned = items.map(normalizeItem);
    const correct = cleaned.filter((it) => it.isCorrect).length;
    const answered = cleaned.filter((it) => it.selectedIndex >= 0).length;
    const total = cleaned.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    const block = cleaned
      .map((it, idx) => {
        const userChoice =
          it.selectedIndex >= 0
            ? `${letter(it.selectedIndex)}) ${it.options[it.selectedIndex] || ""}`
            : "(skipped)";
        const correctChoice = `${letter(it.correctIndex)}) ${
          it.options[it.correctIndex] || ""
        }`;
        return `### Q${idx + 1} [${it.type} · ${it.difficulty}] — ${
          it.isCorrect ? "CORRECT" : it.selectedIndex < 0 ? "SKIPPED" : "INCORRECT"
        }
Question: ${it.question}
User picked: ${userChoice}
Correct answer: ${correctChoice}`;
      })
      .join("\n\n");

    const prompt = `You are an interview coach reviewing a candidate's MCQ mock interview for a "${role}" role.

The candidate scored ${correct}/${total} (${percent}%). They answered ${answered}/${total} questions.

Below is each question, the candidate's pick, and the correct answer:

${block}

Return ONLY valid JSON with this exact shape:
{
  "session": {
    "score": ${correct},
    "total": ${total},
    "percent": ${percent},
    "verdict": "Excellent" | "Strong" | "Good" | "Needs Work" | "Weak",
    "topStrengths": ["topic the candidate handled well 1", "..."],
    "topImprovements": ["topic to study 1", "..."],
    "studyTopics": [
      { "topic": "concept name", "reason": "why this came up as weak", "priority": "high" | "medium" | "low" }
    ],
    "summary": "3-4 sentences of overall coaching tailored to the role and the Indian tech market. Mention specific patterns you saw in their wrong answers."
  }
}

Rules:
- Group strengths/improvements by TOPIC (e.g. "JavaScript closures", "STAR storytelling", "system design trade-offs"), not by question number.
- "studyTopics" should be 2-5 concrete things to study, ordered by impact.
- Verdict rubric: 85%+ Excellent · 70-84% Strong · 55-69% Good · 35-54% Needs Work · <35% Weak.
- If everything is correct, still suggest one stretch topic in studyTopics.
- Return ONLY valid JSON, no markdown, no commentary.`;

    const { text } = await completionTask("evaluate-session", prompt, {
      uid: req.user?.uid,
    });
    const parsed = JSON.parse(stripJsonFences(text));
    const session = parsed?.session || null;

    // Per-question correctness flags are server-derived (deterministic),
    // so the client doesn't have to redo the math.
    const evaluations = cleaned.map((it, idx) => ({
      index: idx,
      isCorrect: it.isCorrect,
      selectedIndex: it.selectedIndex,
      correctIndex: it.correctIndex,
    }));

    res.json(await withCreditDebit(req, {
      evaluations,
      session: {
        score: correct,
        total,
        percent,
        ...(session || {}),
      },
    }));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

function normalizeItem(raw, idx) {
  const options = Array.isArray(raw?.options)
    ? raw.options.map((o) => String(o || "")).slice(0, 4)
    : [];
  const correctIndex = clampIdx(raw?.correctIndex);
  const rawSelected =
    raw?.selectedIndex === null || raw?.selectedIndex === undefined
      ? -1
      : Number(raw.selectedIndex);
  const selectedIndex =
    Number.isInteger(rawSelected) && rawSelected >= 0 && rawSelected <= 3
      ? rawSelected
      : -1;

  return {
    idx,
    question: String(raw?.question || "").trim(),
    type: String(raw?.type || "technical"),
    difficulty: String(raw?.difficulty || "medium"),
    options,
    correctIndex,
    selectedIndex,
    isCorrect: selectedIndex === correctIndex,
  };
}

function clampIdx(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 3) return 0;
  return n;
}

function letter(idx) {
  return ["A", "B", "C", "D"][idx] || "?";
}

export default router;
