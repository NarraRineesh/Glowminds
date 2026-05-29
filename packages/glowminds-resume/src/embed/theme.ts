import type { CopilotThemeTokens } from "@/libs/copilot-bridge";

const COPILOT_CSS_VARS = [
	"--copilot-bg",
	"--copilot-bg2",
	"--copilot-surf",
	"--copilot-surf2",
	"--copilot-bdr",
	"--copilot-txt",
	"--copilot-txt2",
	"--copilot-muted",
	"--copilot-blu",
	"--copilot-grn",
	"--copilot-destructive",
] as const;

/** Apply resume theme on the embed host — never on `document.documentElement`. */
export function applyCopilotTheme(
	theme: "light" | "dark",
	tokens: CopilotThemeTokens | undefined,
	host: HTMLElement,
) {
	host.setAttribute("data-theme", theme);
	host.classList.toggle("dark", theme === "dark");
	host.classList.add("copilot-embed");

	if (!tokens) return;

	const root = host.style;
	if (tokens.bg) root.setProperty("--copilot-bg", tokens.bg);
	if (tokens.bg2) root.setProperty("--copilot-bg2", tokens.bg2);
	if (tokens.surf) root.setProperty("--copilot-surf", tokens.surf);
	if (tokens.surf2) root.setProperty("--copilot-surf2", tokens.surf2);
	if (tokens.bdr) root.setProperty("--copilot-bdr", tokens.bdr);
	if (tokens.txt) root.setProperty("--copilot-txt", tokens.txt);
	if (tokens.txt2) root.setProperty("--copilot-txt2", tokens.txt2);
	if (tokens.muted) root.setProperty("--copilot-muted", tokens.muted);
	if (tokens.blu) root.setProperty("--copilot-blu", tokens.blu);
	if (tokens.grn) root.setProperty("--copilot-grn", tokens.grn);
	if (tokens.destructive) root.setProperty("--copilot-destructive", tokens.destructive);
}

export function clearCopilotTheme(host: HTMLElement) {
	host.classList.remove("copilot-embed", "dark");
	host.removeAttribute("data-theme");
	for (const name of COPILOT_CSS_VARS) {
		host.style.removeProperty(name);
	}
}
