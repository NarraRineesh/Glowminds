/** Feature access rules aligned with pricingDefaults + requirePro() on routes. */

export const PRO_ONLY_CREDIT_FEATURES = new Set([
  "careerChat",
  "coverLetter",
  "interviewSession",
  "resumeReview",
  "jobFit",
  "salaryNegotiate",
]);

export const FREE_CREDIT_FEATURES = new Set([
  "grammar",
  "paraphrase",
  "profileReview",
  "linkedinAudit",
  "learningPath",
]);

export const PRO_FEATURE_LABELS = {
  careerChat: "Glow (Bot)",
  coverLetter: "AI Cover Letters",
  interviewSession: "AI Mock Interviews",
  resumeReview: "Resume ATS Review",
  jobFit: "AI Job Fit",
  salaryNegotiate: "Salary Negotiation Script",
  topMatches: "Smart Job Matching",
  salaryInsights: "Salary Insights",
  learningPath: "AI Learning Path",
};
