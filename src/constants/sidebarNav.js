// Canonical dashboard sidebar layout. Edit here to add/move items —
// DashboardSidebar consumes this directly.
//
// Each group can be either always-expanded (no `collapsibleId`) or
// collapsible (set `collapsibleId` to a unique key persisted in
// localStorage["gm_sidebar_groups"]).

export const SIDEBAR_GROUPS = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', end: true, icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    label: 'Job Search',
    items: [
      { path: '/dashboard/resume', icon: '📄', label: 'Resume Builder' },
      { path: '/dashboard/jobs', icon: '💼', label: 'Job Board' },
      { path: '/dashboard/applications', icon: '📋', label: 'Application Tracker' },
      { path: '/dashboard/salary', icon: '💰', label: 'Salary Insights' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { path: '/dashboard/interview', icon: '📚', label: 'Interview Prep' },
    ],
  },
  {
    label: 'AI Tools',
    collapsibleId: 'ai-tools',
    defaultOpen: true,
    items: [
      { path: '/dashboard/ai', icon: '🧭', label: 'AI Coach' },
      { path: '/dashboard/cover-letters', icon: '✉️', label: 'Cover Letters' },
      { path: '/dashboard/linkedin', icon: '🔗', label: 'LinkedIn Optimizer' },
      { path: '/dashboard/grammar-check', icon: '✍️', label: 'Grammar Check' },
      { path: '/dashboard/paraphrase', icon: '🔁', label: 'Paraphrasing Tool' },
    ],
  },
  // Admin-only group. DashboardSidebar filters it out unless the user has
  // the `admin: true` custom claim (surfaced as user.isAdmin).
  {
    label: 'Admin',
    requiresAdmin: true,
    items: [
      { path: '/dashboard/admin', icon: '🛡️', label: 'Admin Console', requiresAdmin: true },
    ],
  },
]

export const SIDEBAR_FOOTER_NAV = [
  { path: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
]

export const SIDEBAR_GROUPS_STORAGE_KEY = 'gm_sidebar_groups'
