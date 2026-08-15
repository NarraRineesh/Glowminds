// Canonical dashboard sidebar layout — Career OS IA.
export const SIDEBAR_TOP_ITEMS = [
  { path: '/dashboard', end: true, icon: 'dashboard', label: 'Dashboard' },
]

export const SIDEBAR_GROUPS = [
  {
    label: 'Job search',
    collapsibleId: 'job-search',
    defaultOpen: true,
    items: [
      { path: '/dashboard/jobs', icon: 'jobs', label: 'Jobs' },
      { path: '/dashboard/resume', icon: 'resume', label: 'Resume' },
      { path: '/dashboard/applications', icon: 'applications', label: 'Applications' },
      { path: '/dashboard/salary', icon: 'salary', label: 'Salary' },
    ],
  },
  {
    label: 'Grow',
    collapsibleId: 'grow',
    defaultOpen: true,
    items: [
      { path: '/dashboard/skills', icon: 'puzzle', label: 'Skills' },
      { path: '/dashboard/learning', icon: 'graduation', label: 'Learning' },
      { path: '/dashboard/interview', icon: 'interview', label: 'Interview' },
      { path: '/dashboard/linkedin', icon: 'linkedin', label: 'LinkedIn Hub' },
      { path: '/dashboard/ai', icon: 'ai', label: 'Glow (Bot)' },
    ],
  },
  {
    label: 'Write',
    collapsibleId: 'write',
    defaultOpen: false,
    items: [
      { path: '/dashboard/cover-letters', icon: 'cover-letters', label: 'Cover Letters' },
      { path: '/dashboard/grammar-check', icon: 'grammar-check', label: 'Grammar' },
      { path: '/dashboard/paraphrase', icon: 'paraphrase', label: 'Rewrite' },
    ],
  },
  {
    label: 'Files',
    collapsibleId: 'files',
    defaultOpen: false,
    items: [
      { path: '/dashboard/vault', icon: 'folder', label: 'Vault' },
    ],
  },
  {
    label: 'Insights',
    collapsibleId: 'insights',
    defaultOpen: false,
    items: [
      { path: '/dashboard/analytics', icon: 'chart', label: 'Analytics' },
      { path: '/dashboard/timeline', icon: 'clock', label: 'Timeline' },
    ],
  },
]

/** Bump when group ids change so open/closed prefs don't leak across IA. */
export const SIDEBAR_GROUPS_STORAGE_KEY = 'gm_sidebar_groups_v7'
