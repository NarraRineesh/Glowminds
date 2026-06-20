/** Default landing-page content synced to Firestore `config/landing`. */

export const DEFAULT_LANDING_CONFIG = {
  heroMetrics: [
    { value: "5,000+", label: "Resumes Created" },
    { value: "2,000+", label: "Cover Letters Generated" },
    { value: "1,200+", label: "Interviews Practiced" },
  ],
  stats: {
    students: "52K+",
    studentsFull: "52,000+",
    dailyJobs: "12K+",
    matchRate: "94%",
    companies: "500+",
  },
  aboutMetrics: [
    { value: "52K+", label: "Students" },
    { value: "12K+", label: "Daily Jobs" },
    { value: "94%", label: "Match Rate" },
    { value: "500+", label: "Companies" },
  ],
  socialProof: {
    signupBadge: "✦ JOIN 52,000+ STUDENTS",
    loginStudents: "52,000+ students",
    storyStudents: "52,000+ students",
    joinStudentsTitle: "Join 52,000+ Students",
  },
  contactInfo: [
    {
      ico: "envelope",
      title: "Email Us",
      value: "hello@glowminds.in",
      desc: "We reply within 24 hours",
    },
    {
      ico: "phone",
      title: "Call Us",
      value: "+91 98765 43210",
      desc: "Mon-Fri, 9 AM - 6 PM IST",
    },
    {
      ico: "map-pin",
      title: "Visit Us",
      value: "Bangalore, India",
      desc: "HSR Layout, Sector 1",
    },
  ],
};
