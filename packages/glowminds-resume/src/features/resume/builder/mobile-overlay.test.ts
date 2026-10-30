import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMobileOverlay } from "./mobile-overlay.ts";

describe("resolveMobileOverlay", () => {
	it("opens a closed sidebar", () => {
		assert.equal(resolveMobileOverlay(null, "left"), "left");
		assert.equal(resolveMobileOverlay(null, "right"), "right");
	});

	it("closes the sidebar that is already open", () => {
		assert.equal(resolveMobileOverlay("left", "left"), null);
		assert.equal(resolveMobileOverlay("right", "right"), null);
	});

	it("switches sides instead of stacking both panels", () => {
		assert.equal(resolveMobileOverlay("left", "right"), "right");
		assert.equal(resolveMobileOverlay("right", "left"), "left");
	});

	it("honors an explicit open or close", () => {
		assert.equal(resolveMobileOverlay(null, "left", true), "left");
		assert.equal(resolveMobileOverlay("right", "left", true), "left");
		assert.equal(resolveMobileOverlay("left", "left", false), null);
		assert.equal(resolveMobileOverlay("right", "left", false), "right");
	});
});
