/** Salary insights reference data — served only to Pro subscribers. */

export const SALARY_TABLE = {
  "Frontend Engineer": { fresher: [4, 7], junior: [7, 14], mid: [14, 26], senior: [26, 48] },
  "Backend Engineer": { fresher: [5, 8], junior: [8, 16], mid: [16, 30], senior: [30, 55] },
  "Full Stack Engineer": { fresher: [4.5, 8], junior: [8, 18], mid: [18, 32], senior: [32, 58] },
  "Data Analyst": { fresher: [3.5, 6], junior: [6, 12], mid: [12, 22], senior: [22, 38] },
  "Data Scientist": { fresher: [6, 10], junior: [10, 20], mid: [20, 38], senior: [38, 65] },
  "Product Manager": { fresher: [8, 14], junior: [14, 24], mid: [24, 42], senior: [42, 75] },
  "UI/UX Designer": { fresher: [3.5, 6], junior: [6, 12], mid: [12, 22], senior: [22, 36] },
  "DevOps Engineer": { fresher: [5, 9], junior: [9, 18], mid: [18, 32], senior: [32, 55] },
};

export const CITY_MULTIPLIER = {
  Bangalore: 1.0,
  Hyderabad: 0.95,
  Mumbai: 1.05,
  "Delhi NCR": 0.98,
  Pune: 0.92,
  Chennai: 0.9,
  Remote: 0.95,
};

export const SALARY_LEVELS = [
  { id: "fresher", label: "0–1 yrs", name: "Fresher" },
  { id: "junior", label: "1–3 yrs", name: "Junior" },
  { id: "mid", label: "3–6 yrs", name: "Mid" },
  { id: "senior", label: "6+ yrs", name: "Senior" },
];

export const NEGOTIATION_TIPS = [
  { ico: "chart", label: "Anchor with research", desc: "Quote a range — never a single number." },
  { ico: "target", label: "Tie ask to outcomes", desc: "\"Based on the impact I drove at X, I'd expect…\"" },
  { ico: "mute", label: "Stay quiet first", desc: "Whoever talks first after the offer typically loses." },
  { ico: "package", label: "Total comp matters", desc: "Stock, bonus, learning budget — not just base." },
];
