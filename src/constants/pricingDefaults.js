/** Default pricing config — seeded to Firestore `config/pricing` on first read.
 * Display lists live on plans[].cardFeatures. creditPolicies[] is backend-only.
 * FAQ + Feature Comparison are separate config docs.
 */

function cf(id, text, included, badge = null) {
  return badge
    ? { id, text, included, badge }
    : { id, text, included };
}

export const DEFAULT_PRICING_CONFIG = {
  currency: "INR",
  currencySymbol: "₹",

  plans: [
    {
      id: "7c2e9a1f4b80d3e6",
      key: "free",
      label: "FREE",
      badge: null,
      displayPrice: "₹0",
      regularPrice: null,
      period: "/forever",
      monthlyEquivalent: null,
      dailyEquivalent: null,
      desc: "Perfect for getting started with job hunting.",
      ctaLabel: "Start Free",
      ctaVariant: "outline",
      amountPaise: 0,
      durationDays: 0,
      tier: "free",
      visible: true,
      highlighted: false,
      sortOrder: 0,
      aiCreditsPerPeriod: 10,
      limits: { applications: 10, resumes: 1, template: "onyx" },
      cardFeatures: [
        cf("a100000000000001", "Job Search & Browse", true),
        cf("a100000000000002", "Profile & Portfolio", true),
        cf("a100000000000003", "1 Resume", true),
        cf("a100000000000004", "10 Application Tracks", true),
        cf("a100000000000005", "10 AI Credits / Month", true),
        cf("a100000000000006", "Basic Job Alerts", true),
        cf("a100000000000007", "GLOWMINDS AI", false),
        cf("a100000000000008", "AI Interview Prep", false),
        cf("a100000000000009", "AI Cover Letters", false),
        cf("a10000000000000a", "Salary Insights", false),
      ],
    },
    {
      id: "0d48f2a9c1e7b653",
      key: "monthly",
      label: "PRO MONTHLY",
      badge: null,
      displayPrice: "₹99",
      regularPrice: null,
      period: "/month",
      monthlyEquivalent: null,
      dailyEquivalent: null,
      desc: "Full Pro access billed monthly. Cancel anytime.",
      ctaLabel: "Get Pro — ₹99/month",
      ctaVariant: "primary",
      amountPaise: 9900,
      durationDays: 30,
      tier: "pro",
      visible: true,
      highlighted: false,
      sortOrder: 1,
      aiCreditsPerPeriod: 100,
      limits: { applications: -1, resumes: -1, template: null },
      cardFeatures: [
        cf("a200000000000001", "Everything in Free", true),
        cf("a200000000000002", "100 AI Credits / Month", true, "AI"),
        cf("a200000000000003", "AI Mock Interviews", true, "AI"),
        cf("a200000000000004", "AI Cover Letters", true, "AI"),
        cf("a200000000000005", "GLOWMINDS AI chat", true, "AI"),
        cf("a200000000000006", "Resume ATS Reviews", true, "AI"),
        cf("a200000000000007", "Unlimited Applications", true),
        cf("a200000000000008", "Unlimited Resumes", true),
        cf("a200000000000009", "All 6 Resume Templates", true),
        cf("a20000000000000a", "Salary Insights & Analytics", true),
        cf("a20000000000000b", "Real-time Job Alerts", true),
        cf("a20000000000000c", "Priority Support", true),
      ],
    },
    {
      id: "e91b04c7a2f65d38",
      key: "yearly",
      label: "PRO",
      badge: "Founding Member Offer",
      displayPrice: "₹599",
      regularPrice: "₹999",
      period: "/year",
      monthlyEquivalent: "Only ₹50/month when billed annually",
      dailyEquivalent: "Less than ₹2/day",
      desc: "100 AI credits/month, AI mock interviews, cover letters, GLOWMINDS AI, and resume ATS reviews.",
      ctaLabel: "Get Pro — ₹599/year",
      ctaVariant: "primary",
      amountPaise: 59900,
      durationDays: 365,
      tier: "pro",
      visible: true,
      highlighted: true,
      sortOrder: 2,
      aiCreditsPerPeriod: 100,
      limits: { applications: -1, resumes: -1, template: null },
      cardFeatures: [
        cf("a300000000000001", "Everything in Free", true),
        cf("a300000000000002", "100 AI Credits / Month", true, "AI"),
        cf("a300000000000003", "AI Mock Interviews", true, "AI"),
        cf("a300000000000004", "AI Cover Letters", true, "AI"),
        cf("a300000000000005", "GLOWMINDS AI chat", true, "AI"),
        cf("a300000000000006", "Resume ATS Reviews", true, "AI"),
        cf("a300000000000007", "Unlimited Applications", true),
        cf("a300000000000008", "Unlimited Resumes", true),
        cf("a300000000000009", "All 6 Resume Templates", true),
        cf("a30000000000000a", "Salary Insights & Analytics", true),
        cf("a30000000000000b", "Real-time Job Alerts", true),
        cf("a30000000000000c", "Priority Support", true),
      ],
    },
    {
      id: "f1a2b3c4d5e6f708",
      key: "lifetime",
      label: "LIFETIME",
      badge: "Best value",
      displayPrice: "₹2,999",
      regularPrice: "₹4,999",
      period: "/lifetime",
      monthlyEquivalent: null,
      dailyEquivalent: "One-time payment",
      desc: "Pay once. Keep Pro access for life — all AI tools and unlimited tracking.",
      ctaLabel: "Get Lifetime — ₹2,999",
      ctaVariant: "primary",
      amountPaise: 299900,
      durationDays: 36500,
      tier: "pro",
      visible: true,
      highlighted: false,
      sortOrder: 3,
      aiCreditsPerPeriod: 100,
      limits: { applications: -1, resumes: -1, template: null },
      cardFeatures: [
        cf("a400000000000001", "Everything in Pro", true),
        cf("a400000000000002", "100 AI Credits / Month forever", true, "AI"),
        cf("a400000000000003", "All AI tools included", true, "AI"),
        cf("a400000000000004", "Unlimited resumes & applications", true),
        cf("a400000000000005", "Priority support for life", true),
      ],
    },
  ],

  creditPolicies: [
    { id: "b5a1c83e0f2947d6", key: "careerChat", label: "GLOWMINDS AI", enabled: true, access: "pro", creditCost: 1, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "c6b2d94f1a3058e7", key: "coverLetter", label: "AI Cover Letters", enabled: true, access: "pro", creditCost: 5, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "d7c3e05a2b4169f8", key: "interviewSession", label: "AI Mock Interviews", enabled: true, access: "pro", creditCost: 10, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "e8d4f16b3c5270a9", key: "resumeReview", label: "Resume ATS Review", enabled: true, access: "pro", creditCost: 5, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "f9e5a27c4d6381b0", key: "jobFit", label: "AI Job Fit", enabled: true, access: "pro", creditCost: 3, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "0af6b38d5e7492c1", key: "salaryNegotiate", label: "Salary Negotiation", enabled: true, access: "pro", creditCost: 2, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "1b07c49e6f85a3d2", key: "salaryInsights", label: "Salary Insights", enabled: true, access: "pro", creditCost: 0, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "2c18d5af7096b4e3", key: "topMatches", label: "Smart Job Matching", enabled: true, access: "pro", creditCost: 0, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "3d29e6b081a7c5f4", key: "evaluateSession", label: "Interview Grading", enabled: true, access: "pro", creditCost: 0, usageLimitPerPeriod: { free: 0, pro: -1 } },
    { id: "3f7e2d19a8c046b1", key: "grammar", label: "Grammar Check", enabled: true, access: "free", creditCost: 1, usageLimitPerPeriod: { free: -1, pro: -1 } },
    { id: "4e8f3e2ab9d157c2", key: "paraphrase", label: "Rewrite / Paraphrase", enabled: true, access: "free", creditCost: 1, usageLimitPerPeriod: { free: -1, pro: -1 } },
    { id: "5f904f3bca0268d3", key: "profileReview", label: "Profile Review", enabled: true, access: "free", creditCost: 1, usageLimitPerPeriod: { free: -1, pro: -1 } },
    { id: "60a15f4cdb1379e4", key: "linkedinAudit", label: "LinkedIn Audit", enabled: true, access: "free", creditCost: 2, usageLimitPerPeriod: { free: -1, pro: -1 } },
    { id: "71b26f5dec248af5", key: "learningPath", label: "AI Learning Path", enabled: true, access: "free", creditCost: 3, usageLimitPerPeriod: { free: -1, pro: -1 } },
  ],

  /** Derived for backward-compatible clients — rebuilt on merge. */
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

  marketing: {
    heroDescription:
      "An AI-Powered Career Operating System — resumes, jobs, interviews, skills, and tracking in one workspace.",
    guaranteeText: "7-day money-back guarantee — try Pro risk-free.",
    socialProof: "Built for students and early-career professionals across India.",
  },
};

/** Visible plans sorted for pricing cards. */
export function visiblePlans(config) {
  const merged = mergePricingConfig(config);
  const plans = Array.isArray(merged.plans) ? merged.plans : [];
  const sorted = plans
    .filter(Boolean)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const vis = sorted.filter((p) => p.visible !== false);
  if (vis.length >= 3) return vis;
  return sorted.filter((p) => ["free", "monthly", "yearly", "lifetime"].includes(p.key));
}

export function findPlanByIdOrKey(config, idOrKey) {
  const plans = Array.isArray(config?.plans) ? config.plans : [];
  if (!idOrKey) return null;
  return plans.find((p) => p.id === idOrKey || p.key === idOrKey) || null;
}

/** Map plan.cardFeatures → checklist items for Settings / gates. */
export function cardFeaturesAsChecklist(plan) {
  if (!plan || !Array.isArray(plan.cardFeatures)) return [];
  return plan.cardFeatures.map((f) => ({
    text: f.text,
    included: f.included !== false,
    highlight: Boolean(f.badge),
  }));
}

/**
 * Resolve the plan the user is on from subscription + pricing config.
 * Free users → free plan; Pro → matching hashed id / key, else highlighted paid plan.
 */
export function resolveUserPlan(config, subscription, { isPro = false, planId = null } = {}) {
  const freePlan = findPlanByIdOrKey(config, "free")
    || (Array.isArray(config?.plans) ? config.plans.find((p) => p.tier === "free" || !p.amountPaise) : null);

  if (!isPro) return freePlan;

  const candidates = [
    planId,
    subscription?.currentPlanId,
    subscription?.plan,
    subscription?.currentPlanKey,
    subscription?.planKey,
  ].filter(Boolean);

  for (const id of candidates) {
    const hit = findPlanByIdOrKey(config, id);
    if (hit) return hit;
  }

  return highlightedPlan(config)
    || findPlanByIdOrKey(config, "yearly")
    || (Array.isArray(config?.plans) ? config.plans.find((p) => p.tier === "pro" && p.amountPaise > 0) : null)
    || freePlan;
}

/** Short billing cadence label from plan key/period. */
export function planBillingCadence(plan) {
  if (!plan) return null;
  const key = String(plan.key || "").toLowerCase();
  if (key === "monthly") return "Monthly billing";
  if (key === "yearly") return "Yearly billing";
  if (key === "lifetime") return "One-time purchase";
  const period = String(plan.period || "").toLowerCase();
  if (period.includes("month")) return "Monthly billing";
  if (period.includes("year")) return "Yearly billing";
  if (period.includes("life") || period.includes("forever")) return "One-time / forever";
  return null;
}

export function planPriceLabel(plan) {
  if (!plan) return "";
  return `${plan.displayPrice || ""}${plan.period || ""}`.trim();
}

export function highlightedPlan(config) {
  const plans = visiblePlans(config);
  return plans.find((p) => p.highlighted) || plans.find((p) => p.amountPaise > 0) || plans[0] || null;
}

export function yearlyPriceLabel(config = DEFAULT_PRICING_CONFIG) {
  const plan = findPlanByIdOrKey(config, "yearly") || highlightedPlan(config);
  if (!plan) return "₹599/year";
  return `${plan.displayPrice || ""}${plan.period || ""}`.trim() || "Pro";
}

export function yearlySeoPrice(config = DEFAULT_PRICING_CONFIG) {
  const plan = findPlanByIdOrKey(config, "yearly") || highlightedPlan(config);
  if (!plan?.displayPrice) return "599";
  return String(plan.displayPrice).replace(/[^\d]/g, "") || "599";
}

/** Merge remote pricing with defaults so Free / Monthly / Yearly / Lifetime always exist. */
export function mergePricingConfig(data) {
  const base = structuredClone(DEFAULT_PRICING_CONFIG);
  if (!data || typeof data !== "object") return base;

  let remotePlans = [];
  if (Array.isArray(data.plans) && data.plans.length) {
    remotePlans = data.plans;
  } else if (data.plans && typeof data.plans === "object") {
    remotePlans = Object.entries(data.plans).map(([key, plan]) => ({ key, ...plan }));
  }

  const byKey = new Map();
  for (const p of remotePlans) {
    if (p?.key) byKey.set(p.key, p);
  }
  const plans = base.plans.map((def) => {
    const remote = byKey.get(def.key);
    if (!remote) return def;
    return {
      ...def,
      ...remote,
      cardFeatures: Array.isArray(remote.cardFeatures) && remote.cardFeatures.length
        ? remote.cardFeatures
        : def.cardFeatures,
    };
  });
  for (const p of remotePlans) {
    if (p?.key && !plans.some((x) => x.key === p.key)) plans.push(p);
  }
  plans.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const creditPolicies =
    Array.isArray(data.creditPolicies) && data.creditPolicies.length
      ? data.creditPolicies
      : base.creditPolicies;

  return {
    ...base,
    ...data,
    plans,
    creditPolicies,
    freeLimits: { ...base.freeLimits, ...(data.freeLimits || {}) },
    proLimits: { ...base.proLimits, ...(data.proLimits || {}) },
    creditCosts: { ...base.creditCosts, ...(data.creditCosts || {}) },
    marketing: { ...base.marketing, ...(data.marketing || {}) },
  };
}

