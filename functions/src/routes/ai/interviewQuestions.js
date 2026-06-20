import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireCredits } from "../../middleware/requireCredits.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { trackAsync } from "../../services/usageTracker.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";

const router = Router();

const TYPE_DESC = {
  mixed: "a mix of technical, behavioral, and HR/situational",
  technical: "technical (concepts, code reading, system design fundamentals)",
  behavioral: "behavioral / STAR-method (past experience, teamwork, conflict)",
  hr: "HR / cultural fit (motivation, career goals, soft skills)",
};

// Returns a batch of multiple-choice questions (MCQs). Each question has
// exactly 4 options, one correct answer, and a short explanation. We send
// `correctIndex` to the client up front (this is a self-practice tool, not
// a proctored test) — the UI hides correctness until the user submits the
// session.
router.post("/interview-questions", requireAuth, requireCredits("interviewSession"), async (req, res, next) => {
  try {
    const {
      role = "Software Engineer",
      type = "mixed",
      count = 10,
    } = req.body || {};
    const safeCount = Math.min(Math.max(parseInt(count, 10) || 10, 1), 50);
    const typeDesc = TYPE_DESC[type] || TYPE_DESC.mixed;

    const prompt = `Generate exactly ${safeCount} multiple-choice interview questions (MCQs) for a "${role}" position.
Question style: ${typeDesc}.

Return ONLY a valid JSON array. Each item MUST match this shape exactly:
[
  {
    "id": 1,
    "question": "the interview question (one sentence)",
    "type": "technical" | "behavioral" | "hr",
    "difficulty": "easy" | "medium" | "hard",
    "options": [
      "Option A text",
      "Option B text",
      "Option C text",
      "Option D text"
    ],
    "correctIndex": 0,
    "explanation": "1-2 sentences explaining why the correct option is right and why the most tempting wrong option is wrong",
    "tips": "1-sentence framing hint (how to think about the question)",
    "hints": ["short hint 1 (5-10 words)", "short hint 2", "short hint 3"]
  }
]

Rules:
- EXACTLY 4 options per question, plausible distractors (no obvious throwaways).
- "correctIndex" is the 0-based index of the right option (0..3). Vary it across questions — don't always pick the same index.
- Questions must be realistic for the Indian tech job market.
- For technical: mix concepts, code reading, complexity, and design trade-offs.
- For behavioral: describe a short scenario and ask which response is best.
- For HR: career motivation, salary, culture-fit style multiple choice.
- Vary difficulty across easy / medium / hard.
- "tips" + "hints" should guide thinking WITHOUT revealing the answer.
- Return ONLY valid JSON, no markdown, no commentary.`;

    const { text } = await completionTask("interview-questions", prompt, {
      uid: req.user?.uid,
      // We track per-MCQ below instead of one tick per API call.
      skipAutoTrack: true,
    });
    const parsed = JSON.parse(stripJsonFences(text));
    const raw = Array.isArray(parsed) ? parsed : [];

    const questions = raw
      .map((q, idx) => normalizeMcq(q, idx))
      .filter(Boolean)
      .slice(0, safeCount);

    if (!questions.length) {
      throw new ApiError("internal", "AI did not return valid MCQs");
    }

    // Count each generated MCQ as one tool use so usage reflects session size.
    trackAsync(req.user?.uid, "ai.interview-questions", questions.length);

    res.json({ questions });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

function normalizeMcq(q, idx) {
  if (!q || typeof q !== "object") return null;
  const options = Array.isArray(q.options)
    ? q.options.map((o) => String(o || "").trim()).filter(Boolean)
    : [];
  if (options.length !== 4) return null;

  let correctIndex = Number(q.correctIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    correctIndex = 0;
  }

  const question = String(q.question || "").trim();
  if (!question) return null;

  return {
    id: typeof q.id === "number" ? q.id : idx + 1,
    question,
    type: ["technical", "behavioral", "hr"].includes(q.type)
      ? q.type
      : "technical",
    difficulty: ["easy", "medium", "hard"].includes(q.difficulty)
      ? q.difficulty
      : "medium",
    options,
    correctIndex,
    explanation: String(q.explanation || "").trim(),
    tips: String(q.tips || "").trim(),
    hints: Array.isArray(q.hints)
      ? q.hints
          .map((h) => String(h || "").trim())
          .filter(Boolean)
          .slice(0, 4)
      : [],
  };
}

export default router;
