import type { IconProps } from "@phosphor-icons/react";
import type { Locale } from "@/lib/utils/locale";
import type { QueryClient } from "@tanstack/react-query";
import type { Theme } from "@/libs/theme";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { IconContext } from "@phosphor-icons/react";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet } from "@tanstack/react-router";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { DirectionProvider } from "@/lib/ui/components/direction";
import { Toaster } from "@/lib/ui/components/sonner";
import { TooltipProvider } from "@/lib/ui/components/tooltip";
import { DialogManager } from "@/dialogs/manager";
import { ThemeProvider } from "@/features/theme/provider";
import { ConfirmDialogProvider } from "@/hooks/use-confirm";
import { PromptDialogProvider } from "@/hooks/use-prompt";
import { EmbedRouteSync } from "@/embed/EmbedRouteSync";
import { getEmbedRouteSync, isPackageEmbed, subscribeEmbedRouteSync } from "@/embed/runtime";
import { getLocale, isRTL, loadLocale } from "@/libs/locale";
import { publicAsset } from "@/libs/public-asset";
import { getTheme } from "@/libs/theme";

type RouterContext = {
	theme: Theme;
	locale: Locale;
	queryClient: QueryClient;
};

const appName = "Resume Builder";
const title = `${appName} — Local`;
const description = "Create and edit resumes locally in your browser. No login or server required.";

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	head: () => {
		return {
			links: [
				{ rel: "icon", href: publicAsset("/favicon.ico"), type: "image/x-icon", sizes: "128x128" },
				{ rel: "icon", href: publicAsset("/favicon.svg"), type: "image/svg+xml", sizes: "256x256 any" },
			],
			meta: [
				{ title },
				{ charSet: "UTF-8" },
				{ name: "description", content: description },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ name: "theme-color", content: "#09090B" },
				{ name: "application-name", content: appName },
			],
		};
	},
	beforeLoad: async () => {
		const [theme, locale] = await Promise.all([getTheme(), getLocale()]);
		await loadLocale(locale);
		return { theme, locale };
	},
});

function RootComponent() {
	const { theme, locale, queryClient } = Route.useRouteContext();
	const dir = isRTL(locale) ? "rtl" : "ltr";
	const [routeSync, setRouteSync] = useState(getEmbedRouteSync);

	const iconContextValue = useMemo<IconProps>(() => ({ size: 16, weight: "regular" }), []);

	useEffect(() => {
		document.documentElement.lang = locale;
		document.documentElement.dir = dir;
	}, [dir, locale]);

	useEffect(() => subscribeEmbedRouteSync(() => setRouteSync(getEmbedRouteSync())), []);

	return (
		<>
			<HeadContent />

			<QueryClientProvider client={queryClient}>
				<MotionConfig reducedMotion="user">
					<LazyMotion features={domAnimation}>
						<I18nProvider i18n={i18n}>
							<IconContext.Provider value={iconContextValue}>
								<ThemeProvider theme={theme}>
									<HotkeysProvider>
										<DirectionProvider>
											<TooltipProvider>
												<ConfirmDialogProvider>
													<PromptDialogProvider>
														<Outlet />
														{isPackageEmbed() && routeSync ? (
															<EmbedRouteSync
																externalPath={routeSync.externalPath}
																onRouteChange={routeSync.onRouteChange}
															/>
														) : null}

														<DialogManager />
														<Toaster richColors position="bottom-right" />
													</PromptDialogProvider>
												</ConfirmDialogProvider>
											</TooltipProvider>
										</DirectionProvider>
									</HotkeysProvider>
								</ThemeProvider>
							</IconContext.Provider>
						</I18nProvider>
					</LazyMotion>
				</MotionConfig>
			</QueryClientProvider>
		</>
	);
}
