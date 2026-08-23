# Glowminds — AI-Powered Career Platform

All-in-one career assistant for students and early-career professionals in India. Build ATS resumes, discover matched jobs, run AI Apply Kit flows, practice interviews, and track applications — on Firebase + the Glowminds jobs catalog API.

## Features

| Area | What ships |
|------|------------|
| **Auth** | Firebase Auth (email + Google), custom admin claims |
| **Jobs** | Catalog search via `api.glowminds.in`, Apply Kit, admin hide/boost |
| **Resume** | Embedded Glowminds Resume builder (package), ATS review (Pro), paraphrase enhance |
| **AI tools** | Career coach (grounded in profile/job), interview MCQs, cover letters + cold email, grammar, paraphrase, profile review, LinkedIn audit, salary negotiate |
| **Billing** | Razorpay Pro, monthly AI credits, entitlements API |
| **Alerts** | Daily in-app job digest for opted-in users (`preferences.jobAlerts`) |
| **Admin** | Users/Pro/credits, token & cost telemetry, job moderation, pricing |

## Tech Stack

- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4
- **Routing**: React Router v7 (lazy public + dashboard routes)
- **State**: Zustand
- **Auth / user data**: Firebase Auth + Cloud Firestore
- **Jobs data**: `https://api.glowminds.in/v1`
- **API**: Firebase Cloud Functions Gen 2 — Express `api` + scheduled jobs
- **AI**: Gemini + OpenRouter failover (`functions/src/services/aiClient.js`)
- **Payments**: Razorpay

## Quick Start

```bash
pnpm install
pnpm --prefix functions install

cp .env.example .env
cp functions/.env.example functions/.env
# Add Firebase web config + GEMINI/OPENROUTER/RAZORPAY as needed

pnpm dev   # Vite :5173 + Functions emulator :5001
```

Vite proxies `/api/*` to the Functions emulator.

## Firebase Setup

1. Create project → Auth (Email/Password + Google) → Firestore
2. Blaze plan (outbound AI + Razorpay)
3. Secrets:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   firebase functions:secrets:set OPENROUTER_API_KEY
   firebase functions:secrets:set RAZORPAY_KEY_ID
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
   ```
4. Grant admin: `pnpm admin:set -- --email you@example.com` then re-login
5. Deploy: `pnpm deploy` (or `firebase deploy --only functions,hosting,firestore`)

## Project Structure

```
src/                         # React SPA (dashboard, admin, public)
packages/glowminds-resume/   # Embedded resume builder
functions/src/               # Express API + scheduled functions
```

Scheduled functions:

- `expireProSubscriptions` — daily Pro expiry
- `dailyJobAlertDigests` — morning job digests for opted-in users

## Environment

**Frontend** (`.env`): Firebase `VITE_*` keys, `VITE_API_BASE_URL=/api`, `VITE_PUBLIC_SITE_URL=https://glowminds.in`, `VITE_PUBLIC_APP_URL=https://app.glowminds.in`

See `docs/domains.md` for the marketing vs app host split, Cloudflare CNAME, and Auth host list.

**Functions** (`functions/.env`): `CORS_ORIGINS`, Supabase URL/anon if used; secrets via Firebase secrets (not committed).

## AI credits (defaults)

Free 10 / Pro 100 per month. Costs include career chat 1, LinkedIn audit 2, job fit 3, salary negotiate 2, cover letter / resume review 5, interview generate 10 (evaluation included).

## License

Private project. Glowminds AI Technologies Private Limited (CIN U62012KA2026PTC223290).
