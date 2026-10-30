import type { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";

export type FitMode = "contain" | "width";

/** Scale that fits content inside the wrapper, with optional padding (1 = flush). */
export function getFitScale(
	wrapper: { offsetWidth: number; offsetHeight: number },
	content: { offsetWidth: number; offsetHeight: number },
	padding = 0.95,
	mode: FitMode = "contain",
): number | null {
	const contentWidth = content.offsetWidth;
	const contentHeight = content.offsetHeight;
	if (contentWidth < 8 || contentHeight < 8) return null;
	if (wrapper.offsetWidth < 8 || wrapper.offsetHeight < 8) return null;

	if (mode === "width") return (wrapper.offsetWidth / contentWidth) * padding;

	return Math.min(wrapper.offsetWidth / contentWidth, wrapper.offsetHeight / contentHeight) * padding;
}

type FitControls = Pick<ReactZoomPanPinchContentRef, "centerView" | "setTransform" | "instance">;

/** Fit the transform content. Width mode scales to the screen and pins the first page to the top. */
export function fitPreviewToScreen(
	controls: FitControls,
	padding = 0.95,
	animationTime = 0,
	mode: FitMode = "contain",
): boolean {
	const wrapper = controls.instance.wrapperComponent;
	const content = controls.instance.contentComponent;
	if (!wrapper || !content) return false;

	const scale = getFitScale(wrapper, content, padding, mode);
	if (scale == null) return false;

	if (mode === "width") {
		const x = (wrapper.offsetWidth - content.offsetWidth * scale) / 2;
		controls.setTransform(x, 12, scale, animationTime);
		return true;
	}

	controls.centerView(scale, animationTime);
	return true;
}
