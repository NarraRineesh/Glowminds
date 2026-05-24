import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchListing } from "../src/sync/fetchListing.js";

function installFetchQueue(queue) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    let parsedBody = null;
    try {
      parsedBody = options.body ? JSON.parse(options.body) : null;
    } catch {
      parsedBody = options.body;
    }
    calls.push({ url, method: options.method, body: parsedBody });

    if (queue.length === 0) {
      throw new Error(
        `fetch mock: unexpected request ${options.method} ${url}`,
      );
    }
    const next = queue.shift();
    if (next.throw) throw next.throw;
    const body = JSON.stringify(next.data ?? {});
    return new Response(body, {
      status: next.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
  return { calls, restore: () => (globalThis.fetch = originalFetch) };
}

function workdayPosting({
  title,
  loc,
  path,
}) {
  return {
    title,
    locationsText: loc,
    externalPath: path,
    postedOn: "Posted Today",
    bulletFields: [path?.split("/").pop() || ""],
  };
}

describe("fetchListing(workday)", () => {
  let restore;

  afterEach(() => {
    if (restore) restore();
    restore = null;
  });

  it("normalizes a single-page response", async () => {
    const queue = [
      {
        status: 200,
        data: {
          total: 3,
          jobPostings: [
            workdayPosting({ title: "Data Engineer", loc: "Bangalore", path: "/job/IN-BLR/Data-Engineer_R1" }),
            workdayPosting({ title: "Sales Rep", loc: "Austin, TX", path: "/job/US-Austin/Sales-Rep_R2" }),
            workdayPosting({ title: "Cloud Engineer", loc: "India - Pune", path: "/job/IN-PUN/Cloud-Engineer_R3" }),
          ],
        },
      },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchListing("workday", "marvell|wd1|marvellcareers");

    assert.equal(out.ok, true);
    assert.equal(out.jobCount, 3);
    assert.equal(out.indiaJobCount, 2, "2 india locations expected");
    assert.equal(out.jobs.length, 3);
    assert.equal(out.indiaJobs.length, 2);

    assert.equal(
      mock.calls[0].url,
      "https://marvell.wd1.myworkdayjobs.com/wday/cxs/marvell/marvellcareers/jobs",
    );
    assert.equal(mock.calls[0].method, "POST");
    assert.equal(mock.calls[0].body.searchText, "India");
    assert.equal(mock.calls[0].body.limit, 20);
    assert.equal(mock.calls[0].body.offset, 0);

    const sampleJob = out.jobs[0];
    assert.equal(sampleJob.id, "/job/IN-BLR/Data-Engineer_R1");
    assert.equal(sampleJob.title, "Data Engineer");
    assert.equal(sampleJob.location, "Bangalore");
    assert.equal(
      sampleJob.applyUrl,
      "https://marvell.wd1.myworkdayjobs.com/job/IN-BLR/Data-Engineer_R1",
    );
    assert.equal(sampleJob.externalPath, "/job/IN-BLR/Data-Engineer_R1");
  });

  it("paginates until a short page is returned", async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) =>
      workdayPosting({
        title: `Job ${i}`,
        loc: "Bangalore",
        path: `/job/IN/Job-${i}`,
      }),
    );
    const shortPage = Array.from({ length: 7 }, (_, i) =>
      workdayPosting({
        title: `Job ${100 + i}`,
        loc: "Mumbai",
        path: `/job/IN/Job-${100 + i}`,
      }),
    );

    const queue = [
      { status: 200, data: { total: 47, jobPostings: fullPage } },
      { status: 200, data: { total: 47, jobPostings: fullPage } },
      { status: 200, data: { total: 47, jobPostings: shortPage } },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchListing("workday", "x|wd1|y");

    assert.equal(out.ok, true);
    assert.equal(out.jobCount, 47);
    assert.equal(out.indiaJobCount, 47);
    assert.equal(mock.calls.length, 3, "should make 3 paginated requests");
    assert.equal(mock.calls[0].body.offset, 0);
    assert.equal(mock.calls[1].body.offset, 20);
    assert.equal(mock.calls[2].body.offset, 40);
  });

  it("stops when allJobs reaches reported total", async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) =>
      workdayPosting({
        title: `J${i}`,
        loc: "Pune",
        path: `/job/IN/J-${i}`,
      }),
    );
    const queue = [
      { status: 200, data: { total: 20, jobPostings: fullPage } },
      { status: 200, data: { total: 20, jobPostings: fullPage } },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchListing("workday", "x|wd1|y");
    assert.equal(out.ok, true);
    assert.equal(out.jobs.length, 20);
    assert.equal(mock.calls.length, 1);
  });

  it("fails fast on first-page HTTP error", async () => {
    const queue = [{ status: 422, data: { error: "Bad" } }];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchListing("workday", "x|wd1|y");
    assert.equal(out.ok, false);
    assert.equal(out.status, 422);
    assert.match(out.error, /workday 422/);
  });

  it("keeps partial data when a later page errors out", async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) =>
      workdayPosting({
        title: `J${i}`,
        loc: "Bangalore",
        path: `/job/IN/J-${i}`,
      }),
    );
    const queue = [
      { status: 200, data: { total: 50, jobPostings: fullPage } },
      { status: 500, data: { error: "Upstream" } },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchListing("workday", "x|wd1|y");
    assert.equal(out.ok, true, "first-page success keeps the lister ok");
    assert.equal(out.jobs.length, 20);
    assert.equal(mock.calls.length, 2);
  });

  it("rejects invalid compound slugs without making any HTTP call", async () => {
    const mock = installFetchQueue([]);
    restore = mock.restore;

    const out = await fetchListing("workday", "not-a-compound-slug");
    assert.equal(out.ok, false);
    assert.match(out.error, /invalid slug/);
    assert.equal(mock.calls.length, 0);
  });

  it("sends Origin and Referer headers shaped from the slug", async () => {
    const queue = [{ status: 200, data: { total: 0, jobPostings: [] } }];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    await fetchListing("workday", "acme|wd5|careers");
    assert.equal(
      mock.calls[0].url,
      "https://acme.wd5.myworkdayjobs.com/wday/cxs/acme/careers/jobs",
    );
  });
});
