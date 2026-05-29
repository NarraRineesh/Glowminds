import type { PropsWithChildren } from "react";
import type { Theme } from "@/libs/theme";
import { useEffect } from "react";
import { isEmbedded } from "@/embed/runtime";

type Props = PropsWithChildren<{ theme: Theme }>;

/** Applies route theme to the DOM (standalone only). Embed theme is owned by the copilot host. */
export function ThemeProvider({ children, theme }: Props) {
	useEffect(() => {
		if (isEmbedded()) return;

		document.documentElement.classList.toggle("dark", theme === "dark");
	}, [theme]);

	return children;
}
