/** Feature access rules aligned with pricingDefaults (free vs Pro). */

export const PRO_ONLY_CREDIT_FEATURES = new Set([
  "careerChat",
  "coverLetter",
  "interviewSession",
  "resumeReview",
]);

export const FREE_CREDIT_FEATURES = new Set([
  "grammar",
  "paraphrase",
  "profileReview",
]);

export const PRO_FEATURE_LABELS = {
  careerChat: "AI Career Coach",
  coverLetter: "AI Cover Letters",
  interviewSession: "AI Mock Interviews",
  resumeReview: "Resume ATS Review",
  topMatches: "Smart Job Matching",
  salaryInsights: "Salary Insights",
};
