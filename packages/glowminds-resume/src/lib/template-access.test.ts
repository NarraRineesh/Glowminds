import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTemplateAllowed, nextTemplateId } from "./template-access.ts";

describe("isTemplateAllowed", () => {
	it("lets Pro use every template when the plan limit is null", () => {
		for (const id of ["onyx", "azurill", "ditto", "kakuna"]) {
			assert.equal(isTemplateAllowed(id, null, true), true);
			assert.equal(isTemplateAllowed(id, undefined, true), true);
		}
	});

	it("lets a multi-template plan use only the listed ids", () => {
		const allowance = ["ditto", "kakuna"] as const;
		assert.equal(isTemplateAllowed("ditto", allowance, true), true);
		assert.equal(isTemplateAllowed("kakuna", allowance, true), true);
		assert.equal(isTemplateAllowed("azurill", allowance, true), false);
		assert.equal(isTemplateAllowed("onyx", allowance, true), false);
	});

	it("keeps Free on the single allowed template", () => {
		assert.equal(isTemplateAllowed("onyx", "onyx", false), true);
		assert.equal(isTemplateAllowed("azurill", "onyx", false), false);
		assert.equal(isTemplateAllowed("onyx", undefined, false), true);
		assert.equal(isTemplateAllowed("ditto", undefined, false), false);
	});

	it("does not treat a null Pro limit as the free template id", () => {
		assert.equal(nextTemplateId("azurill", null, true), "azurill");
		assert.equal(nextTemplateId("azurill", "onyx", false), "onyx");
		assert.equal(nextTemplateId("azurill", ["ditto", "kakuna"], true), "ditto");
		assert.equal(nextTemplateId("kakuna", ["ditto", "kakuna"], true), "kakuna");
	});
});
