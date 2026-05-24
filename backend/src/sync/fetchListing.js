import { HTTP_HEADERS, getPlatform, workdayUrls } from "../config/platforms.js";
import { isIndiaLocation } from "./indiaFilter.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const WORKDAY_PAGE_LIMIT = 20;
const WORKDAY_MAX_PAGES = 25;

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs || DEFAULT_TIMEOUT_MS,
  );
  try {
    const res = await fetch(url, {
      headers: { ...HTTP_HEADERS, ...(options.headers || {}) },
      method: options.method || "GET",
      body: options.body,
      signal: controller.signal,
    });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function toIso(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  if (value instanceof Date) return value.toISOString();
  return "";
}

function pickLatest(jobs) {
  let latest = "";
  for (const j of jobs) {
    if (j.updatedAt && j.updatedAt > latest) latest = j.updatedAt;
  }
  return latest;
}

function summarize(jobs) {
  const indiaJobs = jobs.filter((j) => isIndiaLocation(j.location));
  return {
    jobCount: jobs.length,
    indiaJobCount: indiaJobs.length,
    latestUpdatedAt: pickLatest(jobs),
    jobs,
    indiaJobs,
  };
}

async function listGreenhouse(slug) {
  const platform = getPlatform("greenhouse");
  const res = await fetchJson(platform.jobsApi(slug));
  if (!res.ok) {
    return { ok: false, status: res.status, error: `greenhouse ${res.status}` };
  }
  const jobs = (res.data?.jobs || []).map((j) => ({
    id: String(j.id),
    title: j.title || "",
    location: j?.location?.name || "",
    updatedAt: toIso(j.updated_at),
    applyUrl: j.absolute_url || "",
  }));
  return { ok: true, status: res.status, ...summarize(jobs) };
}

async function listLever(slug) {
  const platform = getPlatform("lever");
  const res = await fetchJson(platform.jobsApi(slug));
  if (!res.ok) {
    return { ok: false, status: res.status, error: `lever ${res.status}` };
  }
  const arr = Array.isArray(res.data) ? res.data : [];
  const jobs = arr.map((j) => ({
    id: String(j.id),
    title: j.text || "",
    location: j?.categories?.location || "",
    updatedAt: toIso(j.createdAt || j.updatedAt),
    applyUrl: j.hostedUrl || j.applyUrl || "",
  }));
  return { ok: true, status: res.status, ...summarize(jobs) };
}

async function listAshby(slug) {
  const platform = getPlatform("ashby");
  const res = await fetchJson(platform.jobsApi(slug));
  if (!res.ok) {
    return { ok: false, status: res.status, error: `ashby ${res.status}` };
  }
  const arr = res.data?.jobs || [];
  const jobs = arr.map((j) => {
    const country = j?.address?.postalAddress?.addressCountry || "";
    const loc =
      j?.location || j?.locationName || [country].filter(Boolean).join(", ");
    return {
      id: String(j.id),
      title: j.title || "",
      location: [loc, country].filter(Boolean).join(country && loc ? ", " : ""),
      updatedAt: toIso(j.updatedAt || j.publishedAt),
      applyUrl: j.jobUrl || j.applyUrl || "",
    };
  });
  return { ok: true, status: res.status, ...summarize(jobs) };
}

async function listBamboo(slug) {
  const platform = getPlatform("bamboohr");
  const res = await fetchJson(platform.jobsApi(slug));
  if (!res.ok) {
    return { ok: false, status: res.status, error: `bamboohr ${res.status}` };
  }
  const arr = res.data?.result || [];
  const jobs = arr.map((j) => {
    const loc = j?.location;
    const locStr =
      loc && typeof loc === "object"
        ? [loc.city, loc.state, loc.country].filter(Boolean).join(", ")
        : String(loc || "");
    return {
      id: String(j.id),
      title: j.jobOpeningName || j.title || "",
      location: locStr,
      updatedAt: "",
      applyUrl: `https://${slug}.bamboohr.com/careers/${j.id}`,
    };
  });
  return { ok: true, status: res.status, ...summarize(jobs) };
}

async function listWorkday(slug) {
  const urls = workdayUrls(slug);
  if (!urls) {
    return {
      ok: false,
      status: 0,
      error: `workday: invalid slug "${slug}" (expected company|wdN|siteId)`,
    };
  }

  const headers = {
    "Content-Type": "application/json",
    Origin: urls.base,
    Referer: `${urls.base}/${urls.siteId}`,
  };

  const allJobs = [];
  let totalReported = 0;
  let lastStatus = 0;

  for (let page = 0; page < WORKDAY_MAX_PAGES; page++) {
    const offset = page * WORKDAY_PAGE_LIMIT;
    const res = await fetchJson(urls.listApi, {
      method: "POST",
      headers,
      body: JSON.stringify({
        appliedFacets: {},
        limit: WORKDAY_PAGE_LIMIT,
        offset,
        searchText: "India",
      }),
    });
    lastStatus = res.status;
    if (!res.ok) {
      if (page === 0) {
        return {
          ok: false,
          status: res.status,
          error: `workday ${res.status}`,
        };
      }
      break;
    }

    const postings = res.data?.jobPostings || [];
    totalReported = res.data?.total ?? totalReported;

    for (const j of postings) {
      const externalPath = j.externalPath || "";
      const id = externalPath || j.bulletFields?.[0] || j.title || "";
      if (!id) continue;
      allJobs.push({
        id: String(id),
        title: j.title || "",
        location: j.locationsText || "",
        updatedAt: "",
        applyUrl: externalPath ? `${urls.base}${externalPath}` : "",
        externalPath,
      });
    }

    if (postings.length < WORKDAY_PAGE_LIMIT) break;
    if (totalReported && allJobs.length >= totalReported) break;
  }

  return { ok: true, status: lastStatus || 200, ...summarize(allJobs) };
}

const LISTERS = {
  greenhouse: listGreenhouse,
  lever: listLever,
  ashby: listAshby,
  bamboohr: listBamboo,
  workday: listWorkday,
};

export async function fetchListing(ats, slug) {
  const lister = LISTERS[ats];
  if (!lister) {
    return { ok: false, status: 0, error: `Unknown ATS: ${ats}` };
  }
  try {
    return await lister(slug);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err?.message || String(err),
    };
  }
}
