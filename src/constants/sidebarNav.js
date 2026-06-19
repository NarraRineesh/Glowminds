// Canonical dashboard sidebar layout. Edit here to add/move items —
// DashboardSidebar consumes this directly.
//
// Each group can be either always-expanded (no `collapsibleId`) or
// collapsible (set `collapsibleId` to a unique key persisted in
// localStorage["gm_sidebar_groups"]).
//
// `proOnly` items show a lock icon for free users; hover explains the feature.

export const SIDEBAR_TOP_ITEMS = [
  { path: '/dashboard', end: true, icon: 'dashboard', label: 'Dashboard' },
]

export const SIDEBAR_GROUPS = [
  {
    label: 'Job Search',
    collapsibleId: 'job-search',
    defaultOpen: true,
    items: [
      { path: '/dashboard/resume', icon: 'resume', label: 'Resume Builder' },
      { path: '/dashboard/jobs', icon: 'jobs', label: 'Job Board' },
      { path: '/dashboard/applications', icon: 'applications', label: 'Application Tracker' },
      {
        path: '/dashboard/salary',
        icon: 'salary',
        label: 'Salary Insights',
        proOnly: true,
        proHint: 'Role-based salary ranges and negotiation tips for India.',
      },
    ],
  },
  {
    label: 'Practice',
    collapsibleId: 'practice',
    defaultOpen: true,
    items: [
      {
        path: '/dashboard/interview',
        icon: 'interview',
        label: 'Interview Prep',
        proOnly: true,
        creditAction: 'interviewSession',
        proHint: 'AI mock interviews with MCQs, scoring, and study plans.',
      },
    ],
  },
  {
    label: 'AI Tools',
    collapsibleId: 'ai-tools',
    defaultOpen: true,
    items: [
      {
        path: '/dashboard/ai',
        icon: 'ai',
        label: 'AI Coach',
        proOnly: true,
        creditAction: 'careerChat',
        proHint: '24/7 personalized career coaching for students and freshers.',
      },
      {
        path: '/dashboard/cover-letters',
        icon: 'cover-letters',
        label: 'Cover Letters',
        proOnly: true,
        creditAction: 'coverLetter',
        proHint: 'AI cover letters tailored to each role and company.',
      },
      {
        path: '/dashboard/linkedin',
        icon: 'linkedin',
        label: 'LinkedIn Optimizer',
        proOnly: true,
        proHint: 'Profile audit checklist to improve recruiter visibility.',
      },
      {
        path: '/dashboard/grammar-check',
        icon: 'grammar-check',
        label: 'Grammar Check',
        proOnly: true,
        creditAction: 'grammar',
        proHint: 'Fix grammar, tone, and clarity in your career documents.',
      },
      {
        path: '/dashboard/paraphrase',
        icon: 'paraphrase',
        label: 'Paraphrasing Tool',
        proOnly: true,
        creditAction: 'paraphrase',
        proHint: 'Rewrite bullets and paragraphs in different tones instantly.',
      },
    ],
  },
  // Admin-only group. DashboardSidebar filters it out unless the user has
  // the `admin: true` custom claim (surfaced as user.isAdmin).
  {
    label: 'Admin',
    requiresAdmin: true,
    items: [
      { path: '/dashboard/admin', icon: 'admin', label: 'Admin Console', requiresAdmin: true },
    ],
  },
]

export const SIDEBAR_GROUPS_STORAGE_KEY = 'gm_sidebar_groups'
