// Pool of daily quiz questions — rotates by date so every user sees the same Q each day.
// Mix of aptitude / job-search / behavioral / tech basics. Replace with API-fetched set later.

const QUIZ_POOL = [
  {
    id: 'q-ats-1',
    category: 'Resume',
    question: 'Which resume format ranks highest for ATS (Applicant Tracking Systems)?',
    options: ['Creative two-column PDF', 'Single-column reverse-chronological', 'Functional skills-first', 'Infographic'],
    correct: 1,
    xp: 10,
    explanation: 'Single-column reverse-chronological is parsed reliably by every ATS and is the safest format for keyword extraction.',
  },
  {
    id: 'q-recruit-1',
    category: 'Job Search',
    question: 'On average, how many seconds does a recruiter spend on a first resume scan?',
    options: ['2–3 seconds', '6–8 seconds', '20–30 seconds', '60+ seconds'],
    correct: 1,
    xp: 10,
    explanation: 'Studies (Ladders, 2018+) consistently show 6–8 seconds for the first scan. Lead with impact.',
  },
  {
    id: 'q-star-1',
    category: 'Interview',
    question: 'In the STAR method for behavioral answers, what does the "R" stand for?',
    options: ['Reason', 'Result', 'Reflection', 'Resilience'],
    correct: 1,
    xp: 10,
    explanation: 'Situation → Task → Action → Result. Quantify the Result whenever possible.',
  },
  {
    id: 'q-salary-1',
    category: 'Negotiation',
    question: 'What is the most effective response when asked "What\'s your expected salary?" in a first interview?',
    options: [
      'Give a single specific number',
      'Say "negotiable"',
      'Provide a researched range based on market data',
      'Refuse to answer',
    ],
    correct: 2,
    xp: 15,
    explanation: 'A researched range (with the lower bound being your true target) anchors the conversation without pricing you out.',
  },
  {
    id: 'q-linkedin-1',
    category: 'LinkedIn',
    question: 'Which LinkedIn element has the biggest impact on appearing in recruiter searches?',
    options: ['Banner image', 'Headline keywords', 'Number of connections', 'Posts published'],
    correct: 1,
    xp: 10,
    explanation: 'Your headline (and About section) drives recruiter search — pack it with role-specific keywords.',
  },
  {
    id: 'q-tech-1',
    category: 'Tech',
    question: 'Big-O of accessing an element by index in a JavaScript array?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    correct: 2,
    xp: 10,
    explanation: 'Array index access is constant-time O(1). Searching unsorted arrays is O(n).',
  },
  {
    id: 'q-followup-1',
    category: 'Job Search',
    question: 'When is the best time to follow up after submitting a job application?',
    options: ['Same day', 'Within 24 hours', '5–7 business days later', 'Never — wait for them'],
    correct: 2,
    xp: 10,
    explanation: '5–7 business days is the sweet spot — long enough to be screened, short enough to stay top-of-mind.',
  },
  {
    id: 'q-cover-1',
    category: 'Cover Letter',
    question: 'A great cover letter should…',
    options: [
      'Repeat your resume in paragraph form',
      'Open with "I am writing to apply for…"',
      'Tell a focused story tying you to the role',
      'List every skill you have',
    ],
    correct: 2,
    xp: 10,
    explanation: 'Recruiters skim. A focused story (1 problem → your action → result) beats restating the resume.',
  },
]

export function getDailyQuestion(date = new Date()) {
  // Stable index based on local YYYY-MM-DD
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return QUIZ_POOL[h % QUIZ_POOL.length]
}

export function getTodayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
