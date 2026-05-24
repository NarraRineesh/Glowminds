# Glowminds — AI-Powered Career Platform

All-in-one career assistant for students and fresh graduates. Build ATS-optimized resumes, discover AI-matched jobs, ace interviews with AI coaching, and track every application — powered by Gemini 2.0 Flash.

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
- **AI Backend**: Firebase Cloud Functions (Node.js 22) + Google Gemini 2.0 Flash
- **PDF**: html2canvas-pro + jsPDF (code-split)
- **Resume Parsing**: pdfjs-dist (PDF) + mammoth (DOCX)
- **SEO**: react-helmet-async with Open Graph + Twitter cards

## Cloud Functions (7 deployed)

| Function | Purpose |
|----------|---------|
| `parseResume` | AI resume parsing from uploaded PDF/DOCX text |
| `careerChat` | Multi-turn AI career coaching conversation |
| `generateInterviewQuestions` | Role-specific interview question generation |
| `evaluateAnswer` | STAR-method answer evaluation with scoring |
| `jobMatch` | AI skill vs job description analysis |
| `profileReview` | AI profile enhancement review |
| `onUserCreated` | Firestore trigger — seeds welcome notifications |

## Quick Start

```bash
# 1. Install frontend dependencies
npm install

# 2. Copy env and add your Firebase config
cp .env.example .env
# Edit .env with your Firebase project values

# 3. Install functions dependencies
cd functions && npm install && cd ..

# 4. Add Gemini API key for Cloud Functions
echo "GEMINI_API_KEY=your-key-here" > functions/.env

# 5. Start dev server
npm run dev
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → create project
2. Enable **Authentication** → Email/Password + Google providers
3. Create **Cloud Firestore** database
4. Create a **Web app** → copy config values into `.env`
5. Deploy functions: `firebase deploy --only functions`
6. Deploy rules: `firebase deploy --only firestore:rules`

## Project Structure

```
src/
├── components/
│   ├── layout/           # Navbar, Footer
│   ├── ProtectedRoute.jsx
│   ├── SEO.jsx
│   └── Toast.jsx
├── features/
│   ├── auth/             # LoginPage, SignupPage
│   ├── dashboard/
│   │   ├── DashboardShell.jsx
│   │   └── sections/
│   │       ├── OverviewSection.jsx    # Dashboard + Analytics
│   │       ├── JobsSection.jsx        # Job board
│   │       ├── ResumeSection.jsx      # Resume builder
│   │       ├── AISection.jsx          # AI career coach
│   │       ├── InterviewSection.jsx   # Mock interviews
│   │       ├── ApplicationsSection.jsx # Kanban tracker
│   │       └── ProfileSection.jsx     # User profile
│   └── public/           # LandingPage, AboutPage, FeaturesPage, ContactPage
├── hooks/                # useAuthListener, useReveal
├── services/             # firebase.js, jobApis.js, resumeParser.js
├── store/                # authStore, jobStore, trackerStore, notifStore
├── styles/               # 15 CSS modules
├── App.jsx               # Router setup
└── main.jsx              # Entry point

functions/
├── index.js              # 7 Cloud Functions (Gemini AI)
├── .env                  # GEMINI_API_KEY
└── package.json
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
VITE_FIREBASE_MEASUREMENT_ID=
```

**Functions** (`functions/.env`):
```
GEMINI_API_KEY=your-gemini-api-key
```

## Deployment

```bash
# Build frontend
npm run build

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy everything
firebase deploy
```

## License

Private project. Design and developed by KNR Tech Solutions.
