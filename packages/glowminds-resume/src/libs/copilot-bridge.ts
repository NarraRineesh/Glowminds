export const COPILOT_BRIDGE_SOURCE = "glowminds";
export const RR_BRIDGE_SOURCE = "glowminds-resume";

export const BridgeMessageType = {
	INIT: "copilot:init",
	THEME: "copilot:theme",
	READY: "rr:ready",
	RESUMES_CHANGED: "rr:resumes-changed",
} as const;

export type CopilotThemeTokens = {
	bg?: string;
	bg2?: string;
	surf?: string;
	surf2?: string;
	bdr?: string;
	txt?: string;
	txt2?: string;
	muted?: string;
	blu?: string;
	grn?: string;
	destructive?: string;
};

export type CopilotEmbedResume = {
	id: string;
	copilotId?: string;
	name: string;
	slug: string;
	tags: string[];
	data: unknown;
	isLocked: boolean;
	isPublic?: boolean;
	hasPassword?: boolean;
	updatedAt: string;
};

export type CopilotInitPayload = {
	theme: "light" | "dark";
	themeTokens?: CopilotThemeTokens;
	profile?: { snapshot?: unknown; raw?: unknown };
	user?: { uid?: string; email?: string; displayName?: string };
	resumes?: CopilotEmbedResume[];
	seedFromProfile?: boolean;
	isPro?: boolean;
	onUpgrade?: () => void;
};

type BridgeMessage =
	| { source: typeof COPILOT_BRIDGE_SOURCE; type: typeof BridgeMessageType.INIT; payload: CopilotInitPayload }
	| {
			source: typeof COPILOT_BRIDGE_SOURCE;
			type: typeof BridgeMessageType.THEME;
			payload: { theme: "light" | "dark"; themeTokens?: CopilotThemeTokens };
	  };


let embedState: CopilotInitPayload | null = null;
let bridgeInitialized = false;

export function isCopilotEmbed(): boolean {
	if (typeof window === "undefined") return false;
	return new URLSearchParams(window.location.search).get("embed") === "copilot";
}

export function getCopilotEmbedState(): CopilotInitPayload | null {
	return embedState;
}

function postToParent(message: Record<string, unknown>) {
	if (typeof window === "undefined" || window.parent === window) return;
	window.parent.postMessage({ source: RR_BRIDGE_SOURCE, ...message }, window.location.origin);
}

import { applyCopilotTheme } from "@/embed/theme";

async function handleInit(payload: CopilotInitPayload) {
	embedState = payload;
	applyCopilotTheme(payload.theme, payload.themeTokens);

	const { hydrateFromCopilot } = await import("@/features/resume/builder/copilot-storage");
	hydrateFromCopilot(payload);

	window.dispatchEvent(new CustomEvent("copilot:hydrated"));
}

function handleTheme(payload: { theme: "light" | "dark"; themeTokens?: CopilotThemeTokens }) {
	if (embedState) embedState.theme = payload.theme;
	applyCopilotTheme(payload.theme, payload.themeTokens);
}

function onMessage(event: MessageEvent) {
	if (event.origin !== window.location.origin) return;
	if (!isCopilotEmbed()) return;

	const data = event.data as BridgeMessage | undefined;
	if (!data || data.source !== COPILOT_BRIDGE_SOURCE) return;

	if (data.type === BridgeMessageType.INIT) {
		void handleInit(data.payload);
		return;
	}

	if (data.type === BridgeMessageType.THEME) {
		handleTheme(data.payload);
	}
}

export function initCopilotBridge() {
	if (bridgeInitialized || typeof window === "undefined") return;
	if (!isCopilotEmbed()) return;

	bridgeInitialized = true;
	window.addEventListener("message", onMessage);
	postToParent({ type: BridgeMessageType.READY });
}

/** Wait for parent copilot:init before booting the router (embed mode only). */
export function waitForCopilotInit(timeoutMs = 8000): Promise<void> {
	if (typeof window === "undefined" || !isCopilotEmbed()) return Promise.resolve();
	if (embedState) return Promise.resolve();

	return new Promise((resolve) => {
		const finish = () => {
			window.removeEventListener("copilot:hydrated", onHydrated);
			clearTimeout(timer);
			resolve();
		};

		const onHydrated = () => finish();
		const timer = window.setTimeout(finish, timeoutMs);

		window.addEventListener("copilot:hydrated", onHydrated);
	});
}

export function notifyCopilotResumesChanged() {
	if (!isCopilotEmbed()) return;

	import("@/features/resume/builder/copilot-storage").then(({ listCopilotSyncedResumes }) => {
		postToParent({
			type: BridgeMessageType.RESUMES_CHANGED,
			payload: { resumes: listCopilotSyncedResumes() },
		});
	});
}
