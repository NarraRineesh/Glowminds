const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Swiggy', 'Razorpay', 'Infosys', 'TCS', 'Zoho', 'Freshworks', 'PhonePe', 'CRED', 'Meesho', 'Groww']

const FEATURES = [
  {
    key: 'resume-builder',
    badge: 'AI RESUME BUILDER', badgeBg: 'rgba(56,139,253,.08)', badgeColor: 'var(--color-blu)',
    title: 'Build Resumes That Actually Get Past ATS',
    desc: 'Stop getting auto-rejected. Our Gemini-powered AI analyzes job descriptions, identifies critical keywords, and builds perfectly formatted resumes that score 90+ on ATS systems. Upload an existing resume to enhance it, or start from scratch with 6 professional templates and real-time scoring.',
    bullets: ['ATS compatibility tested against 200+ systems', 'Upload existing resume — AI enhances it instantly', '6 professional templates with live preview & PDF export', 'Smart keyword optimization matched to job descriptions'],
    image: '/mockups/resume-builder.svg',
    cta: 'Try resume builder free',
  },
  {
    key: 'job-matching',
    badge: 'SMART JOB MATCHING', badgeBg: 'rgba(63,185,80,.08)', badgeColor: 'var(--color-grn)',
    title: 'Stop Scrolling. Start Getting Matched.',
    desc: 'Our AI scans 50+ job portals every hour — Naukri, LinkedIn, Internshala, AngelList, and more — then ranks every opportunity against your skills, experience, and preferences. 94% of our matches result in relevant applications. Filter by remote/hybrid/on-site, salary range, or company size.',
    bullets: ['50+ portals scanned automatically every hour', '94% match accuracy — only relevant jobs, zero noise', 'Filter by location, salary, remote/hybrid/on-site', 'Real-time alerts when dream jobs appear'],
    image: '/mockups/job-matching.svg', reverse: true,
    cta: 'Find matched jobs',
  },
  {
    key: 'ai-coach',
    badge: 'AI CAREER COACH', badgeBg: 'rgba(210,153,34,.08)', badgeColor: 'var(--color-gold)',
    title: 'Your Personal Career Strategist, Available 24/7',
    desc: 'Powered by Gemini AI and trained on career coaching best practices, our AI Coach gives expert-level advice on resume writing, interview preparation, salary negotiation, career pivots, and cold outreach. It remembers your conversation context across sessions — like having a career mentor in your pocket.',
    bullets: ['Multi-turn conversations — remembers your context', 'STAR method coaching for behavioral interviews', 'Salary negotiation scripts tailored to your offer', 'Cold outreach templates for recruiters & hiring managers'],
    image: '/mockups/ai-coach.svg',
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
const HOME_FEATURE_KEYS = ['resume-builder', 'job-matching', 'cover-letter', 'interview-prep', 'app-tracker']

const HERO = {
  positioning: 'We help you get hired.',
  headline: 'Get Hired Faster with One AI Career Platform',
  highlight: 'Get Hired Faster',
  subheadline:
    'Build an ATS-ready resume, discover matched jobs, apply with tailored cover letters, practice interviews, and track every application — all in one place.',
  primaryCta: 'Build Your Resume',
  secondaryCta: 'Explore Tools',
  liveBadge: 'LIVE',
}

const HERO_METRICS = [
  { value: '5,000+', label: 'Resumes Created' },
  { value: '2,000+', label: 'Cover Letters Generated' },
  { value: '1,200+', label: 'Interviews Practiced' },
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
  closing: 'Stop switching between websites. Manage your entire job search in one place.',
}

const EXIT_CTA = {
  title: 'Ready to Land Your Next Job?',
  body: 'Build your resume, discover opportunities, and prepare for interviews — all for free.',
  button: 'Start Free',
}

const STEPS = [
  { num: '01', ico: 'pencil', title: 'Create Your Profile', desc: 'Sign up in 30 seconds. Add your skills, education, experience, and job preferences — our AI does the rest.' },
  { num: '02', ico: 'resume', title: 'Build Your Resume', desc: 'AI generates an ATS-optimized resume in minutes. Pick a template, get a real-time score, and export as PDF.' },
  { num: '03', ico: 'target', title: 'Get Matched & Apply', desc: 'We scan 50+ portals daily, rank jobs by your match score, and let you apply with a single click.' },
  { num: '04', ico: 'trophy', title: 'Land Your Dream Job', desc: 'Prep with AI mock interviews, track apps on your Kanban board, and celebrate when offers start rolling in!' },
]

const TOOLS = [
  { ico: 'resume', title: 'Resume Builder', desc: 'ATS-optimized resumes with 6 templates, live preview, and one-click PDF export.', bg: 'var(--color-blu3)' },
  { ico: 'target', title: 'Job Matching', desc: 'AI scans 50+ portals hourly and ranks jobs by your personal skill match score.', bg: 'var(--color-grn2)' },
  { ico: 'robot', title: 'AI Career Coach', desc: '24/7 career coaching with context memory — resumes, interviews, salary, and more.', bg: 'var(--color-gold2)' },
  { ico: 'microphone', title: 'Interview Prep', desc: 'Practice with AI questions across 12 roles. Get scored on clarity, structure & impact.', bg: 'var(--color-prp2)' },
  { ico: 'dashboard', title: 'App Tracker', desc: 'Visual Kanban board to track every application from applied to offer letter.', bg: 'rgba(248,117,186,.1)' },
  { ico: 'grammar-check', title: 'Grammar Checker', desc: 'Fix grammar, tone & clarity in resumes, cover letters, emails, and SOPs.', bg: 'rgba(20,184,166,.08)' },
  { ico: 'envelope-open', title: 'Cover Letter Gen', desc: 'AI writes tailored cover letters from job descriptions in under 30 seconds.', bg: 'rgba(6,182,212,.08)' },
  { ico: 'linkedin', title: 'LinkedIn Optimizer', desc: 'Optimize your headline, summary & skills for maximum recruiter visibility.', bg: 'rgba(56,139,253,.08)' },
  { ico: 'cover-letters', title: 'Cold Email Drafter', desc: 'Craft professional outreach emails to recruiters and hiring managers.', bg: 'rgba(244,114,182,.08)' },
  { ico: 'pencil', title: 'Essay & SOP Writer', desc: 'Generate structured essays, SOPs, and personal statements for admissions.', bg: 'rgba(168,85,247,.08)' },
  { ico: 'calendar', title: 'Study Planner', desc: 'AI builds personalized study schedules based on your skill gaps and goals.', bg: 'rgba(34,197,94,.08)' },
  { ico: 'code', title: 'Code Reviewer', desc: 'Get AI feedback on code quality, bugs, performance, and best practices.', bg: 'rgba(251,146,60,.08)' },
]

const TESTIMONIALS = [
  { name: 'Aditi Verma', role: 'SDE Intern @ Google', avatar: 'code', text: 'Glowminds matched me with my dream internship. The AI resume builder got me a 96 ATS score — I got 3 interview calls in the first week!' },
  { name: 'Rahul Gupta', role: 'Frontend Dev @ Swiggy', avatar: 'code', text: 'The AI career coach helped me prepare for 3 rounds of interviews. Got the offer in 2 weeks. This platform is a game-changer for freshers.' },
  { name: 'Karthik R', role: 'Full Stack @ Razorpay', avatar: 'code', text: 'Best platform for freshers. Period. The job matching accuracy is insane — 94% relevant. Saved me hours of scrolling through job boards.' },
]

const TRUST_LOGOS = ['IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'VIT', 'SRM', 'Manipal', 'IIIT Hyderabad', 'DTU', 'NSUT', 'PES University', 'Amity']

const FAQS = [
  { q: 'Is Glowminds free to use?', a: 'Yes! Glowminds offers a generous free tier with job search, 1 ATS resume, 10 application tracks, and 10 AI credits/month. Pro is available for ₹599/year (founding offer).' },
  { q: 'How does the AI job matching work?', a: 'Our AI scans 50+ job portals daily and compares requirements with your skills, education, and preferences to generate a personalized match score from 0-100%.' },
  { q: 'What makes the resume builder ATS-optimized?', a: 'We follow industry-standard ATS formatting rules — clean structure, keyword optimization, proper headings, machine-readable layouts, and we check against 200+ ATS systems.' },
  { q: 'Can I use this if I\'m not a student?', a: 'Absolutely! While optimized for students and fresh graduates, anyone early in their career or looking to switch can benefit from our tools.' },
  { q: 'How does the Grammar Checker work?', a: 'Paste any text — resume bullets, cover letter paragraphs, emails — and our Gemini-powered AI checks grammar, spelling, tone, and clarity. You can choose formal, confident, or friendly tone and accept fixes with one click.' },
  { q: 'Can I generate cover letters for any job?', a: 'Yes! Just paste the job description and our AI matches your resume data to the role requirements, generating a personalized cover letter in seconds. You can adjust the tone and export as PDF.' },
]

const STATS = {
  students: '5,000+',
  dailyJobs: '12K+',
  matchRate: '94%',
  rating: '4.9/5',
}

const HERO_IMAGES = [
  { key: 'dashboard', label: 'Dashboard', src: '/mockups/dashboard.svg' },
  { key: 'resume', label: 'Resume Builder', src: '/mockups/resume-builder.svg' },
  { key: 'interview', label: 'Interview Prep', src: '/mockups/interview-prep.svg' },
  { key: 'grammar', label: 'Grammar Checker', src: '/mockups/grammar-checker.svg' },
]

const PRICING = {
  free: {
    label: 'FREE',
    price: '₹0',
    period: '/forever',
    desc: 'Perfect for getting started.',
    features: ['Job search & matching', '1 ATS resume', 'Track up to 10 applications', '10 AI credits/month', 'Basic job alerts', 'Profile & portfolio'],
  },
  pro: {
    label: 'PRO',
    price: '₹599',
    regularPrice: '₹999',
    period: '/year',
    desc: 'Everything serious job seekers need.',
    highlights: [
      '100 AI Credits / Month',
      'AI Mock Interviews',
      'AI Cover Letters',
      'AI Career Coach',
      'Smart Job Matching',
    ],
    features: ['Unlimited resumes', 'Unlimited application tracking', '100 AI credits every month', 'AI Mock Interviews', 'AI Cover Letters', 'AI Career Coach Chat', 'Resume ATS Reviews', 'All 6 premium templates', 'Salary insights & analytics', 'Real-time job alerts', 'Priority support'],
  },
}

const PRICING_COMPARISON = [
  { feature: 'Job Search', freeIncluded: true, proIncluded: true, freeDetail: 'Basic', proDetail: 'Advanced + AI Matching' },
  { feature: 'Resume Builder', freeIncluded: true, proIncluded: true, freeDetail: '1 Resume', proDetail: 'Unlimited Resumes' },
  { feature: 'Application Tracker', freeIncluded: true, proIncluded: true, freeDetail: '10 Applications', proDetail: 'Unlimited' },
  { feature: 'AI Credits', freeIncluded: true, proIncluded: true, freeDetail: '10 Credits', proDetail: '100 Credits / Month' },
  { feature: 'AI Career Coach', freeIncluded: false, proIncluded: true, freeDetail: '-', proDetail: 'Included' },
  { feature: 'Interview Prep', freeIncluded: false, proIncluded: true, freeDetail: '-', proDetail: 'AI Mock Interviews' },
  { feature: 'Cover Letters', freeIncluded: false, proIncluded: true, freeDetail: '-', proDetail: 'AI Generated' },
  { feature: 'Resume ATS Reviews', freeIncluded: false, proIncluded: true, freeDetail: '-', proDetail: 'Included' },
  { feature: 'Salary Insights', freeIncluded: false, proIncluded: true, freeDetail: '-', proDetail: 'Full Analytics' },
  { feature: 'Job Alerts', freeIncluded: true, proIncluded: true, freeDetail: 'Basic', proDetail: 'Real-time' },
  { feature: 'Support', freeIncluded: true, proIncluded: true, freeDetail: 'Community', proDetail: 'Priority' },
]

const PRICING_FAQS = [
  { q: 'Is Glowminds free?', a: 'Yes. You can create a resume, search jobs, track applications, and receive 10 AI credits every month for free. No credit card required.' },
  { q: 'Why is Glowminds Pro so affordable?', a: "We're currently offering a founding member launch price of ₹599/year (regular ₹999/year) for students and early-career professionals." },
  { q: 'Do AI features have usage limits?', a: 'Yes. Free users receive 10 AI credits per month. Pro users receive 100 AI credits per month.' },
  { q: 'How do AI credits work?', a: 'Career Chat, Grammar Check, Paraphrasing and Profile Reviews cost 1 credit. Resume Reviews and Cover Letters cost 5 credits. Mock Interview Sessions cost 10 credits.' },
  { q: 'Can I cancel anytime?', a: "Yes. Cancel from your dashboard anytime. You'll retain Pro access until the end of your billing cycle." },
  { q: 'Is my resume data secure?', a: 'Yes. Your resumes and profile data are stored securely. Payments are processed through Razorpay and we never store payment details.' },
  { q: 'Do I need a credit card for the free plan?', a: 'No. The free plan requires no payment information.' },
  { q: 'Can working professionals use Glowminds?', a: 'Absolutely. Glowminds is ideal for students, fresh graduates, career switchers, and professionals with up to 5 years of experience.' },
]

const FREE_FEATURES = [
  { text: 'Job Search & Browse', included: true },
  { text: 'Profile & Portfolio', included: true },
  { text: '1 Resume', included: true },
  { text: '10 Application Tracks', included: true },
  { text: '10 AI Credits / Month', included: true },
  { text: 'Basic Job Alerts', included: true },
  { text: 'AI Career Coach', included: false },
  { text: 'AI Interview Prep', included: false },
  { text: 'AI Cover Letters', included: false },
  { text: 'Salary Insights', included: false },
]

const PRO_FEATURES = [
  { text: 'Everything in Free', included: true, highlight: false },
  { text: '100 AI Credits / Month', included: true, highlight: true },
  { text: 'AI Mock Interviews', included: true, highlight: true },
  { text: 'AI Cover Letters', included: true, highlight: true },
  { text: 'AI Career Coach Chat', included: true, highlight: true },
  { text: 'Resume ATS Reviews', included: true, highlight: true },
  { text: 'All 6 Resume Templates', included: true, highlight: false },
  { text: 'Unlimited Applications', included: true, highlight: false },
  { text: 'Unlimited Resumes', included: true, highlight: false },
  { text: 'Salary Insights & Analytics', included: true, highlight: false },
  { text: 'Real-time Job Alerts', included: true, highlight: false },
  { text: 'Priority Support', included: true, highlight: false },
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
  pricing: PRICING,
  pricingComparison: PRICING_COMPARISON,
  pricingFaqs: PRICING_FAQS,
  freeFeatures: FREE_FEATURES,
  proFeatures: PRO_FEATURES,
}
