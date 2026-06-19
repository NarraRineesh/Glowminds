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
