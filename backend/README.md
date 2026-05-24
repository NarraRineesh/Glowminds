# AI Job Copilot — Backend

Single-VPS backend that replaces the Firebase Functions stack. Three processes:

| Process  | Entry           | Port             | Purpose                                                 |
| -------- | --------------- | ---------------- | ------------------------------------------------------- |
| `api`    | `src/server.js` | 3001             | Express HTTP API (**AI + jobs + payments only**)        |
| `sync`   | `src/sync.js`   | (none)           | ATS sync worker (node-cron) + 3 background workers      |
| `enrich` | `python/main.py`| 5000 (localhost) | Flask service for HTML cleaning + skill extraction      |

## Scope

Backend only owns things that **must** run server-side:

1. **AI** — provider API keys live here, prompts live here, fallback live here.
2. **Job search / job sync** — Firestore admin queries + ATS scraping.
3. **Payments** — Razorpay secret + signature verification.

Everything else (applications, notifications, streaks, badges, daily quiz,
saved jobs, interview history, AI chat history, profile) is written **directly
from the React app to Firestore** using the Firebase Web SDK. `firestore.rules`
restricts each user to their own `users/{uid}/...` subtree. No HTTP API exists
for these — the UI is the database client.

## AI provider strategy

Routes pick a provider per-task via `src/services/aiClient.js`. Primary is
Google Gemini (`X-goog-api-key`); OpenRouter is the fallback (and the primary
for cover-letter creativity). If Gemini fails, OpenRouter retries — and vice
versa — so a single missing key still leaves the API usable.

All Gemini calls run with `thinkingConfig: { thinkingBudget: 0 }` — no
extended reasoning tokens. Every prompt in this app is tightly scoped, so
hidden CoT just inflates latency + cost without changing the answer. A task
that *wants* thinking can set `thinkingBudget` on its `TASKS` entry.

| Task                  | Primary                  | Fallback     | Notes                                          |
| --------------------- | ------------------------ | ------------ | ---------------------------------------------- |
| `career-chat`         | gemini-2.5-flash         | openrouter   | low latency, multi-turn                        |
| `interview-questions` | gemini-2.5-flash-lite    | openrouter   | returns hints + keywords per question (JSON)   |
| `evaluate-session`    | gemini-2.5-flash         | openrouter   | **single batch call at session end** (JSON)    |
| `job-match`           | gemini-2.5-flash         | openrouter   | scoring (JSON)                                 |
| `profile-review`      | gemini-2.5-flash         | openrouter   | deeper analysis (JSON)                         |
| `cover-letter`        | openrouter (free)        | gemini-flash | creativity benefits from model variety         |
| `grammar`             | gemini-2.5-flash-lite    | openrouter   | JSON, cheapest                                 |
| `paraphrase`          | gemini-2.5-flash-lite    | openrouter   | JSON, cheapest                                 |
| `parse-resume`        | gemini-2.5-flash-lite    | openrouter   | JSON, cheapest                                 |

To change the routing for a task, edit `TASKS` in `aiClient.js` — that's the
only place model selection lives.

## Layout

```
backend/
├── package.json            ESM, Node >= 20
├── ecosystem.config.cjs    PM2 ecosystem (3 processes)
├── .env.example            copy to .env locally
├── data/
│   └── skills.json         ~250 canonical skills + aliases
├── src/
│   ├── server.js           api entry
│   ├── sync.js             sync entry (daemon + --once CLI)
│   ├── app.js              express app (cors, json, /api/health)
│   ├── config/
│   │   ├── env.js          centralized env access
│   │   ├── firebase.js     admin SDK singleton
│   │   └── platforms.js    greenhouse / lever / ashby / bamboo configs
│   ├── middleware/
│   │   ├── auth.js         requireAuth + optionalAuth (Bearer ID token)
│   │   └── errors.js       ApiError + envelope { error: { code, message } }
│   ├── services/
│   │   ├── aiClient.js     unified AI router (per-task model + fallback)
│   │   ├── gemini.js       Google Generative Language REST client
│   │   ├── openrouter.js   OpenRouter client (free-model fallback)
│   │   └── jobSearch.js    Firestore-backed search + match scoring
│   ├── routes/
│   │   ├── ai/             9 AI endpoints (careerChat, interviewQuestions, evaluateSession, ...)
│   │   ├── jobs/search.js  POST /api/jobs/search + GET /api/jobs/top-matches + /count
│   │   └── payments/razorpay.js  POST /api/payments/{create-order,verify-payment}
│   ├── sync/               ATS sync pipeline
│   ├── workers/            background workers (attached to sync process)
│   └── utils/
│       ├── stripJsonFences.js
│       └── hash.js
└── python/
    ├── requirements.txt
    ├── main.py             Flask app on 127.0.0.1:5000
    ├── cleaner.py          BS4 HTML cleaning (entity decode first)
    └── extractor.py        skill dict match + experience/seniority/role
```

## Prerequisites

- Node.js 20+ (currently tested on 24)
- Python 3.10+ (currently tested on 3.13)
- A Firebase service-account JSON file — drop it at `backend/service-account.json` and set `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` in `.env`
- A `GEMINI_API_KEY` (Google AI Studio) — primary AI provider
- An `OPENROUTER_API_KEY` (https://openrouter.ai/keys) — fallback + cover-letter primary

## Local setup

```bash
cd backend
cp .env.example .env
# edit .env: GOOGLE_APPLICATION_CREDENTIALS, GEMINI_API_KEY, OPENROUTER_API_KEY, ...

# Node deps
npm install

# Python deps
cd python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

## Run (local dev — 3 terminals)

```bash
# terminal 1
npm run dev:api

# terminal 2
cd python && source .venv/bin/activate && gunicorn -b 127.0.0.1:5000 -w 1 main:app

# terminal 3
npm run start:sync           # daemon mode (cron schedules)
# OR
npm run sync:once -- --provider greenhouse --limit 5   # one-shot
```

## Run (local via PM2)

```bash
npx pm2 start ecosystem.config.cjs
npx pm2 list
npx pm2 logs sync --lines 50
# tear down
npx pm2 delete all
```

## One-shot CLI flags (sync.js)

```
--once                    one-shot mode then exit
--all                     run every provider once
--provider greenhouse     run a single provider
--slug slug1,slug2        run specific company slugs
--limit 5                 cap companies per provider
--force                   ignore company gate
--dry-run                 don't write anything
--concurrency 5
```

## Initial data load (executes last)

Seed the `companies/` collection via the admin panel UI (CRUD), then:

```bash
npm run sync:full          # first full sync — all gates fire, jobs/ populates
```

Then `pm2 start ecosystem.config.cjs` for cron-driven incremental updates.

## Endpoints

### `GET /api/health`
Public. Returns `{ status, env, uptimeSec }`.

### 9 AI routes — `POST /api/ai/*` (Bearer token)

| Route                          | Body                                                                       | Notes                                              |
| ------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------- |
| `/api/ai/career-chat`          | `{ message, history }`                                                     | streaming-style multi-turn chat                    |
| `/api/ai/interview-questions`  | `{ role, type, count }`                                                    | returns MCQs: `[{ question, type, difficulty, options[4], correctIndex, explanation, tips, hints[] }]` |
| `/api/ai/evaluate-session`     | `{ role, items: [{ question, type, difficulty, options[4], correctIndex, selectedIndex }] }` | **batch** — per-question correctness is computed server-side; AI returns only the session-level coaching summary |
| `/api/ai/job-match`            | `{ userSkills, userExperience, jobTitle, jobCompany, jobDesc, jobTags }`   | -                                                  |
| `/api/ai/profile-review`       | `{ profile }`                                                              | -                                                  |
| `/api/ai/cover-letter`         | `{ profile, jobTitle, company, jobDescription }`                           | -                                                  |
| `/api/ai/grammar`              | `{ text }`                                                                 | -                                                  |
| `/api/ai/paraphrase`           | `{ text, tone }`                                                           | -                                                  |
| `/api/ai/parse-resume`         | `{ text }`                                                                 | -                                                  |

The interview flow is **MCQ-only**: each question has 4 options + one
correct index + an explanation. The UI collects all picks, then calls
`/evaluate-session` exactly once at the end. Per-question correctness is
deterministic (computed server-side from `correctIndex == selectedIndex`),
so the AI's job is purely topic-level coaching — strengths, focus areas,
and a prioritised study plan. Each question carries `tips` + `hints[]` so
the candidate has scaffolding without burning extra tokens.

### `POST /api/jobs/search` (Bearer token)
Reads `ACTIVE` jobs from the Firestore `jobs/` collection (populated by the
sync worker), filters in-memory by query text + location, and ranks results
by match score against the caller's profile. Body:
`{ search, category, limit, useProfile }`. **No external job-board APIs** are
called — the DB is the only source of truth.

### `GET /api/jobs/top-matches?limit=5&category=` (Bearer token)
Returns the top N jobs ranked against the caller's profile skills (defaults
to 5, capped at 25). Same Firestore-only data path as `/search`.

### `GET /api/jobs/count?search=&category=&useProfile=true` (Bearer token)
Returns just the count of jobs matched by the same query pipeline as
`/search` (profile-derived query + location + category) — no scoring,
no result rows. The count is capped at a server-side pool size; when
the cap is reached, the response sets `saturated: true` and the caller
should treat `count` as a lower bound.

### `POST /api/payments/create-order` and `POST /api/payments/verify-payment` (Bearer token)
Razorpay order creation + HMAC signature verification. The secret never
leaves the backend.

### `POST /enrich` (python, localhost-only)
Body: `{ rawHtml, plainText }`. Returns `{ plainText, skills, experience, seniority, role, remote, employmentType, searchText }`.

## What is NOT here (by design)

| Concern              | Lives in           | Why                                                                  |
| -------------------- | ------------------ | -------------------------------------------------------------------- |
| Applications kanban  | Frontend → Firestore | No server-side validation needed; rules enforce ownership          |
| Notifications        | Frontend → Firestore | Real-time listener (`onSnapshot`) feeds the bell UI                |
| Streak / daily visit | Frontend → Firestore (transaction) | Idempotent client-side compare-and-set is fine       |
| Badge awarding       | Frontend → Firestore (transaction) | Catalog is public; ownership rules block tampering   |
| Daily quiz XP        | Frontend → Firestore (transaction) | Same as above                                         |
| Saved jobs           | Frontend → Firestore | Just `users/{uid}/savedJobs/{jobId}` writes                        |
| AI chat history      | Frontend → Firestore | The chat *content* round-trips through the API; the *storage* doesn't |
| Interview history    | Frontend → Firestore | Same model as AI chat                                              |
| Resume drafts        | Frontend → Firestore | Same model                                                         |

If you find yourself adding a route to wrap a Firestore write, ask whether
the client could just do it under the existing rules. Most of the time, the
answer is yes.

## Error envelope

All routes return errors as:

```json
{ "error": { "code": "invalid-argument", "message": "Text is too short" } }
```

Codes map to HTTP statuses: `invalid-argument` → 400, `unauthenticated` → 401, `permission-denied` → 403, `not-found` → 404, `internal` → 500.
