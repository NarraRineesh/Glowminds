const USER_AGENT = "AIJobCopilotSync/0.1";

export const HTTP_HEADERS = {
  Accept: "application/json",
  "User-Agent": USER_AGENT,
};

export function workdayUrls(slug) {
  if (typeof slug !== "string") return null;
  const parts = slug.split("|");
  if (parts.length !== 3) return null;
  const [company, wd, siteId] = parts;
  if (!company || !wd || !siteId) return null;
  const wdMatch = wd.match(/^wd(\d+)$/i);
  if (!wdMatch) return null;
  const wdNum = wdMatch[1];
  const base = `https://${company}.wd${wdNum}.myworkdayjobs.com`;
  return {
    base,
    company,
    siteId,
    listApi: `${base}/wday/cxs/${company}/${siteId}/jobs`,
    detailApi: (externalPath) =>
      `${base}/wday/cxs/${company}/${siteId}${externalPath}`,
    careersUrl: `${base}/${siteId}`,
  };
}

export const PLATFORMS = {
  greenhouse: {
    id: "greenhouse",
    jobsApi: (slug) =>
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
    jobsApiWithContent: (slug) =>
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
    jobDetailApi: (slug, id) =>
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${id}`,
    careersUrl: (slug) => `https://boards.greenhouse.io/${slug}`,
    concurrency: 8,
    delayMs: 100,
  },
  lever: {
    id: "lever",
    jobsApi: (slug) => `https://api.lever.co/v0/postings/${slug}?mode=json`,
    jobDetailApi: (slug, id) =>
      `https://api.lever.co/v0/postings/${slug}/${id}?mode=json`,
    careersUrl: (slug) => `https://jobs.lever.co/${slug}`,
    concurrency: 8,
    delayMs: 100,
  },
  ashby: {
    id: "ashby",
    jobsApi: (slug) =>
      `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`,
    jobDetailApi: (slug, id) =>
      `https://api.ashbyhq.com/posting-api/job-board/${slug}/${id}`,
    careersUrl: (slug) => `https://jobs.ashbyhq.com/${slug}`,
    concurrency: 4,
    delayMs: 250,
  },
  bamboohr: {
    id: "bamboohr",
    jobsApi: (slug) => `https://${slug}.bamboohr.com/careers/list`,
    jobDetailApi: (slug, id) => `https://${slug}.bamboohr.com/careers/${id}`,
    careersUrl: (slug) => `https://${slug}.bamboohr.com/careers`,
    concurrency: 4,
    delayMs: 200,
  },
  workday: {
    id: "workday",
    jobsApi: (slug) => workdayUrls(slug)?.listApi || null,
    jobDetailApi: (slug, externalPath) =>
      workdayUrls(slug)?.detailApi(externalPath) || null,
    careersUrl: (slug) => workdayUrls(slug)?.careersUrl || null,
    concurrency: 4,
    delayMs: 250,
  },
};

export const ATS_IDS = Object.keys(PLATFORMS);

export function getPlatform(ats) {
  const p = PLATFORMS[ats];
  if (!p) throw new Error(`Unknown ATS: ${ats}`);
  return p;
}
