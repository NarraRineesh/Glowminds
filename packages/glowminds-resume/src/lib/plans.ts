import type { ResumeData } from "@/lib/schema/resume/data";
import type { WritableDraft } from "immer";
import { getEmbedConfig, isPackageEmbed } from "@/embed/runtime";

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

export function isFreeTemplate(template: string): boolean {
	return template === FREE_LIMITS.template;
}

export function canUseTemplate(template: string): boolean {
	return getEmbedIsPro() || isFreeTemplate(template);
}

/** Reset disallowed templates for the current embed plan (e.g. imported JSON or devtools edits). */
export function clampTemplateForPlan(data: ResumeData): ResumeData {
	if (canUseTemplate(data.metadata.template)) return data;

	return {
		...data,
		metadata: {
			...data.metadata,
			template: FREE_LIMITS.template,
		},
	};
}

export function clampTemplateDraftForPlan(draft: WritableDraft<ResumeData>) {
	if (canUseTemplate(draft.metadata.template)) return;
	draft.metadata.template = FREE_LIMITS.template;
}
