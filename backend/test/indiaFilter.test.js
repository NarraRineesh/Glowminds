import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isIndiaLocation } from "../src/sync/indiaFilter.js";

describe("isIndiaLocation", () => {
  describe("positive cases (in India)", () => {
    const cases = [
      ["Bengaluru, India", "classic india"],
      ["Bangalore", "city only"],
      ["Mumbai, India", "mumbai india"],
      ["Pune", "pune"],
      ["Hyderabad, IN", "IN suffix indian city"],
      ["New Delhi", "new delhi"],
      ["Navi Mumbai", "navi mumbai"],
      ["IND - Bangalore - Embassy Tech Village", "avis budget workday format"],
      ["Mysuru", "mysuru"],
      ["Hosur, India", "hosur"],
      ["IND", "just country code"],
      ["India", "just country name"],
      ["Remote, India", "remote india"],
      ["Bengaluru / Mumbai", "multi city"],
      ["Bengaluru, Indiana", "indian city wins over US state"],
      ["Bangalore / Indianapolis", "indian city wins over US Indianapolis"],
    ];
    for (const [text, note] of cases) {
      it(note, () => {
        assert.equal(isIndiaLocation(text), true, `expected IN for ${text}`);
      });
    }
  });

  describe("negative cases (not India)", () => {
    const cases = [
      ["Indianapolis, IN", "US Indianapolis with state code IN"],
      ["Indianapolis, Indiana", "US Indianapolis full state name"],
      ["Carmel, IN", "Carmel Indiana"],
      ["South Bend, IN", "South Bend Indiana"],
      ["Valparaiso, IN", "Valparaiso Indiana"],
      ["Fort Wayne, Indiana", "Fort Wayne Indiana"],
      ["Bloomington, IN", "Bloomington Indiana"],
      ["Indianapolis, IN, USA", "USA Indianapolis"],
      ["New York, NY", "NY not IN"],
      ["Remote - US", "US remote"],
      ["", "empty string"],
      ["Singapore", "singapore"],
      ["London, UK", "london uk"],
      ["Dublin, Ireland", "dublin ireland"],
      ["Anywhere", "generic"],
      ["Indian Wells, CA", "Indian Wells California"],
      ["American Indian Heritage Center, OK", "compound 'Indian' word"],
    ];
    for (const [text, note] of cases) {
      it(note, () => {
        assert.equal(
          isIndiaLocation(text),
          false,
          `expected NOT-IN for ${text}`,
        );
      });
    }
  });

  describe("input validation", () => {
    it("returns false for null", () => {
      assert.equal(isIndiaLocation(null), false);
    });
    it("returns false for undefined", () => {
      assert.equal(isIndiaLocation(undefined), false);
    });
    it("returns false for non-string", () => {
      assert.equal(isIndiaLocation(123), false);
      assert.equal(isIndiaLocation({}), false);
      assert.equal(isIndiaLocation([]), false);
    });
  });
});
