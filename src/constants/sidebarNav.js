// Canonical dashboard sidebar layout. Edit here to add/move items —
// DashboardSidebar consumes this directly.
//
// Each group can be either always-expanded (no `collapsibleId`) or
// collapsible (set `collapsibleId` to a unique key persisted in
// localStorage["gm_sidebar_groups"]).

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
      { path: '/dashboard/salary', icon: 'salary', label: 'Salary Insights' },
    ],
  },
  {
    label: 'Practice',
    collapsibleId: 'practice',
    defaultOpen: true,
    items: [
      { path: '/dashboard/interview', icon: 'interview', label: 'Interview Prep' },
    ],
  },
  {
    label: 'AI Tools',
    collapsibleId: 'ai-tools',
    defaultOpen: true,
    items: [
      { path: '/dashboard/ai', icon: 'ai', label: 'AI Coach' },
      { path: '/dashboard/cover-letters', icon: 'cover-letters', label: 'Cover Letters' },
      { path: '/dashboard/linkedin', icon: 'linkedin', label: 'LinkedIn Optimizer' },
      { path: '/dashboard/grammar-check', icon: 'grammar-check', label: 'Grammar Check' },
      { path: '/dashboard/paraphrase', icon: 'paraphrase', label: 'Paraphrasing Tool' },
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
