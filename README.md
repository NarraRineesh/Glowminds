# Glowminds — AI-Powered Career Platform

All-in-one career assistant for students and fresh graduates. Build ATS-optimized resumes, discover AI-matched jobs, ace interviews with AI coaching, and track every application — powered by Gemini.

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Firebase Auth** | Email/Password + Google Sign-In, protected routes, Firestore user profiles |
| 2 | **Job Board** | Live ATS-sourced jobs (Greenhouse/Lever/Ashby/BambooHR/Workday) with skill-based match scoring, save/unsave jobs |
| 3 | **Application Tracker** | Firestore-backed Kanban board with status management and notes |
| 4 | **Resume Builder** | 3 templates (Classic/Modern/Minimal), ATS score, multi-page PDF export |
| 5 | **AI Career Coach** | Multi-turn Gemini chat with history persistence, suggestion chips |
| 6 | **Mock Interview** | AI-generated role-specific questions, STAR-method evaluation, score ring |
| 7 | **Job Matching AI** | Gemini analyzes skills vs job description, match score + recommendations |
| 8 | **Profile Review AI** | AI-powered profile enhancement with strengths, weaknesses, tips |
| 9 | **Notifications** | Real-time Firestore listener, navbar dropdown, welcome notifications on signup |
| 10 | **Analytics Dashboard** | Application timeline, response rate, activity heatmap, status breakdown |

## Tech Stack

- **Frontend**: React 19 + Vite 8
- **Styling**: TailwindCSS v4 + custom CSS variables (dark theme)
- **Routing**: React Router v7
- **State**: Zustand 5
- **Auth & DB**: Firebase Auth + Cloud Firestore
- **API**: Firebase Cloud Functions Gen 2 (Express adapter, single `api` HTTPS function)
- **AI**: Google Gemini (primary) + OpenRouter (fallback)
- **PDF**: html2canvas-pro + jsPDF (code-split)
- **Resume Parsing**: pdfjs-dist (PDF) + mammoth (DOCX)
- **Job ingestion**: Local CLI in sibling folder `../job-pipeline/` (Ollama → Firestore)

## Quick Start

```bash
# 1. Install frontend + functions dependencies
npm install
npm --prefix functions install

# 2. Copy env and add your Firebase config
cp .env.example .env
# Edit .env with your Firebase project values

# 3. Functions config (non-secrets)
cp functions/.env.example functions/.env
# For local emulator, also add API keys to functions/.env:
#   GEMINI_API_KEY, OPENROUTER_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

# 4. Start dev (Vite + Functions emulator)
npm run dev
```

Vite proxies `/api/*` to the Functions emulator on port 5001.

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → create project
2. Enable **Authentication** → Email/Password + Google providers
3. Create **Cloud Firestore** database
4. Create a **Web app** → copy config values into `.env`
5. Upgrade to **Blaze** plan (required for outbound HTTP to Gemini/OpenRouter/Razorpay)
6. Set function secrets:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   firebase functions:secrets:set OPENROUTER_API_KEY
   firebase functions:secrets:set RAZORPAY_KEY_ID
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
   ```
7. Deploy: `npm run deploy`

## Project Structure

```
src/                    # React SPA
functions/src/          # Express API (single Cloud Function `api`)
../job-pipeline/        # Local job scraper + Ollama enricher → Firestore (outside repo)
```

## Environment Variables

**Frontend** (`.env`):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=/api
```

**Functions** (`functions/.env` — non-secrets; secrets via `firebase functions:secrets:set`):
```
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
OPENROUTER_SITE_URL=https://ai-jobcopilot.web.app
OPENROUTER_APP_NAME=Glowminds AI Job Copilot
```

## Job pipeline (local)

Job ingestion runs outside this repo:

```bash
cd ../job-pipeline
npm install
cp .env.example .env   # FIREBASE_SA_PATH, Ollama URL, etc.
npm run enrich
npm run push
```

## Deployment

```bash
npm run build
firebase deploy --only functions,hosting,firestore
```

Or: `npm run deploy`

## License

Private project. Glowminds AI Technologies Private Limited (CIN U62012KA2026PTC223290).
