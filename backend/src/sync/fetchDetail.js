import { HTTP_HEADERS, getPlatform, workdayUrls } from "../config/platforms.js";

const DEFAULT_TIMEOUT_MS = 20_000;

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

function decodeEntities(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtml(html) {
  return decodeEntities(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toIso(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  return "";
}

async function detailGreenhouse(slug, id) {
  const platform = getPlatform("greenhouse");
  const res = await fetchJson(platform.jobDetailApi(slug, id));
  if (!res.ok) {
    return { ok: false, status: res.status, error: `greenhouse ${res.status}` };
  }
  const j = res.data || {};
  const html = j.content || "";
  return {
    ok: true,
    status: res.status,
    detail: {
      externalId: String(j.id || id),
      title: j.title || "",
      location: j?.location?.name || "",
      applyUrl: j.absolute_url || "",
      descriptionHtml: html,
      plainText: stripHtml(html),
      salary: "",
      department: (j.departments || []).map((d) => d.name).join(", ") || "",
      employmentType: "",
      remote: false,
      postedAt: toIso(j.first_published || j.created_at || j.updated_at),
      updatedAt: toIso(j.updated_at),
    },
  };
}

async function detailLever(slug, id) {
  const platform = getPlatform("lever");
  const res = await fetchJson(platform.jobDetailApi(slug, id));
  if (!res.ok) {
    return { ok: false, status: res.status, error: `lever ${res.status}` };
  }
  const j = res.data || {};
  const html =
    j.descriptionHtml ||
    j.description ||
    (Array.isArray(j.lists) ? j.lists.map((l) => l.content).join("\n") : "");
  const salary = j?.salaryRange
    ? `${j.salaryRange.min || ""}-${j.salaryRange.max || ""} ${j.salaryRange.currency || ""}`.trim()
    : "";
  return {
    ok: true,
    status: res.status,
    detail: {
      externalId: String(j.id || id),
      title: j.text || "",
      location: j?.categories?.location || "",
      applyUrl: j.hostedUrl || j.applyUrl || "",
      descriptionHtml: html,
      plainText: stripHtml(html),
      salary,
      department: j?.categories?.department || j?.categories?.team || "",
      employmentType: j?.categories?.commitment || "",
      remote: /remote/i.test(j?.workplaceType || j?.categories?.location || ""),
      postedAt: toIso(j.createdAt),
      updatedAt: toIso(j.updatedAt || j.createdAt),
    },
  };
}

async function detailAshby(slug, id) {
  const platform = getPlatform("ashby");
  const res = await fetchJson(platform.jobDetailApi(slug, id));
  if (!res.ok) {
    return { ok: false, status: res.status, error: `ashby ${res.status}` };
  }
  const j = res.data?.job || res.data || {};
  const html = j.descriptionHtml || j.description || "";
  const country = j?.address?.postalAddress?.addressCountry || "";
  const loc =
    j.location || j.locationName || [country].filter(Boolean).join(", ");
  return {
    ok: true,
    status: res.status,
    detail: {
      externalId: String(j.id || id),
      title: j.title || "",
      location: [loc, country].filter(Boolean).join(country && loc ? ", " : ""),
      applyUrl: j.jobUrl || j.applyUrl || "",
      descriptionHtml: html,
      plainText: stripHtml(html),
      salary: "",
      department: j.departmentName || j.team || "",
      employmentType: j.employmentType || "",
      remote: !!j.isRemote,
      postedAt: toIso(j.publishedAt),
      updatedAt: toIso(j.updatedAt || j.publishedAt),
    },
  };
}

async function detailBamboo(slug, id, prefetched) {
  if (prefetched && prefetched.raw) {
    const j = prefetched.raw;
    const html = j.description || j.summary || "";
    const loc = j.location;
    const locStr =
      loc && typeof loc === "object"
        ? [loc.city, loc.state, loc.country].filter(Boolean).join(", ")
        : String(loc || "");
    return {
      ok: true,
      status: 200,
      detail: {
        externalId: String(j.id || id),
        title: j.jobOpeningName || j.title || "",
        location: locStr,
        applyUrl: `https://${slug}.bamboohr.com/careers/${j.id}`,
        descriptionHtml: html,
        plainText: stripHtml(html),
        salary: "",
        department: j.departmentLabel || j.department || "",
        employmentType: j.employmentStatusLabel || "",
        remote: /remote/i.test(locStr),
        postedAt: "",
        updatedAt: "",
      },
    };
  }
  return {
    ok: false,
    status: 0,
    error: "bamboo: detail requires prefetched listing payload",
  };
}

async function detailWorkday(slug, externalId) {
  const urls = workdayUrls(slug);
  if (!urls) {
    return {
      ok: false,
      status: 0,
      error: `workday: invalid slug "${slug}" (expected company|wdN|siteId)`,
    };
  }
  const externalPath = String(externalId || "").startsWith("/")
    ? String(externalId)
    : `/job/${externalId}`;

  const res = await fetchJson(urls.detailApi(externalPath), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Origin: urls.base,
      Referer: `${urls.base}${externalPath}`,
    },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: `workday ${res.status}` };
  }
  const info = res.data?.jobPostingInfo || res.data || {};
  const html = info.jobDescription || "";
  return {
    ok: true,
    status: res.status,
    detail: {
      externalId: externalPath,
      title: info.title || "",
      location: info.location || info.locationsText || "",
      applyUrl:
        info.externalUrl ||
        info.applyUrl ||
        `${urls.base}${externalPath}`,
      descriptionHtml: html,
      plainText: stripHtml(html),
      salary: info.payRateRange || info.salary || "",
      department:
        (Array.isArray(info.jobFamilyGroup)
          ? info.jobFamilyGroup.join(", ")
          : info.jobFamilyGroup) || "",
      employmentType: info.timeType || info.employmentType || "",
      remote: /remote/i.test(info.location || info.locationsText || ""),
      postedAt: toIso(info.startDate || info.postedOn),
      updatedAt: toIso(info.startDate || info.postedOn),
    },
  };
}

const DETAILERS = {
  greenhouse: detailGreenhouse,
  lever: detailLever,
  ashby: detailAshby,
  bamboohr: detailBamboo,
  workday: detailWorkday,
};

export async function fetchDetail(ats, slug, externalId, prefetched) {
  const detailer = DETAILERS[ats];
  if (!detailer) {
    return { ok: false, status: 0, error: `Unknown ATS: ${ats}` };
  }
  try {
    return await detailer(slug, externalId, prefetched);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err?.message || String(err),
    };
  }
}

export async function fetchBambooRawIndex(slug) {
  const platform = getPlatform("bamboohr");
  const res = await fetchJson(platform.jobsApi(slug));
  if (!res.ok) return new Map();
  const arr = res.data?.result || [];
  const index = new Map();
  for (const j of arr) index.set(String(j.id), { raw: j });
  return index;
}
