import type { CopilotInitPayload } from "@/libs/copilot-bridge";
import { isCopilotEmbed } from "@/libs/copilot-bridge";

let embedConfig: CopilotInitPayload | null = null;

export function setEmbedConfig(config: CopilotInitPayload | null) {
	embedConfig = config;
}

export function getEmbedConfig(): CopilotInitPayload | null {
	return embedConfig;
}

export function clearEmbedConfig() {
	embedConfig = null;
}

export function isPackageEmbed(): boolean {
	return embedConfig !== null;
}

export function isEmbedded(): boolean {
	return isPackageEmbed() || isCopilotEmbed();
}
