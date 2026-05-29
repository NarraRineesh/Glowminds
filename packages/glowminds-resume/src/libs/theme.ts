import Cookies from "js-cookie";
import z from "zod";
import { getEmbedConfig, isEmbedded } from "@/embed/runtime";
import { getCopilotEmbedState } from "@/libs/copilot-bridge";

const themeSchema = z.union([z.literal("light"), z.literal("dark")]);

export type Theme = z.infer<typeof themeSchema>;

const storageKey = "theme";
const defaultTheme: Theme = "dark";

export function isTheme(theme: string): theme is Theme {
	return themeSchema.safeParse(theme).success;
}

export const getTheme = () => {
	const packageTheme = getEmbedConfig()?.theme;
	if (packageTheme === "light" || packageTheme === "dark") return packageTheme;

	if (isEmbedded()) {
		const copilotTheme = getCopilotEmbedState()?.theme;
		if (copilotTheme === "light" || copilotTheme === "dark") return copilotTheme;
		return defaultTheme;
	}

	const theme = Cookies.get(storageKey);
	if (!theme || !isTheme(theme)) return defaultTheme;
	return theme;
};
