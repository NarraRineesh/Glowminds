/** Default landing-page content synced to Firestore `config/landing`. */

export const DEFAULT_LANDING_CONFIG = {
  heroMetrics: [
    { value: "15", label: "Resume templates" },
    { value: "ATS", label: "Resume scoring" },
    { value: "1", label: "Dashboard for the whole search" },
  ],
  stats: {
    students: "Students & freshers",
    studentsFull: "students and early-career professionals",
    dailyJobs: "Live job board",
    matchRate: "Skill-ranked matches",
    companies: "Company catalog",
  },
  aboutMetrics: [
    { value: "15", label: "Resume templates" },
    { value: "ATS", label: "Resume scoring" },
    { value: "50+", label: "Job portals" },
    { value: "₹0", label: "Free to start" },
  ],
  socialProof: {
    signupBadge: "✦ FREE TO START",
    loginStudents: "Students & freshers",
    storyStudents: "students and early-career professionals",
    joinStudentsTitle: "Join students getting hired",
  },
  contactInfo: [
    {
      ico: "envelope",
      title: "Email Us",
      value: "hello@glowminds.in",
      desc: "We reply within 24 hours",
    },
    {
      ico: "map-pin",
      title: "Registered office",
      value: "Glowminds AI Technologies Private Limited",
      desc: "No. 472/7, Balaji Arcade AVS Compound, Koramangala VI Block, Bangalore 560095",
    },
    {
      ico: "chat",
      title: "Live Chat",
      value: "In-app Glow (Bot)",
      desc: "Available in the dashboard",
    },
  ],
};
