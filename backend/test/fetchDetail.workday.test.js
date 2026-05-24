import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchDetail } from "../src/sync/fetchDetail.js";

function installFetchQueue(queue) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, method: options.method || "GET" });
    if (queue.length === 0) {
      throw new Error(`fetch mock: unexpected request ${url}`);
    }
    const next = queue.shift();
    if (next.throw) throw next.throw;
    return new Response(JSON.stringify(next.data ?? {}), {
      status: next.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
  return { calls, restore: () => (globalThis.fetch = originalFetch) };
}

describe("fetchDetail(workday)", () => {
  let restore;
  afterEach(() => {
    if (restore) restore();
    restore = null;
  });

  it("normalizes a Workday detail payload", async () => {
    const queue = [
      {
        status: 200,
        data: {
          jobPostingInfo: {
            title: "Senior Data Engineer",
            location: "India - Bangalore",
            externalUrl:
              "https://marvell.wd1.myworkdayjobs.com/marvellcareers/job/India-Bangalore/Senior-Data-Engineer_R456",
            jobDescription:
              "&lt;p&gt;Build scalable pipelines with &lt;b&gt;Spark&lt;/b&gt;.&lt;/p&gt;",
            jobReqId: "R456",
            timeType: "Full time",
            startDate: "2026-04-12",
            postedOn: "Posted 5 Days Ago",
            jobFamilyGroup: ["Engineering", "Data"],
          },
        },
      },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchDetail(
      "workday",
      "marvell|wd1|marvellcareers",
      "/job/India-Bangalore/Senior-Data-Engineer_R456",
    );

    assert.equal(out.ok, true);
    assert.equal(
      mock.calls[0].url,
      "https://marvell.wd1.myworkdayjobs.com/wday/cxs/marvell/marvellcareers/job/India-Bangalore/Senior-Data-Engineer_R456",
    );
    assert.equal(mock.calls[0].method, "GET");

    const d = out.detail;
    assert.equal(d.externalId, "/job/India-Bangalore/Senior-Data-Engineer_R456");
    assert.equal(d.title, "Senior Data Engineer");
    assert.equal(d.location, "India - Bangalore");
    assert.equal(
      d.applyUrl,
      "https://marvell.wd1.myworkdayjobs.com/marvellcareers/job/India-Bangalore/Senior-Data-Engineer_R456",
    );
    assert.equal(d.employmentType, "Full time");
    assert.equal(d.department, "Engineering, Data");
    assert.equal(d.postedAt, "2026-04-12");
    assert.equal(d.updatedAt, "2026-04-12");
    assert.equal(d.remote, false);
    assert.match(d.descriptionHtml, /Spark/);
    assert.equal(d.plainText, "Build scalable pipelines with Spark .");
  });

  it("derives applyUrl from externalPath when externalUrl is absent", async () => {
    const queue = [
      {
        status: 200,
        data: {
          jobPostingInfo: {
            title: "Cloud Engineer",
            location: "Pune, India",
            jobDescription: "<p>Job</p>",
            startDate: "2026-04-01",
          },
        },
      },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchDetail("workday", "abb|wd3|external_career_page", "/job/IN-Pune/Cloud_R7");
    assert.equal(out.ok, true);
    assert.equal(
      out.detail.applyUrl,
      "https://abb.wd3.myworkdayjobs.com/job/IN-Pune/Cloud_R7",
    );
  });

  it("detects remote flag from location text", async () => {
    const queue = [
      {
        status: 200,
        data: {
          jobPostingInfo: {
            title: "Remote SRE",
            location: "Remote - India",
            jobDescription: "",
          },
        },
      },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchDetail("workday", "x|wd1|y", "/job/Remote/SRE_1");
    assert.equal(out.ok, true);
    assert.equal(out.detail.remote, true);
  });

  it("normalizes bare externalId by prefixing /job/", async () => {
    const queue = [
      {
        status: 200,
        data: {
          jobPostingInfo: {
            title: "QA Engineer",
            location: "Bangalore",
            jobDescription: "",
          },
        },
      },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    await fetchDetail("workday", "x|wd1|y", "QA-Engineer_R99");
    assert.equal(
      mock.calls[0].url,
      "https://x.wd1.myworkdayjobs.com/wday/cxs/x/y/job/QA-Engineer_R99",
    );
  });

  it("rejects an invalid compound slug without HTTP", async () => {
    const mock = installFetchQueue([]);
    restore = mock.restore;

    const out = await fetchDetail("workday", "bad-slug", "/job/x");
    assert.equal(out.ok, false);
    assert.match(out.error, /invalid slug/);
    assert.equal(mock.calls.length, 0);
  });

  it("surfaces upstream HTTP errors", async () => {
    const queue = [{ status: 404, data: { error: "Not Found" } }];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchDetail("workday", "x|wd1|y", "/job/gone");
    assert.equal(out.ok, false);
    assert.equal(out.status, 404);
    assert.match(out.error, /workday 404/);
  });

  it("falls back to top-level fields when jobPostingInfo is missing", async () => {
    const queue = [
      {
        status: 200,
        data: {
          title: "Plain Engineer",
          location: "Hyderabad, India",
          jobDescription: "<p>Plain</p>",
        },
      },
    ];
    const mock = installFetchQueue(queue);
    restore = mock.restore;

    const out = await fetchDetail("workday", "x|wd1|y", "/job/plain");
    assert.equal(out.ok, true);
    assert.equal(out.detail.title, "Plain Engineer");
    assert.equal(out.detail.location, "Hyderabad, India");
  });
});
