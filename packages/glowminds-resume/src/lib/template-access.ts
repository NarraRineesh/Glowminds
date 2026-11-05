/**
 * Plan template allowance:
 * - `null` / `undefined`: Pro may use every template; Free may use `freeTemplate` only.
 * - `string`: only that template.
 * - `string[]`: only those templates.
 *
 * Pro catalog access is stored as `null` ("all"). A null limit is not the free template id.
 */
export type TemplateAllowance = string | readonly string[] | null | undefined;

export function isTemplateAllowed(
	template: string,
	allowance: TemplateAllowance,
	isPro: boolean,
	freeTemplate = "onyx",
): boolean {
	if (Array.isArray(allowance)) return allowance.includes(template);
	if (typeof allowance === "string" && allowance.length > 0) return template === allowance;
	if (isPro) return true;
	return template === freeTemplate;
}

export function fallbackTemplate(allowance: TemplateAllowance, freeTemplate = "onyx"): string {
	if (Array.isArray(allowance)) {
		const first = allowance.find((id) => typeof id === "string" && id.length > 0);
		if (first) return first;
	}
	if (typeof allowance === "string" && allowance.length > 0) return allowance;
	return freeTemplate;
}

export function nextTemplateId(
	current: string,
	allowance: TemplateAllowance,
	isPro: boolean,
	freeTemplate = "onyx",
): string {
	if (isTemplateAllowed(current, allowance, isPro, freeTemplate)) return current;
	return fallbackTemplate(allowance, freeTemplate);
}
