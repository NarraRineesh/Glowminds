import type React from "react";
import type { Layout } from "react-resizable-panels";
import type { BuilderLayout } from "./-store/sidebar";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import Cookies from "js-cookie";
import { useEffect, useRef } from "react";
import { usePanelRef } from "react-resizable-panels";
import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@/lib/ui/components/resizable";
import {
	useInitializeResumeStore,
	useMergeResumeMetadata,
	useResumeCleanup,
	useResumeStore,
} from "@/features/resume/builder/draft";
import { getLocalResume, getLocalResumeQueryKey } from "@/features/resume/builder/local-storage";
import { useIsMobile } from "@/hooks/use-mobile";
import { createNoindexFollowMeta } from "@/libs/seo";
import { cn } from "@/lib/utils/style";
import { isEmbedded } from "@/embed/runtime";
import { EyeIcon, PaletteIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { BuilderHeader } from "./-components/header";
import { BuilderSidebarLeft } from "./-sidebar/left";
import { BuilderSidebarRight } from "./-sidebar/right";
import {
	BUILDER_LAYOUT_COOKIE_NAME,
	DEFAULT_BUILDER_LAYOUT,
	mapPanelLayoutToBuilderLayout,
	parseBuilderLayoutCookie,
	useBuilderSidebar,
	useBuilderSidebarStore,
} from "./-store/sidebar";

export const Route = createFileRoute("/builder/$resumeId")({
	component: RouteComponent,
	loader: async ({ params, context }) => {
		const layout = await getBuilderLayout();
		const resume = getLocalResume(params.resumeId);
		if (!resume) throw redirect({ to: "/local", replace: true });

		context.queryClient.setQueryData(getLocalResumeQueryKey(params.resumeId), resume);
		return { layout, name: resume.name };
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [{ title: `${loaderData.name} - Resume Builder` }, createNoindexFollowMeta()]
			: [createNoindexFollowMeta()],
	}),
});

function RouteComponent() {
	const { layout: initialLayout } = Route.useLoaderData();

	const { resumeId } = Route.useParams();
	const { data: resume } = useSuspenseQuery({
		queryKey: getLocalResumeQueryKey(resumeId),
		queryFn: () => {
			const stored = getLocalResume(resumeId);
			if (!stored) throw new Error("Resume not found");
			return stored;
		},
	});
	const initializeResumeStore = useInitializeResumeStore();
	const mergeResumeMetadata = useMergeResumeMetadata();
	const isReady = useResumeStore((state) => state.isReady);
	const initializedResumeId = useResumeStore((state) => state.resumeId);
	const isInitialized = isReady && initializedResumeId === resumeId;

	useResumeCleanup();

	useEffect(() => {
		if (isInitialized) return;
		initializeResumeStore(resume);
	}, [initializeResumeStore, isInitialized, resume]);

	useEffect(() => {
		mergeResumeMetadata(resume);
	}, [
		mergeResumeMetadata,
		resume.id,
		resume.name,
		resume.slug,
		resume.tags,
		resume.isLocked,
		resume.isPublic,
		resume.hasPassword,
		resume.updatedAt,
		resume,
	]);

	if (!isInitialized) return null;

	return <BuilderLayoutShell initialLayout={initialLayout} />;
}

type BuilderLayoutShellProps = React.ComponentProps<"div"> & {
	initialLayout: BuilderLayout;
};

function BuilderLayoutShell({ initialLayout }: BuilderLayoutShellProps) {
	const isMobile = useIsMobile();
	const canPersistLayoutRef = useRef(false);

	const leftSidebarRef = usePanelRef();
	const rightSidebarRef = usePanelRef();

	const setLeftSidebar = useBuilderSidebarStore((state) => state.setLeftSidebar);
	const setRightSidebar = useBuilderSidebarStore((state) => state.setRightSidebar);
	const setLayout = useBuilderSidebarStore((state) => state.setLayout);

	const { maxSidebarSize, minSidebarSize, collapsedSidebarSize, groupResizeBehavior } = useBuilderSidebar((state) => ({
		maxSidebarSize: state.maxSidebarSize,
		minSidebarSize: state.minSidebarSize,
		collapsedSidebarSize: state.collapsedSidebarSize,
		groupResizeBehavior: state.groupResizeBehavior,
	}));

	useEffect(() => {
		setLayout(initialLayout);
		canPersistLayoutRef.current = true;
	}, [initialLayout, setLayout]);

	const onLayoutChanged = (layout: Layout) => {
		const nextLayout = mapPanelLayoutToBuilderLayout(layout);
		if (!canPersistLayoutRef.current) return;
		setLayout(nextLayout);
		setBuilderLayout(nextLayout);
	};

	useEffect(() => {
		if (!leftSidebarRef || !rightSidebarRef) return;

		setLeftSidebar(leftSidebarRef);
		setRightSidebar(rightSidebarRef);
	}, [leftSidebarRef, rightSidebarRef, setLeftSidebar, setRightSidebar]);

	const sidebarMinSize = isMobile ? "0%" : `${minSidebarSize}px`;
	const sidebarCollapsedSize = isMobile ? "0%" : `${collapsedSidebarSize}px`;
	const leftSidebarSize = isMobile ? "0%" : `${initialLayout.left}%`;
	const rightSidebarSize = isMobile ? "0%" : `${initialLayout.right}%`;
	const artboardSize = isMobile ? "100%" : `${initialLayout.artboard}%`;

	const embedded = isEmbedded();
	const shellHeight = embedded ? "h-full min-h-0" : "h-dvh";
	const panelHeight = embedded ? "h-full min-h-0" : "h-[calc(100dvh-3.5rem)]";

	return (
		<div className={cn("flex flex-col", shellHeight)}>
			<BuilderHeader />

			{isMobile ? (
				<MobileBuilderStage />
			) : (
				<ResizableGroup
					orientation="horizontal"
					className="mt-[calc(3.5rem+env(safe-area-inset-top))] min-h-0 flex-1"
					onLayoutChanged={onLayoutChanged}
				>
					<ResizablePanel
						collapsible
						id="left"
						panelRef={leftSidebarRef}
						groupResizeBehavior={groupResizeBehavior}
						maxSize={maxSidebarSize}
						minSize={sidebarMinSize}
						collapsedSize={sidebarCollapsedSize}
						defaultSize={leftSidebarSize}
						className={cn("z-20", panelHeight)}
					>
						<BuilderSidebarLeft />
					</ResizablePanel>
					<ResizableSeparator withHandle className="z-50 border-s" />
					<ResizablePanel
						id="artboard"
						defaultSize={artboardSize}
						className={cn("relative min-h-0 overflow-hidden", panelHeight)}
					>
						<Outlet />
					</ResizablePanel>
					<ResizableSeparator withHandle className="z-50 border-e" />
					<ResizablePanel
						collapsible
						id="right"
						panelRef={rightSidebarRef}
						groupResizeBehavior={groupResizeBehavior}
						maxSize={maxSidebarSize}
						minSize={sidebarMinSize}
						collapsedSize={sidebarCollapsedSize}
						defaultSize={rightSidebarSize}
						className={cn("z-20", panelHeight)}
					>
						<BuilderSidebarRight />
					</ResizablePanel>
				</ResizableGroup>
			)}
		</div>
	);
}

const MOBILE_TAB_CLEARANCE = "calc(3.75rem + env(safe-area-inset-bottom))";

function MobileBuilderStage() {
	const overlay = useBuilderSidebarStore((state) => state.mobileOverlay);
	const setMobileOverlay = useBuilderSidebarStore((state) => state.setMobileOverlay);

	useEffect(() => {
		if (!overlay) return undefined;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			useBuilderSidebarStore.getState().setMobileOverlay(null);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [overlay]);

	return (
		<div className="relative mt-[calc(3.5rem+env(safe-area-inset-top))] min-h-0 flex-1">
			<div
				className="absolute inset-x-0 top-0 min-h-0 overflow-hidden"
				style={{ bottom: MOBILE_TAB_CLEARANCE }}
			>
				<Outlet />
			</div>
			{overlay ? (
				<div
					className="absolute inset-x-0 top-0 z-40 flex min-h-0 flex-col bg-background"
					style={{ bottom: MOBILE_TAB_CLEARANCE }}
				>
					{overlay === "left" ? <BuilderSidebarLeft /> : <BuilderSidebarRight />}
				</div>
			) : null}
			<nav
				aria-label="Resume builder"
				className="absolute inset-x-0 bottom-0 z-50 border-t border-border bg-background px-5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
			>
				<div className="grid grid-cols-3 gap-2">
					<MobileBuilderTab
						label="Edit"
						icon={PencilSimpleIcon}
						selected={overlay === "left"}
						onSelect={() => setMobileOverlay("left")}
					/>
					<MobileBuilderTab
						label="Preview"
						icon={EyeIcon}
						selected={overlay == null}
						onSelect={() => setMobileOverlay(null)}
					/>
					<MobileBuilderTab
						label="Design"
						icon={PaletteIcon}
						selected={overlay === "right"}
						onSelect={() => setMobileOverlay("right")}
					/>
				</div>
			</nav>
		</div>
	);
}

function MobileBuilderTab({
	label,
	icon: Icon,
	selected,
	onSelect,
}: {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={onSelect}
			className={cn(
				"flex h-11 items-center justify-center gap-2 rounded-[var(--radius-panel,0.875rem)] border px-2 text-sm font-semibold",
				selected
					? "border-primary bg-primary text-primary-foreground"
					: "border-border bg-card text-foreground",
			)}
		>
			<Icon className="size-4" />
			{label}
		</button>
	);
}

const setBuilderLayout = (data: BuilderLayout) => {
	const layout = parseBuilderLayoutCookie(JSON.stringify(data));
	Cookies.set(BUILDER_LAYOUT_COOKIE_NAME, JSON.stringify(layout), { path: "/" });
};

const getBuilderLayout = (): BuilderLayout => {
	const layout = Cookies.get(BUILDER_LAYOUT_COOKIE_NAME);
	if (!layout) return DEFAULT_BUILDER_LAYOUT;
	return parseBuilderLayoutCookie(layout);
};
