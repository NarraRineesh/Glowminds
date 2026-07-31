import type { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";

/** Scale that fits content inside the wrapper, with optional padding (1 = flush). */
export function getFitScale(
	wrapper: { offsetWidth: number; offsetHeight: number },
	content: { offsetWidth: number; offsetHeight: number },
	padding = 0.95,
): number | null {
	const contentWidth = content.offsetWidth;
	const contentHeight = content.offsetHeight;
	if (contentWidth < 8 || contentHeight < 8) return null;
	if (wrapper.offsetWidth < 8 || wrapper.offsetHeight < 8) return null;

	return Math.min(wrapper.offsetWidth / contentWidth, wrapper.offsetHeight / contentHeight) * padding;
}

type FitControls = Pick<ReactZoomPanPinchContentRef, "centerView" | "instance">;

/** Fit + center the transform content. Returns false if size isn't ready yet. */
export function fitPreviewToScreen(controls: FitControls, padding = 0.95, animationTime = 0): boolean {
	const wrapper = controls.instance.wrapperComponent;
	const content = controls.instance.contentComponent;
	if (!wrapper || !content) return false;

	const scale = getFitScale(wrapper, content, padding);
	if (scale == null) return false;

	controls.centerView(scale, animationTime);
	return true;
}
