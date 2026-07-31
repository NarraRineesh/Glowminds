import { t } from "@lingui/core/macro";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Suspense, useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper, useControls } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { ResumePreview } from "@/features/resume/preview/preview";
import { useIsMobile } from "@/hooks/use-mobile";
import { BuilderDock } from "./dock";
import { fitPreviewToScreen } from "./fit-to-screen";
import { DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT, getNextBuilderPreviewPageLayout } from "./page-layout";

/**
 * Fit the resume into the viewport once page size is known.
 * Re-runs on content resize so we don't lock in a pre-PDF measurement
 * (which grows from origin 0,0 and looks right-shifted).
 */
function FitPreviewOnOpen({ padding = 0.95 }: { padding?: number }) {
	const controls = useControls();
	const controlsRef = useRef(controls);
	controlsRef.current = controls;

	useEffect(() => {
		let cancelled = false;
		let debounceId = 0;
		let lastKey = "";
		let stableCount = 0;
		let observer: ResizeObserver | null = null;

		const run = (animationTime = 0) => {
			if (cancelled) return;
			const { instance } = controlsRef.current;
			const content = instance.contentComponent;
			if (!content) return;
			const key = `${content.offsetWidth}x${content.offsetHeight}`;
			if (key === lastKey) {
				stableCount += 1;
				return;
			}
			lastKey = key;
			stableCount = 0;
			fitPreviewToScreen(controlsRef.current, padding, animationTime);
		};

		const schedule = () => {
			window.clearTimeout(debounceId);
			debounceId = window.setTimeout(() => run(0), 40);
		};

		const attachObserver = () => {
			const content = controlsRef.current.instance.contentComponent;
			if (!content || observer || typeof ResizeObserver === "undefined") return;
			observer = new ResizeObserver(() => {
				if (stableCount > 2) return;
				schedule();
			});
			observer.observe(content);
		};

		// First attempts while PDF canvas sizes in; also retry observer attach.
		const bootTimers = [0, 120, 400, 900].map((ms) =>
			window.setTimeout(() => {
				attachObserver();
				run(0);
			}, ms),
		);

		attachObserver();

		return () => {
			cancelled = true;
			window.clearTimeout(debounceId);
			for (const id of bootTimers) window.clearTimeout(id);
			observer?.disconnect();
		};
	}, [controls.instance, padding]);

	return null;
}

export function PreviewPage() {
	const isMobile = useIsMobile();
	const [pageLayout, setPageLayout] = useState(DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT);

	useHotkey("Mod+S", () => {
		toast.info(t`Your changes are saved automatically.`, { id: "auto-save", icon: <FloppyDiskIcon /> });
	});

	return (
		<Suspense fallback={<LoadingScreen />}>
			<div className="absolute inset-0 h-full w-full bg-muted/30">
				<TransformWrapper
					centerOnInit
					maxScale={5}
					minScale={0.2}
					initialScale={isMobile ? 0.4 : 0.75}
					limitToBounds={false}
					wheel={{ step: 0.001 }}
					doubleClick={{ disabled: isMobile }}
				>
					<FitPreviewOnOpen padding={isMobile ? 0.94 : 0.9} />
					<TransformComponent wrapperClass="h-full! w-full!" contentClass="!w-max">
						<div className={isMobile ? "px-2 py-2" : undefined}>
							<ResumePreview showPageNumbers={!isMobile} pageLayout={pageLayout} />
						</div>
					</TransformComponent>

					<BuilderDock
						pageLayout={pageLayout}
						onTogglePageLayout={() => {
							setPageLayout((current) => getNextBuilderPreviewPageLayout(current));
						}}
					/>
				</TransformWrapper>
			</div>
		</Suspense>
	);
}
