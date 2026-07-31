/** Screen registry for /design wireframes + mocks */
export const DESIGN_SCREENS = [
  { id: 'dashboard', title: 'Dashboard', group: 'Core' },
  { id: 'ats-report', title: 'ATS Report', group: 'Job search' },
  { id: 'portfolio-builder', title: 'Portfolio Builder', group: 'Profile' },
  { id: 'public-profile', title: 'Public Portfolio', group: 'Profile' },
  { id: 'linkedin-hub', title: 'LinkedIn Hub', group: 'Grow' },
  { id: 'linkedin-audit', title: 'LinkedIn Audit', group: 'Grow' },
  { id: 'linkedin-rewrite', title: 'LinkedIn Rewrite', group: 'Grow' },
  { id: 'vault', title: 'Document Center', group: 'Files' },
  { id: 'job-explorer', title: 'Job Explorer', group: 'Job search' },
  { id: 'job-details', title: 'Job Details', group: 'Job search' },
  { id: 'applications', title: 'Application CRM', group: 'Job search' },
  { id: 'salary', title: 'Salary Insights', group: 'Job search' },
  { id: 'skills', title: 'Skills Intelligence', group: 'Grow' },
  { id: 'learning', title: 'Learning Center', group: 'Grow' },
  { id: 'interview', title: 'Interview Simulator', group: 'Grow' },
  { id: 'ai-coach', title: 'Career Copilot', group: 'Grow' },
  { id: 'analytics', title: 'Career Intelligence', group: 'Insights' },
  { id: 'cover-letter', title: 'Cover Letter Generator', group: 'Write' },
  { id: 'grammar', title: 'Grammar Checker', group: 'Write' },
  { id: 'paraphrase', title: 'Rewrite', group: 'Write' },
  { id: 'settings', title: 'Settings', group: 'System' },
  { id: 'notifications', title: 'Notifications', group: 'System' },
  { id: 'career-timeline', title: 'Career Timeline', group: 'Insights' },
]

export const NAV_GROUPS = [
  {
    label: 'Job search',
    items: [
      { id: 'job-explorer', label: 'Jobs' },
      { id: 'ats-report', label: 'Resume' },
      { id: 'applications', label: 'Applications' },
      { id: 'salary', label: 'Salary' },
    ],
  },
  {
    label: 'Grow',
    items: [
      { id: 'skills', label: 'Skills' },
      { id: 'learning', label: 'Learning' },
      { id: 'interview', label: 'Interview' },
      { id: 'linkedin-hub', label: 'LinkedIn Hub' },
      { id: 'ai-coach', label: 'Copilot' },
    ],
  },
  {
    label: 'Write',
    items: [
      { id: 'cover-letter', label: 'Cover Letters' },
      { id: 'grammar', label: 'Grammar' },
      { id: 'paraphrase', label: 'Rewrite' },
    ],
  },
  {
    label: 'Files',
    items: [
      { id: 'vault', label: 'Vault' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'career-timeline', label: 'Timeline' },
    ],
  },
]

export function getScreen(id) {
  return DESIGN_SCREENS.find((s) => s.id === id) || null
}
