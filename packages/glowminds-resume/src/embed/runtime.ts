import type { CopilotInitPayload } from "@/libs/copilot-bridge";
import { isCopilotEmbed } from "@/libs/copilot-bridge";

let embedConfig: CopilotInitPayload | null = null;

type EmbedRouteSyncConfig = {
	externalPath: string;
	onRouteChange?: (embedPath: string, replace: boolean) => void;
};

let embedRouteSync: EmbedRouteSyncConfig | null = null;
const embedRouteSyncListeners = new Set<() => void>();

export function setEmbedConfig(config: CopilotInitPayload | null) {
	embedConfig = config;
}

export function getEmbedConfig(): CopilotInitPayload | null {
	return embedConfig;
}

export function setEmbedRouteSync(config: EmbedRouteSyncConfig | null) {
	embedRouteSync = config;
	for (const listener of embedRouteSyncListeners) listener();
}

export function getEmbedRouteSync(): EmbedRouteSyncConfig | null {
	return embedRouteSync;
}

export function subscribeEmbedRouteSync(listener: () => void) {
	embedRouteSyncListeners.add(listener);
	return () => embedRouteSyncListeners.delete(listener);
}

export function clearEmbedConfig() {
	embedConfig = null;
	setEmbedRouteSync(null);
}

export function isPackageEmbed(): boolean {
	return embedConfig !== null;
}

export function isEmbedded(): boolean {
	return isPackageEmbed() || isCopilotEmbed();
}
