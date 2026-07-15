/** Default pricing config — seeded to Firestore `config/pricing` on first read. */

export const DEFAULT_PRICING_CONFIG = {
  currency: "INR",
  currencySymbol: "₹",

  plans: {
    yearly: {
      id: "yearly",
      label: "Glowminds Pro Yearly",
      displayPrice: "₹599",
      regularPrice: "₹999",
      period: "/year",
      amountPaise: 59900,
      durationDays: 365,
    },

    monthly: {
      id: "monthly",
      label: "Glowminds Pro Monthly",
      displayPrice: "₹99",
      period: "/month",
      amountPaise: 9900,
      durationDays: 30,
    },
  },

  freeLimits: {
    applications: 10,
    resumes: 1,
    aiCredits: 10,
    template: "onyx",
  },

  proLimits: {
    applications: -1,
    resumes: -1,
    aiCreditsPerMonth: 100,
  },

  creditCosts: {
    careerChat: 1,
    coverLetter: 5,
    interviewSession: 10,
    profileReview: 1,
    resumeReview: 5,
    grammar: 1,
    paraphrase: 1,
    linkedinAudit: 2,
    jobFit: 3,
    salaryNegotiate: 2,
    learningPath: 3,
  },

  pricing: {
    free: {
      label: "FREE",
      price: "₹0",
      period: "/forever",
      desc: "Perfect for getting started with job hunting.",
      features: [
        "Job search & matching",
        "1 ATS resume",
        "Track up to 10 applications",
        "10 AI credits/month",
        "Basic job alerts",
        "Profile & portfolio",
      ],
    },

    pro: {
      label: "PRO",
      price: "₹599",
      regularPrice: "₹999",
      period: "/year",
      desc: "Everything you need to land your dream job.",
      highlights: [
        "100 AI Credits / Month",
        "AI Mock Interviews",
        "AI Cover Letters",
        "AI Career Coach",
        "Smart Job Matching",
      ],
      features: [
        "Unlimited resumes",
        "Unlimited application tracking",
        "100 AI credits every month",
        "AI Mock Interviews",
        "AI Cover Letters",
        "AI Career Coach Chat",
        "Resume ATS Reviews",
        "All 6 premium templates",
        "Salary insights & analytics",
        "Real-time job alerts",
        "Priority support",
      ],
    },
  },

  freeFeatures: [
    { text: "Job Search & Browse", included: true },
    { text: "Profile & Portfolio", included: true },
    { text: "1 Resume", included: true },
    { text: "10 Application Tracks", included: true },
    { text: "10 AI Credits / Month", included: true },
    { text: "Basic Job Alerts", included: true },
    { text: "AI Career Coach", included: false },
    { text: "AI Interview Prep", included: false },
    { text: "AI Cover Letters", included: false },
    { text: "Salary Insights", included: false },
  ],

  proFeatures: [
    {
      text: "Everything in Free",
      included: true,
      highlight: false,
    },
    {
      text: "100 AI Credits / Month",
      included: true,
      highlight: true,
    },
    {
      text: "AI Mock Interviews",
      included: true,
      highlight: true,
    },
    {
      text: "AI Cover Letters",
      included: true,
      highlight: true,
    },
    {
      text: "AI Career Coach Chat",
      included: true,
      highlight: true,
    },
    {
      text: "Resume ATS Reviews",
      included: true,
      highlight: true,
    },
    {
      text: "Unlimited Applications",
      included: true,
      highlight: false,
    },
    {
      text: "Unlimited Resumes",
      included: true,
      highlight: false,
    },
    {
      text: "All 6 Resume Templates",
      included: true,
      highlight: false,
    },
    {
      text: "Salary Insights & Analytics",
      included: true,
      highlight: false,
    },
    {
      text: "Real-time Job Alerts",
      included: true,
      highlight: false,
    },
    {
      text: "Priority Support",
      included: true,
      highlight: false,
    },
  ],

  pricingComparison: [
    {
      feature: "Job Search",
      freeIncluded: true,
      proIncluded: true,
      freeDetail: "Basic",
      proDetail: "Advanced + AI Matching",
    },
    {
      feature: "Resume Builder",
      freeIncluded: true,
      proIncluded: true,
      freeDetail: "1 Resume",
      proDetail: "Unlimited Resumes",
    },
    {
      feature: "Application Tracker",
      freeIncluded: true,
      proIncluded: true,
      freeDetail: "10 Applications",
      proDetail: "Unlimited",
    },
    {
      feature: "AI Credits",
      freeIncluded: true,
      proIncluded: true,
      freeDetail: "10 Credits",
      proDetail: "100 Credits / Month",
    },
    {
      feature: "AI Career Coach",
      freeIncluded: false,
      proIncluded: true,
      freeDetail: "-",
      proDetail: "Included",
    },
    {
      feature: "Interview Prep",
      freeIncluded: false,
      proIncluded: true,
      freeDetail: "-",
      proDetail: "AI Mock Interviews",
    },
    {
      feature: "Cover Letters",
      freeIncluded: false,
      proIncluded: true,
      freeDetail: "-",
      proDetail: "AI Generated",
    },
    {
      feature: "Resume ATS Reviews",
      freeIncluded: false,
      proIncluded: true,
      freeDetail: "-",
      proDetail: "Included",
    },
    {
      feature: "Salary Insights",
      freeIncluded: false,
      proIncluded: true,
      freeDetail: "-",
      proDetail: "Full Analytics",
    },
    {
      feature: "Job Alerts",
      freeIncluded: true,
      proIncluded: true,
      freeDetail: "Basic",
      proDetail: "Real-time",
    },
    {
      feature: "Support",
      freeIncluded: true,
      proIncluded: true,
      freeDetail: "Community",
      proDetail: "Priority",
    },
  ],

  pricingFaqs: [
    {
      q: "Is Glowminds free?",
      a: "Yes. You can create a resume, search jobs, track applications, and receive 10 AI credits every month for free. No credit card required.",
    },
    {
      q: "Why is Glowminds Pro so affordable?",
      a: "We're currently offering a founding member launch price of ₹599/year (regular ₹999/year) for students and early-career professionals.",
    },
    {
      q: "Do AI features have usage limits?",
      a: "Yes. Free users receive 10 AI credits per month. Pro users receive 100 AI credits per month.",
    },
    {
      q: "How do AI credits work?",
      a: "Career Chat, Grammar, Paraphrase, Profile Review cost 1 credit. LinkedIn Audit costs 2. Job Fit and Salary Negotiate cost 3 and 2. Resume Review and Cover Letters cost 5. Starting a Mock Interview costs 10 credits (grading included — no second charge).",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Cancel from your dashboard anytime. You'll retain Pro access until the end of your billing cycle.",
    },
    {
      q: "Is my resume data secure?",
      a: "Yes. Your resumes and profile data are stored securely. Payments are processed through Razorpay and we never store payment details.",
    },
    {
      q: "Do I need a credit card for the free plan?",
      a: "No. The free plan requires no payment information.",
    },
    {
      q: "Can working professionals use Glowminds?",
      a: "Absolutely. Glowminds is ideal for students, fresh graduates, career switchers, and professionals with up to 5 years of experience.",
    },
  ],

  marketing: {
    proTagline:
      "Only ₹50/month when billed annually — less than ₹2/day",

    monthlyEquivalent:
      "Only ₹50/month when billed annually",

    dailyEquivalent:
      "Less than ₹2/day",

    heroDescription:
      "Build ATS-friendly resumes, discover relevant jobs, generate AI cover letters, practice interviews, and track applications — all in one platform.",

    billingBlurb:
      "Founding member offer: ₹599/year (regular ₹999). Secure checkout via Razorpay (UPI, Cards, Net Banking).",

    termsBillingText:
      "Pro subscriptions are billed at ₹599/year (founding member offer) or ₹99/month. Payments are processed securely through Razorpay. Cancel anytime from your dashboard.",

    proHighlights: [
      "100 AI Credits / Month",
      "AI Mock Interviews",
      "AI Cover Letters",
      "AI Career Coach",
      "Resume ATS Reviews",
    ],

    launchOfferText: "Founding Member Offer",

    guaranteeText:
      "7-day money-back guarantee — try Pro risk-free.",

    socialProof:
      "Built for students and early-career professionals across India.",
  },
};
