const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Swiggy', 'Razorpay', 'Infosys', 'TCS', 'Zoho', 'Freshworks', 'PhonePe', 'CRED', 'Meesho', 'Groww']

const FEATURES = [
  {
    badge: 'AI RESUME BUILDER', badgeBg: 'rgba(56,139,253,.08)', badgeColor: 'var(--color-blu)',
    title: 'Build Resumes That Actually Get Past ATS',
    desc: 'Stop getting auto-rejected. Our Gemini-powered AI analyzes job descriptions, identifies critical keywords, and builds perfectly formatted resumes that score 90+ on ATS systems. Upload an existing resume to enhance it, or start from scratch with 6 professional templates and real-time scoring.',
    bullets: ['ATS compatibility tested against 200+ systems', 'Upload existing resume — AI enhances it instantly', '6 professional templates with live preview & PDF export', 'Smart keyword optimization matched to job descriptions'],
    image: '/mockups/resume-builder.svg',
  },
  {
    badge: 'SMART JOB MATCHING', badgeBg: 'rgba(63,185,80,.08)', badgeColor: 'var(--color-grn)',
    title: 'Stop Scrolling. Start Getting Matched.',
    desc: 'Our AI scans 50+ job portals every hour — Naukri, LinkedIn, Internshala, AngelList, and more — then ranks every opportunity against your skills, experience, and preferences. 94% of our matches result in relevant applications. Filter by remote/hybrid/on-site, salary range, or company size.',
    bullets: ['50+ portals scanned automatically every hour', '94% match accuracy — only relevant jobs, zero noise', 'Filter by location, salary, remote/hybrid/on-site', 'Real-time alerts when dream jobs appear'],
    image: '/mockups/job-matching.svg', reverse: true,
  },
  {
    badge: 'AI CAREER COACH', badgeBg: 'rgba(210,153,34,.08)', badgeColor: 'var(--color-gold)',
    title: 'Your Personal Career Strategist, Available 24/7',
    desc: 'Powered by Gemini AI and trained on career coaching best practices, our AI Coach gives expert-level advice on resume writing, interview preparation, salary negotiation, career pivots, and cold outreach. It remembers your conversation context across sessions — like having a career mentor in your pocket.',
    bullets: ['Multi-turn conversations — remembers your context', 'STAR method coaching for behavioral interviews', 'Salary negotiation scripts tailored to your offer', 'Cold outreach templates for recruiters & hiring managers'],
    image: '/mockups/ai-coach.svg',
  },
  {
    badge: 'INTERVIEW PREP', badgeBg: 'rgba(188,140,255,.08)', badgeColor: 'var(--color-prp)',
    title: 'Walk Into Every Interview With Confidence',
    desc: 'Practice with AI-generated questions tailored to your target role, get instant STAR-method feedback, and track your improvement over time. Choose from 12 role categories including Software Engineer, Data Analyst, Product Manager, and more.',
    bullets: ['Technical, behavioral & HR questions — 12 role categories', 'Real-time answer evaluation with scores (1-10)', 'STAR breakdown for behavioral answers', 'Session summaries with strengths & areas to improve'],
    image: '/mockups/interview-prep.svg', reverse: true,
  },
  {
    badge: 'APPLICATION TRACKER', badgeBg: 'rgba(248,117,186,.08)', badgeColor: '#f875ba',
    title: 'Never Lose Track of an Application Again',
    desc: 'Replace messy spreadsheets with a visual Kanban board. Drag applications between stages — Applied, Shortlisted, Interview, Offered — and see your entire job search pipeline at a glance. Set follow-up reminders so you never miss a deadline.',
    bullets: ['Visual Kanban board with drag-and-drop', 'Auto-reminders for follow-ups and deadlines', 'Application timeline and status history', 'One-click status updates from any device'],
    image: '/mockups/app-tracker.svg',
  },
  {
    badge: 'COVER LETTER GENERATOR', badgeBg: 'rgba(6,182,212,.08)', badgeColor: '#06b6d4',
    title: 'Tailored Cover Letters in 30 Seconds',
    desc: 'Paste a job description and our AI generates a personalized cover letter that highlights your most relevant skills and experience. It pulls from your resume data, matches the job requirements, and creates compelling narratives — ready to send or customize further.',
    bullets: ['Job-description-aware — matches role requirements', 'Auto-pulls skills from your resume profile', 'Multiple tone options — enthusiastic, professional, concise', 'Export as PDF or copy to clipboard instantly'],
    image: '/mockups/cover-letter.svg', reverse: true,
  },
  {
    badge: 'AI GRAMMAR CHECKER', badgeBg: 'rgba(20,184,166,.08)', badgeColor: '#14b8a6',
    title: 'Perfect Every Word Before You Hit Send',
    desc: 'Typos on a resume? Awkward phrasing in a cover letter? Our AI grammar checker catches errors, improves tone, and boosts readability across all your career documents. Choose between formal, confident, or friendly tones — and sound exactly as professional as you want.',
    bullets: ['Resume & cover letter grammar optimization', 'Tone adjustment — formal, confident, or friendly', 'Clarity & readability scoring with suggestions', 'One-click fix — accept all corrections instantly'],
    image: '/mockups/grammar-checker.svg',
  },
]

const STEPS = [
  { num: '01', ico: '📝', title: 'Create Your Profile', desc: 'Sign up in 30 seconds. Add your skills, education, experience, and job preferences — our AI does the rest.' },
  { num: '02', ico: '📄', title: 'Build Your Resume', desc: 'AI generates an ATS-optimized resume in minutes. Pick a template, get a real-time score, and export as PDF.' },
  { num: '03', ico: '🎯', title: 'Get Matched & Apply', desc: 'We scan 50+ portals daily, rank jobs by your match score, and let you apply with a single click.' },
  { num: '04', ico: '🎉', title: 'Land Your Dream Job', desc: 'Prep with AI mock interviews, track apps on your Kanban board, and celebrate when offers start rolling in!' },
]

const TOOLS = [
  { ico: '📄', title: 'Resume Builder', desc: 'ATS-optimized resumes with 6 templates, live preview, and one-click PDF export.', bg: 'var(--color-blu3)' },
  { ico: '🎯', title: 'Job Matching', desc: 'AI scans 50+ portals hourly and ranks jobs by your personal skill match score.', bg: 'var(--color-grn2)' },
  { ico: '🤖', title: 'AI Career Coach', desc: '24/7 career coaching with context memory — resumes, interviews, salary, and more.', bg: 'var(--color-gold2)' },
  { ico: '🎤', title: 'Interview Prep', desc: 'Practice with AI questions across 12 roles. Get scored on clarity, structure & impact.', bg: 'var(--color-prp2)' },
  { ico: '📊', title: 'App Tracker', desc: 'Visual Kanban board to track every application from applied to offer letter.', bg: 'rgba(248,117,186,.1)' },
  { ico: '✍️', title: 'Grammar Checker', desc: 'Fix grammar, tone & clarity in resumes, cover letters, emails, and SOPs.', bg: 'rgba(20,184,166,.08)' },
  { ico: '💌', title: 'Cover Letter Gen', desc: 'AI writes tailored cover letters from job descriptions in under 30 seconds.', bg: 'rgba(6,182,212,.08)' },
  { ico: '🔗', title: 'LinkedIn Optimizer', desc: 'Optimize your headline, summary & skills for maximum recruiter visibility.', bg: 'rgba(56,139,253,.08)' },
  { ico: '✉️', title: 'Cold Email Drafter', desc: 'Craft professional outreach emails to recruiters and hiring managers.', bg: 'rgba(244,114,182,.08)' },
  { ico: '📝', title: 'Essay & SOP Writer', desc: 'Generate structured essays, SOPs, and personal statements for admissions.', bg: 'rgba(168,85,247,.08)' },
  { ico: '📅', title: 'Study Planner', desc: 'AI builds personalized study schedules based on your skill gaps and goals.', bg: 'rgba(34,197,94,.08)' },
  { ico: '💻', title: 'Code Reviewer', desc: 'Get AI feedback on code quality, bugs, performance, and best practices.', bg: 'rgba(251,146,60,.08)' },
]

const TESTIMONIALS = [
  { name: 'Aditi Verma', role: 'SDE Intern @ Google', avatar: '👩‍💻', text: 'Glowminds matched me with my dream internship. The AI resume builder got me a 96 ATS score — I got 3 interview calls in the first week!' },
  { name: 'Rahul Gupta', role: 'Frontend Dev @ Swiggy', avatar: '👨‍💻', text: 'The AI career coach helped me prepare for 3 rounds of interviews. Got the offer in 2 weeks. This platform is a game-changer for freshers.' },
  { name: 'Karthik R', role: 'Full Stack @ Razorpay', avatar: '🧑‍💻', text: 'Best platform for freshers. Period. The job matching accuracy is insane — 94% relevant. Saved me hours of scrolling through job boards.' },
]

const TRUST_LOGOS = ['IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'VIT', 'SRM', 'Manipal', 'IIIT Hyderabad', 'DTU', 'NSUT', 'PES University', 'Amity']

const FAQS = [
  { q: 'Is Glowminds free to use?', a: 'Yes! Glowminds offers a generous free tier with job search, 1 resume, and 5 app tracking slots. Our Pro plan unlocks everything — AI Coach, Interview Prep, unlimited resumes — for just ₹49/month or ₹399/year (save 32%).' },
  { q: 'How does the AI job matching work?', a: 'Our AI scans 50+ job portals daily and compares requirements with your skills, education, and preferences to generate a personalized match score from 0-100%.' },
  { q: 'What makes the resume builder ATS-optimized?', a: 'We follow industry-standard ATS formatting rules — clean structure, keyword optimization, proper headings, machine-readable layouts, and we check against 200+ ATS systems.' },
  { q: 'Can I use this if I\'m not a student?', a: 'Absolutely! While optimized for students and fresh graduates, anyone early in their career or looking to switch can benefit from our tools.' },
  { q: 'How does the Grammar Checker work?', a: 'Paste any text — resume bullets, cover letter paragraphs, emails — and our Gemini-powered AI checks grammar, spelling, tone, and clarity. You can choose formal, confident, or friendly tone and accept fixes with one click.' },
  { q: 'Can I generate cover letters for any job?', a: 'Yes! Just paste the job description and our AI matches your resume data to the role requirements, generating a personalized cover letter in seconds. You can adjust the tone and export as PDF.' },
]

const STATS = {
  students: '52K+',
  dailyJobs: '12K+',
  matchRate: '94%',
  rating: '4.9★'
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
    desc: 'Perfect for getting started with job hunting.',
    features: ['Job search & matching', '1 resume template', '5 application tracking slots', 'Basic AI suggestions', 'Grammar check (5/day)'],
  },
  pro: {
    label: 'PRO',
    price: '₹399',
    period: '/year',
    desc: 'Everything you need to land your dream job.',
    features: ['Unlimited resumes & templates', 'AI Career Coach 24/7', 'Interview Prep with scoring', 'Unlimited application tracking', 'Grammar Checker unlimited', 'Cover Letter Generator', 'LinkedIn Optimizer & Cold Email Drafter', 'Priority job alerts & salary insights'],
  }
}

const PRICING_COMPARISON = [
  { feature: 'Job Search', free: 'Basic', pro: 'Advanced + AI' },
  { feature: 'Resume Builder', free: '1 template', pro: '6 templates' },
  { feature: 'Application Tracker', free: '5 apps', pro: 'Unlimited' },
  { feature: 'AI Career Coach', free: '—', pro: '24/7 access' },
  { feature: 'Interview Prep', free: '—', pro: 'AI evaluator' },
  { feature: 'Cover Letters', free: '—', pro: 'AI generated' },
  { feature: 'Salary Insights', free: '—', pro: 'Full data' },
  { feature: 'Job Alerts', free: 'Daily digest', pro: 'Real-time' },
  { feature: 'Support', free: 'Community', pro: 'Priority' },
]

const PRICING_FAQS = [
  { q: 'What does the yearly plan include?', a: 'The Pro yearly plan gives you unlimited access to every feature — AI Career Coach, Interview Prep, all resume templates, cover letter generator, salary insights, and priority support. One payment, 12 months of full access.' },
  { q: 'Can I cancel anytime?', a: 'Yes. You can cancel your subscription at any time from your dashboard. You\'ll continue to have Pro access until the end of your billing period. No questions asked.' },
  { q: 'Is there a free trial?', a: 'We offer a generous free tier instead of a trial. You can use core features forever — job search, 1 resume, and 5 application tracking slots. Upgrade to Pro when you\'re ready.' },
  { q: 'How does payment work?', a: 'We use Razorpay for secure payments. You can pay with UPI, credit/debit card, net banking, or wallets. Your payment information is encrypted end-to-end.' },
  { q: 'Can I use this as a non-student?', a: 'Absolutely. While Glowminds is optimized for students and fresh graduates, anyone early in their career or looking to switch roles can benefit from our tools.' },
]

const FREE_FEATURES = [
  { text: 'Job Search & Browse', included: true },
  { text: 'Profile & Portfolio', included: true },
  { text: '1 Resume Template', included: true },
  { text: '5 Application Tracking', included: true },
  { text: 'Basic Job Alerts', included: true },
  { text: 'AI Career Coach', included: false },
  { text: 'Interview Prep AI', included: false },
  { text: 'Cover Letter Generator', included: false },
  { text: 'All Resume Templates', included: false },
  { text: 'Unlimited Tracking', included: false },
  { text: 'Salary Insights', included: false },
  { text: 'Priority Support', included: false },
]

const PRO_FEATURES = [
  { text: 'Everything in Free', included: true, highlight: false },
  { text: 'AI Career Coach (24/7)', included: true, highlight: true },
  { text: 'AI Interview Prep', included: true, highlight: true },
  { text: 'All 6 Resume Templates', included: true, highlight: false },
  { text: 'Cover Letter Generator', included: true, highlight: true },
  { text: 'Unlimited Applications', included: true, highlight: false },
  { text: 'Unlimited Resumes', included: true, highlight: false },
  { text: 'Salary Insights & Analytics', included: true, highlight: false },
  { text: 'Skill Gap Analysis', included: true, highlight: true },
  { text: 'Real-time Job Alerts', included: true, highlight: false },
  { text: '1-Click Apply', included: true, highlight: false },
  { text: 'Priority Support', included: true, highlight: false },
]

export const DEFAULT_LANDING_CONTENT = {
  companies: COMPANIES,
  features: FEATURES,
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
