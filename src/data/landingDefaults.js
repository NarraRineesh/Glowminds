const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Swiggy', 'Razorpay', 'Infosys', 'TCS', 'Zoho', 'Freshworks', 'PhonePe', 'CRED', 'Meesho', 'Groww']

const FEATURES = [
  {
    key: 'resume-builder',
    badge: 'AI RESUME BUILDER', badgeBg: 'rgba(56,139,253,.08)', badgeColor: 'var(--color-blu)',
    title: 'Build Resumes That Actually Get Past ATS',
    desc: 'Stop getting auto-rejected. Our Gemini-powered AI analyzes job descriptions, identifies critical keywords, and builds perfectly formatted resumes that score 90+ on ATS systems. Upload an existing resume to enhance it, or start from scratch with 15 professional templates and real-time scoring.',
    bullets: ['ATS compatibility tested against 200+ systems', 'Upload existing resume — AI enhances it instantly', '15 professional templates with live preview & PDF export', 'Smart keyword optimization matched to job descriptions'],
    image: '/mockups/resume-builder.svg',
    cta: 'Try resume builder free',
  },
  {
    key: 'job-matching',
    badge: 'SMART JOB MATCHING', badgeBg: 'rgba(63,185,80,.08)', badgeColor: 'var(--color-grn)',
    title: 'Stop Scrolling. Start Getting Matched.',
    desc: 'Our AI scans 50+ job portals every hour — Naukri, LinkedIn, Internshala, AngelList, and more — then ranks every opportunity against your skills, experience, and preferences. Filter by remote/hybrid/on-site, salary range, or company size.',
    bullets: ['50+ portals scanned automatically every hour', 'Ranked by your skills — only relevant jobs, zero noise', 'Filter by location, salary, remote/hybrid/on-site', 'Real-time alerts when dream jobs appear'],
    image: '/mockups/job-matching.svg', reverse: true,
    cta: 'Find matched jobs',
  },
  {
    key: 'ai-coach',
    badge: 'Glow (Bot)', badgeBg: 'rgba(210,153,34,.08)', badgeColor: 'var(--color-gold)',
    title: 'Glow — your career bot',
    desc: 'Glow is the Glowminds career bot. Ask about resumes, interviews, salary, skill gaps, and outreach. It keeps context across sessions so advice matches your profile.',
    bullets: ['Multi-turn conversations with your career context', 'STAR method coaching for behavioral interviews', 'Salary negotiation scripts tailored to your offer', 'Outreach templates for recruiters and hiring managers'],
    image: '/mockups/ai-coach.svg',
    cta: 'Open Glow (Bot)',
  },
  {
    key: 'interview-prep',
    badge: 'INTERVIEW PREP', badgeBg: 'rgba(188,140,255,.08)', badgeColor: 'var(--color-prp)',
    title: 'Walk Into Every Interview With Confidence',
    desc: 'Practice with AI-generated questions tailored to your target role, get instant STAR-method feedback, and track your improvement over time. Choose from 12 role categories including Software Engineer, Data Analyst, Product Manager, and more.',
    bullets: ['Technical, behavioral & HR questions — 12 role categories', 'Real-time answer evaluation with scores (1-10)', 'STAR breakdown for behavioral answers', 'Session summaries with strengths & areas to improve'],
    image: '/mockups/interview-prep.svg', reverse: true,
    cta: 'Practice interviews free',
  },
  {
    key: 'app-tracker',
    badge: 'APPLICATION TRACKER', badgeBg: 'rgba(248,117,186,.08)', badgeColor: '#f875ba',
    title: 'Never Lose Track of an Application Again',
    desc: 'Replace messy spreadsheets with a visual Kanban board. Drag applications between stages — Applied, Shortlisted, Interview, Offered — and see your entire job search pipeline at a glance. Set follow-up reminders so you never miss a deadline.',
    bullets: ['Visual Kanban board with drag-and-drop', 'Auto-reminders for follow-ups and deadlines', 'Application timeline and status history', 'One-click status updates from any device'],
    image: '/mockups/app-tracker.svg',
    cta: 'Track your applications',
  },
  {
    key: 'cover-letter',
    badge: 'COVER LETTER GENERATOR', badgeBg: 'rgba(6,182,212,.08)', badgeColor: '#06b6d4',
    title: 'Tailored Cover Letters in 30 Seconds',
    desc: 'Paste a job description and our AI generates a personalized cover letter that highlights your most relevant skills and experience. It pulls from your resume data, matches the job requirements, and creates compelling narratives — ready to send or customize further.',
    bullets: ['Job-description-aware — matches role requirements', 'Auto-pulls skills from your resume profile', 'Multiple tone options — enthusiastic, professional, concise', 'Export as PDF or copy to clipboard instantly'],
    image: '/mockups/cover-letter.svg', reverse: true,
    cta: 'Generate cover letters',
  },
  {
    key: 'grammar-checker',
    badge: 'AI GRAMMAR CHECKER', badgeBg: 'rgba(20,184,166,.08)', badgeColor: '#14b8a6',
    title: 'Perfect Every Word Before You Hit Send',
    desc: 'Typos on a resume? Awkward phrasing in a cover letter? Our AI grammar checker catches errors, improves tone, and boosts readability across all your career documents. Choose between formal, confident, or friendly tones — and sound exactly as professional as you want.',
    bullets: ['Resume & cover letter grammar optimization', 'Tone adjustment — formal, confident, or friendly', 'Clarity & readability scoring with suggestions', 'One-click fix — accept all corrections instantly'],
    image: '/mockups/grammar-checker.svg',
  },
]

/** Homepage feature story order (excludes AI Coach). */
const HOME_FEATURE_KEYS = ['resume-builder', 'job-matching', 'ai-coach', 'cover-letter', 'interview-prep', 'app-tracker']

const HERO = {
  positioning: 'AI-Powered Career Operating System',
  headline: 'Your AI-Powered Career Operating System',
  highlight: 'Career Operating System',
  subheadline:
    'Not just a resume tool or job board. Glowminds runs the full loop: ATS resumes, matched jobs, Glow (Bot), interviews, skills, and tracking — one OS for getting hired.',
  primaryCta: 'Start your Career OS',
  secondaryCta: 'See all features',
  liveBadge: 'LIVE',
}

const HERO_METRICS = [
  { value: '15', label: 'Resume templates' },
  { value: 'ATS', label: 'Resume scoring' },
  { value: '1', label: 'Dashboard for the whole search' },
]

const TRUST_BADGES = [
  { icon: 'lock', label: 'Secure Authentication' },
  { icon: 'resume', label: 'PDF Export' },
  { icon: 'robot', label: 'AI Powered' },
  { icon: 'sparkle', label: 'Instant Results' },
]

const OUTCOME_GROUPS = [
  {
    title: 'Get More Interviews',
    items: [
      { icon: 'resume', title: 'ATS Resume Builder', desc: 'Templates and formatting that pass applicant tracking systems.' },
      { icon: 'sparkle', title: 'AI Resume Optimization', desc: 'Keyword and structure suggestions matched to your target roles.' },
      { icon: 'envelope-open', title: 'Cover Letter Generation', desc: 'Personalized letters from job descriptions in seconds.' },
    ],
  },
  {
    title: 'Find Better Opportunities',
    items: [
      { icon: 'target', title: 'Smart Job Matching', desc: 'Ranked jobs based on your skills, experience, and preferences.' },
      { icon: 'chart', title: 'Salary Insights', desc: 'Understand pay ranges before you apply or negotiate.' },
      { icon: 'bell', title: 'Job Alerts', desc: 'Get notified when roles that fit your profile go live.' },
    ],
  },
  {
    title: 'Ace Your Interviews',
    items: [
      { icon: 'microphone', title: 'AI Mock Interviews', desc: 'Role-specific questions with realistic practice sessions.' },
      { icon: 'dashboard', title: 'Feedback Reports', desc: 'STAR-method breakdowns and improvement tips after each session.' },
      { icon: 'trophy', title: 'Confidence Scoring', desc: 'Track clarity, structure, and impact over time.' },
    ],
  },
]

const WHY_GLOWMINDS = {
  title: 'Why Not Use 5 Different Tools?',
  subtitle: 'Traditional Way vs Glowminds',
  rows: [
    { feature: 'Resume Builder' },
    { feature: 'LinkedIn Optimization' },
    { feature: 'Cover Letters' },
    { feature: 'Interview Prep' },
    { feature: 'Job Tracking' },
    { feature: 'One Dashboard' },
  ],
  closing: 'Stop switching between websites. Run your entire career search in one Career OS.',
}

const EXIT_CTA = {
  title: 'Ready to run your Career OS?',
  body: 'Build resumes, match jobs, talk to Glow (Bot), and prep interviews — start free.',
  button: 'Start Free',
}

const STEPS = [
  { num: '01', ico: 'pencil', title: 'Create Your Profile', desc: 'Sign up in 30 seconds. Add your skills, education, experience, and job preferences — our AI does the rest.' },
  { num: '02', ico: 'resume', title: 'Build Your Resume', desc: 'AI generates an ATS-optimized resume in minutes. Pick a template, get a real-time score, and export as PDF.' },
  { num: '03', ico: 'target', title: 'Get Matched & Apply', desc: 'We scan 50+ portals daily, rank jobs by your match score, and let you apply with a single click.' },
  { num: '04', ico: 'trophy', title: 'Land Your Dream Job', desc: 'Prep with AI mock interviews, track apps on your Kanban board, and celebrate when offers start rolling in!' },
]

const TOOLS = [
  { ico: 'resume', title: 'Resume Builder', desc: 'ATS-optimized resumes with 15 templates, live preview, and one-click PDF export.', bg: 'var(--color-blu3)' },
  { ico: 'target', title: 'Job Matching', desc: 'AI scans 50+ portals hourly and ranks jobs by your personal skill match score.', bg: 'var(--color-grn2)' },
  { ico: 'robot', title: 'Glow (Bot)', desc: '24/7 career advisor with context memory — resumes, interviews, salary, and more.', bg: 'var(--color-gold2)' },
  { ico: 'microphone', title: 'Interview Prep', desc: 'Practice with AI questions across 12 roles. Get scored on clarity, structure & impact.', bg: 'var(--color-prp2)' },
  { ico: 'dashboard', title: 'App Tracker', desc: 'Visual Kanban board to track every application from applied to offer letter.', bg: 'rgba(248,117,186,.1)' },
  { ico: 'grammar-check', title: 'Grammar Checker', desc: 'Fix grammar, tone & clarity in resumes, cover letters, emails, and SOPs.', bg: 'rgba(20,184,166,.08)' },
  { ico: 'envelope-open', title: 'Cover Letter Gen', desc: 'AI writes tailored cover letters from job descriptions in under 30 seconds.', bg: 'rgba(6,182,212,.08)' },
  { ico: 'linkedin', title: 'LinkedIn Optimizer', desc: 'Optimize your headline, summary & skills for maximum recruiter visibility.', bg: 'rgba(56,139,253,.08)' },
  { ico: 'cover-letters', title: 'Cold Email Drafter', desc: 'Craft professional outreach emails to recruiters and hiring managers.', bg: 'rgba(244,114,182,.08)' },
  { ico: 'pencil', title: 'Essay & SOP Writer', desc: 'Generate structured essays, SOPs, and personal statements for admissions.', bg: 'rgba(168,85,247,.08)' },
  { ico: 'calendar', title: 'Skill Gap & Learning Path', desc: 'See missing skills for your target role, then get a weekly AI study plan you can track.', bg: 'rgba(34,197,94,.08)' },
  { ico: 'code', title: 'Code Reviewer', desc: 'Get AI feedback on code quality, bugs, performance, and best practices.', bg: 'rgba(251,146,60,.08)' },
]

const TESTIMONIALS = [
  { name: 'Aditi Verma', role: 'SDE intern track', avatar: 'AV', example: true, text: 'Example: build an ATS-ready resume, then apply to matched internships from one dashboard.' },
  { name: 'Rahul Gupta', role: 'Frontend track', avatar: 'RG', example: true, text: 'Example: use the AI coach and mock interviews to prepare for early-career rounds.' },
  { name: 'Karthik R', role: 'Full-stack track', avatar: 'KR', example: true, text: 'Example: ranked job matches beat scrolling generic boards when you have a target role and skills.' },
]

const TRUST_LOGOS = ['IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'VIT', 'SRM', 'Manipal', 'IIIT Hyderabad', 'DTU', 'NSUT', 'PES University', 'Amity']

const FAQS = [
  { q: 'Is Glowminds free to use?', a: 'Yes. Free includes job search, 1 ATS resume, 10 application tracks, and 10 AI credits/month. Pro is ₹99/month, founding yearly ₹599, or Lifetime ₹2,999.' },
  { q: 'How does the AI job matching work?', a: 'Our AI compares job requirements with your skills, education, and preferences to generate a personalized match score from 0-100%, then helps you filter and prioritize the best-fit roles.' },
  { q: 'What makes the resume builder ATS-optimized?', a: 'We follow industry-standard ATS formatting rules — clean structure, keyword optimization, proper headings, machine-readable layouts, and we check against 200+ ATS systems.' },
  { q: 'How does upskilling / skill-gap analysis work?', a: 'Pick a target role, and Glowminds compares your profile skills against what the role typically needs. You get a clear skill gap plus an AI learning path you can save, resume, and update over time.' },
  { q: 'Can I use this if I\'m not a student?', a: 'Absolutely! While optimized for students and fresh graduates, anyone early in their career or looking to switch can benefit from our tools.' },
  { q: 'How does the Grammar Checker work?', a: 'Paste any text — resume bullets, cover letter paragraphs, emails — and our Gemini-powered AI checks grammar, spelling, tone, and clarity. You can choose formal, confident, or friendly tone and accept fixes with one click.' },
  { q: 'Can I generate cover letters for any job?', a: 'Yes! Just paste the job description and our AI matches your resume data to the role requirements, generating a personalized cover letter in seconds. You can adjust the tone and export as PDF.' },
]

const STATS = {
  students: 'Students & freshers',
  dailyJobs: 'Live job board',
  matchRate: 'Skill-ranked matches',
  rating: 'Free to start',
  badgeLine: 'ATS resume, jobs & interview prep',
}

const ABOUT_METRICS = [
  { value: '15', label: 'Resume templates' },
  { value: 'ATS', label: 'Resume scoring' },
  { value: '50+', label: 'Job portals' },
  { value: '₹0', label: 'Free to start' },
]

const SOCIAL_PROOF = {
  signupBadge: '✦ FREE TO START',
  loginStudents: 'Students & freshers',
  storyStudents: 'students and early-career professionals',
  joinStudentsTitle: 'Join students getting hired',
}

const CONTACT_INFO = [
  { ico: 'envelope', title: 'Email Us', value: 'hello@glowminds.in', desc: 'We reply within 24 hours' },
  { ico: 'map-pin', title: 'Registered office', value: 'Glowminds AI Technologies Private Limited', desc: 'No. 472/7, Balaji Arcade AVS Compound, Koramangala VI Block, Bangalore 560095' },
  { ico: 'chat', title: 'Live Chat', value: 'In-app Glow (Bot)', desc: 'Available in the dashboard' },
]

const HERO_IMAGES = [
  { key: 'dashboard', label: 'Dashboard', src: '/mockups/dashboard.svg' },
  { key: 'resume', label: 'Resume Builder', src: '/mockups/resume-builder.svg' },
  { key: 'interview', label: 'Interview Prep', src: '/mockups/interview-prep.svg' },
  { key: 'grammar', label: 'Grammar Checker', src: '/mockups/grammar-checker.svg' },
]

/** Resolve homepage features in story order. */
export function getHomeFeatures(features = FEATURES, keys = HOME_FEATURE_KEYS) {
  const byKey = Object.fromEntries(features.map((f) => [f.key, f]))
  return keys.map((key) => byKey[key]).filter(Boolean)
}

export const DEFAULT_LANDING_CONTENT = {
  companies: COMPANIES,
  features: FEATURES,
  homeFeatureKeys: HOME_FEATURE_KEYS,
  hero: HERO,
  heroMetrics: HERO_METRICS,
  trustBadges: TRUST_BADGES,
  outcomeGroups: OUTCOME_GROUPS,
  whyGlowminds: WHY_GLOWMINDS,
  exitCta: EXIT_CTA,
  steps: STEPS,
  tools: TOOLS,
  testimonials: TESTIMONIALS,
  trustLogos: TRUST_LOGOS,
  faqs: FAQS,
  heroImages: HERO_IMAGES,
  stats: STATS,
  aboutMetrics: ABOUT_METRICS,
  socialProof: SOCIAL_PROOF,
  contactInfo: CONTACT_INFO,
}
