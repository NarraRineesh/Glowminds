import type { ResumeData } from "@/lib/schema/resume/data";
import type { WritableDraft } from "immer";
import { getEmbedConfig, isPackageEmbed } from "@/embed/runtime";
import { nextTemplateId, isTemplateAllowed } from "@/lib/template-access";

export const FREE_LIMITS = {
	resumes: 1,
	template: "onyx" as const,
};

/** Standalone resume builder is unrestricted; embedded dashboard honors host tier. */
export function getEmbedIsPro(): boolean {
	if (!isPackageEmbed()) return true;
	return getEmbedConfig()?.isPro === true;
}

export function requestEmbedUpgrade(): void {
	getEmbedConfig()?.onUpgrade?.();
}

export function canUseTemplate(template: string): boolean {
	if (!isPackageEmbed()) return true;
	const config = getEmbedConfig();
	return isTemplateAllowed(template, config?.templateAllowance, config?.isPro === true, FREE_LIMITS.template);
}

function allowedTemplateId(current: string): ResumeData["metadata"]["template"] {
	if (!isPackageEmbed()) return current as ResumeData["metadata"]["template"];
	const config = getEmbedConfig();
	return nextTemplateId(
		current,
		config?.templateAllowance,
		config?.isPro === true,
		FREE_LIMITS.template,
	) as ResumeData["metadata"]["template"];
}

/** Reset disallowed templates for the current embed plan (e.g. imported JSON or devtools edits). */
export function clampTemplateForPlan(data: ResumeData): ResumeData {
	const next = allowedTemplateId(data.metadata.template);
	if (next === data.metadata.template) return data;

	return {
		...data,
		metadata: {
			...data.metadata,
			template: next,
		},
	};
}

export function clampTemplateDraftForPlan(draft: WritableDraft<ResumeData>) {
	const next = allowedTemplateId(draft.metadata.template);
	if (next === draft.metadata.template) return;
	draft.metadata.template = next;
}
