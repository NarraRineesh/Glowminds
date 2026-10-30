export type MobileOverlaySide = "left" | "right";

/** Which builder sidebar covers the preview on a phone. Null means the preview is showing. */
export function resolveMobileOverlay(
	current: MobileOverlaySide | null,
	side: MobileOverlaySide,
	forceState?: boolean,
): MobileOverlaySide | null {
	if (forceState === true) return side;
	if (forceState === false) return current === side ? null : current;
	return current === side ? null : side;
}
