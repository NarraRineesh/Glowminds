import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { completionTask } from "../../services/aiClient.js";
import { stripJsonFences } from "../../utils/stripJsonFences.js";

const MAX_INPUT_CHARS = 50_000;
const MAX_PROMPT_CHARS = 40_000;

function parseResumePrompt(text) {
  return `You are a resume parser. Extract structured fields from the resume text below.
Return ONLY a JSON object with these string fields (use "" when missing):
{
  "name": "",
  "title": "",
  "email": "",
  "phone": "",
  "loc": "",
  "li": "",
  "gh": "",
  "summary": "",
  "skills": "",
  "exp": "",
  "projects": "",
  "ach": ""
}

Rules:
- "exp": each job as a block separated by a blank line. First line: "Company | Role | Dates". Following lines: bullet points prefixed with "- ".
- "skills": comma-separated list.
- "projects" and "ach": plain text; use newlines between items when there are several.
- No markdown, no commentary — only the JSON object.

Resume text:
---
${text}
---`;
}

const router = Router();

router.post("/parse-resume", requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length < 50) {
      throw new ApiError("invalid-argument", "Resume text is too short");
    }
    if (text.length > MAX_INPUT_CHARS) {
      throw new ApiError(
        "invalid-argument",
        `Resume text is too long (max ${MAX_INPUT_CHARS} chars)`,
      );
    }

    const { text: responseText } = await completionTask(
      "parse-resume",
      parseResumePrompt(text.trim().slice(0, MAX_PROMPT_CHARS)),
      { uid: req.user?.uid },
    );
    const parsed = JSON.parse(stripJsonFences(responseText));
    res.json({ parsed });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
