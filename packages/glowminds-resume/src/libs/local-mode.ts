import type { RightSidebarSection } from "@/libs/resume/section";

export const BUILDER_RIGHT_SIDEBAR_SECTIONS = [
	"template",
	"layout",
	"typography",
	"design",
	"styles",
	"page",
	"notes",
	"analysis",
	"export",
] as const satisfies readonly RightSidebarSection[];
