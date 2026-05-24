import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  workdayUrls,
  getPlatform,
  ATS_IDS,
  PLATFORMS,
} from "../src/config/platforms.js";

describe("workdayUrls", () => {
  it("parses a typical compound slug", () => {
    const u = workdayUrls("marvell|wd1|marvellcareers");
    assert.ok(u);
    assert.equal(u.company, "marvell");
    assert.equal(u.siteId, "marvellcareers");
    assert.equal(u.base, "https://marvell.wd1.myworkdayjobs.com");
    assert.equal(
      u.listApi,
      "https://marvell.wd1.myworkdayjobs.com/wday/cxs/marvell/marvellcareers/jobs",
    );
    assert.equal(
      u.careersUrl,
      "https://marvell.wd1.myworkdayjobs.com/marvellcareers",
    );
  });

  it("supports multi-digit wd numbers", () => {
    const u = workdayUrls("rsli|wd503|reliancestandardjobs");
    assert.ok(u);
    assert.equal(u.base, "https://rsli.wd503.myworkdayjobs.com");
    assert.equal(
      u.listApi,
      "https://rsli.wd503.myworkdayjobs.com/wday/cxs/rsli/reliancestandardjobs/jobs",
    );
  });

  it("builds the detail URL by appending externalPath", () => {
    const u = workdayUrls("abb|wd3|external_career_page");
    assert.ok(u);
    const path = "/job/USA-Houston/Software-Engineer_R12345";
    assert.equal(
      u.detailApi(path),
      "https://abb.wd3.myworkdayjobs.com/wday/cxs/abb/external_career_page/job/USA-Houston/Software-Engineer_R12345",
    );
  });

  it("rejects non-compound slugs", () => {
    assert.equal(workdayUrls("greenhouseco"), null);
    assert.equal(workdayUrls("a|b"), null);
    assert.equal(workdayUrls("a|b|c|d"), null);
    assert.equal(workdayUrls(""), null);
  });

  it("rejects malformed wd segment", () => {
    assert.equal(workdayUrls("acme|notwd|site"), null);
    assert.equal(workdayUrls("acme|wd|site"), null);
    assert.equal(workdayUrls("acme|wdabc|site"), null);
  });

  it("rejects empty segments", () => {
    assert.equal(workdayUrls("|wd1|site"), null);
    assert.equal(workdayUrls("acme|wd1|"), null);
    assert.equal(workdayUrls("|wd1|"), null);
  });

  it("returns null for non-string inputs", () => {
    assert.equal(workdayUrls(null), null);
    assert.equal(workdayUrls(undefined), null);
    assert.equal(workdayUrls(123), null);
  });
});

describe("PLATFORMS workday integration", () => {
  it("workday is registered in ATS_IDS", () => {
    assert.ok(ATS_IDS.includes("workday"), `ATS_IDS=${ATS_IDS.join(",")}`);
  });

  it("getPlatform('workday') returns a config", () => {
    const p = getPlatform("workday");
    assert.equal(p.id, "workday");
    assert.equal(typeof p.jobsApi, "function");
    assert.equal(typeof p.jobDetailApi, "function");
    assert.equal(typeof p.careersUrl, "function");
  });

  it("PLATFORMS.workday.jobsApi resolves through workdayUrls", () => {
    assert.equal(
      PLATFORMS.workday.jobsApi("marvell|wd1|marvellcareers"),
      "https://marvell.wd1.myworkdayjobs.com/wday/cxs/marvell/marvellcareers/jobs",
    );
    assert.equal(PLATFORMS.workday.jobsApi("bad slug"), null);
  });

  it("PLATFORMS.workday.jobDetailApi resolves through workdayUrls", () => {
    assert.equal(
      PLATFORMS.workday.jobDetailApi(
        "marvell|wd1|marvellcareers",
        "/job/India-Bangalore/RTL-Engineer_R456",
      ),
      "https://marvell.wd1.myworkdayjobs.com/wday/cxs/marvell/marvellcareers/job/India-Bangalore/RTL-Engineer_R456",
    );
  });

  it("PLATFORMS.workday.careersUrl resolves through workdayUrls", () => {
    assert.equal(
      PLATFORMS.workday.careersUrl("abb|wd3|external_career_page"),
      "https://abb.wd3.myworkdayjobs.com/external_career_page",
    );
  });

  it("all 5 ATSes are wired", () => {
    assert.deepEqual(
      ATS_IDS.sort(),
      ["ashby", "bamboohr", "greenhouse", "lever", "workday"],
    );
  });
});
