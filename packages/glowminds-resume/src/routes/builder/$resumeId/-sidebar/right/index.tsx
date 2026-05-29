import { Fragment, useCallback, useRef } from "react";
import { match } from "ts-pattern";
import { Button } from "@/lib/ui/components/button";
import { ScrollArea } from "@/lib/ui/components/scroll-area";
import { Separator } from "@/lib/ui/components/separator";
import { BUILDER_RIGHT_SIDEBAR_SECTIONS } from "@/libs/local-mode";
import { getSectionIcon, getSectionTitle } from "@/libs/resume/section";
import { BuilderSidebarEdge } from "../../-components/edge";
import { useBuilderSidebar } from "../../-store/sidebar";
import { CustomStylesSectionBuilder } from "./sections/custom-styles";
import { DesignSectionBuilder } from "./sections/design";
import { ExportSectionBuilder } from "./sections/export";
import { LayoutSectionBuilder } from "./sections/layout";
import { NotesSectionBuilder } from "./sections/notes";
import { PageSectionBuilder } from "./sections/page";
import { TemplateSectionBuilder } from "./sections/template";
import { TypographySectionBuilder } from "./sections/typography";

type BuilderRightSidebarSection = (typeof BUILDER_RIGHT_SIDEBAR_SECTIONS)[number];

function getSectionComponent(type: BuilderRightSidebarSection) {
	return match(type)
		.with("template", () => <TemplateSectionBuilder />)
		.with("layout", () => <LayoutSectionBuilder />)
		.with("typography", () => <TypographySectionBuilder />)
		.with("design", () => <DesignSectionBuilder />)
		.with("styles", () => <CustomStylesSectionBuilder />)
		.with("page", () => <PageSectionBuilder />)
		.with("notes", () => <NotesSectionBuilder />)
		.with("export", () => <ExportSectionBuilder />)
		.exhaustive();
}

export function BuilderSidebarRight() {
	const scrollAreaRef = useRef<HTMLDivElement | null>(null);
	const sections = BUILDER_RIGHT_SIDEBAR_SECTIONS;

	return (
		<>
			<SidebarEdge scrollAreaRef={scrollAreaRef} sections={sections} />

			<ScrollArea
				ref={scrollAreaRef}
				className="@container h-[calc(100svh-3.5rem)] overflow-hidden bg-background sm:me-12"
			>
				<div className="space-y-4 p-4">
					{sections.map((section) => (
						<Fragment key={section}>
							{getSectionComponent(section)}
							<Separator />
						</Fragment>
					))}
				</div>
			</ScrollArea>
		</>
	);
}

type SidebarEdgeProps = {
	scrollAreaRef: React.RefObject<HTMLDivElement | null>;
	sections: typeof BUILDER_RIGHT_SIDEBAR_SECTIONS;
};

function SidebarEdge({ scrollAreaRef, sections }: SidebarEdgeProps) {
	const toggleSidebar = useBuilderSidebar((state) => state.toggleSidebar);

	const scrollToSection = useCallback(
		(section: BuilderRightSidebarSection) => {
			if (!scrollAreaRef.current) return;
			toggleSidebar("right", true);

			const sectionElement = scrollAreaRef.current.querySelector(`#sidebar-${section}`);
			sectionElement?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
		},
		[toggleSidebar, scrollAreaRef],
	);

	return (
		<BuilderSidebarEdge side="right">
			<div className="no-scrollbar min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
				<div className="flex min-h-full flex-col items-center justify-center gap-y-2">
					{sections.map((section) => (
						<Button
							key={section}
							size="icon"
							variant="ghost"
							title={getSectionTitle(section)}
							onClick={() => scrollToSection(section)}
						>
							{getSectionIcon(section)}
						</Button>
					))}
				</div>
			</div>
		</BuilderSidebarEdge>
	);
}
