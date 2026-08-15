/** Client fallback when /config/feature-comparison is empty. */
export const DEFAULT_FEATURE_COMPARISON = {
  title: 'Plans Comparison',
  columns: [
    { id: '8f3a1c2e9b0d4e57', key: 'free', label: 'Free', planKey: 'free' },
    { id: '9a4b2d3f0c1e5f68', key: 'monthly', label: 'Monthly', planKey: 'monthly' },
    { id: '1d9e7b4a6c2f0835', key: 'yearly', label: 'Yearly', planKey: 'yearly' },
    { id: '2e0f8c5b7d301946', key: 'lifetime', label: 'Lifetime', planKey: 'lifetime' },
  ],
  rows: [
    { id: 'a01b2c3d4e5f6789', feature: 'Job Search', values: { free: 'Basic', monthly: 'Advanced + AI Matching', yearly: 'Advanced + AI Matching', lifetime: 'Advanced + AI Matching' } },
    { id: 'b12c3d4e5f6789a0', feature: 'Resume Builder', values: { free: '1 Resume', monthly: 'Unlimited Resumes', yearly: 'Unlimited Resumes', lifetime: 'Unlimited Resumes' } },
    { id: 'c23d4e5f6789a01b', feature: 'Application Tracker', values: { free: '10 Applications', monthly: 'Unlimited', yearly: 'Unlimited', lifetime: 'Unlimited' } },
    { id: 'd34e5f6789a01b2c', feature: 'AI Credits', values: { free: '10 / month', monthly: '100 / month', yearly: '100 / month', lifetime: '100 / month' } },
    { id: 'e45f6789a01b2c3d', feature: 'GLOWMINDS AI', values: { free: '—', monthly: 'Included', yearly: 'Included', lifetime: 'Included' } },
    { id: 'f56789a01b2c3d4e', feature: 'Interview Prep', values: { free: '—', monthly: 'AI Mock Interviews', yearly: 'AI Mock Interviews', lifetime: 'AI Mock Interviews' } },
    { id: '06789a01b2c3d4e5', feature: 'Cover Letters', values: { free: '—', monthly: 'AI Generated', yearly: 'AI Generated', lifetime: 'AI Generated' } },
    { id: '1789a01b2c3d4e5f', feature: 'Resume ATS & grammar review', values: { free: '—', monthly: 'Included', yearly: 'Included', lifetime: 'Included' } },
    { id: '289a01b2c3d4e5f6', feature: 'Salary Insights', values: { free: '—', monthly: 'Full Analytics', yearly: 'Full Analytics', lifetime: 'Full Analytics' } },
    { id: '39a01b2c3d4e5f67', feature: 'Job Alerts', values: { free: 'Basic', monthly: 'Real-time', yearly: 'Real-time', lifetime: 'Real-time' } },
    { id: '4a01b2c3d4e5f678', feature: 'Support', values: { free: 'Community', monthly: 'Priority', yearly: 'Priority', lifetime: 'Priority' } },
  ],
}
