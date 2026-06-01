import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "@/components/layout/loading-screen";
import type { CopilotInitPayload } from "@/libs/copilot-bridge";
import { cn } from "@/lib/utils/style";
import { getEmbedRouter } from "@/embed/router";
import { clearEmbedConfig, setEmbedConfig } from "@/embed/runtime";
import { getLocale, loadLocale } from "@/libs/locale";

export type ResumeBuilderRootProps = CopilotInitPayload & {
	className?: string;
	initialPath?: string;
};

export function ResumeBuilderRoot(props: ResumeBuilderRootProps) {
	const { className, initialPath = "/local", ...config } = props;
	const [router, setRouter] = useState<Awaited<ReturnType<typeof getEmbedRouter>> | null>(null);
	const [i18nReady, setI18nReady] = useState(() => i18n.locale !== undefined);
	const resumeIdsKey = useMemo(
		() => (config.resumes ?? []).map((resume) => resume.id).join(","),
		[config.resumes],
	);
	const themeTokensKey = useMemo(() => JSON.stringify(config.themeTokens ?? {}), [config.themeTokens]);
	const isProKey = config.isPro === true ? "pro" : "free";

	useEffect(() => {
		setEmbedConfig(config);
	}, [resumeIdsKey, config.theme, themeTokensKey, config.user?.uid, isProKey]);

	useEffect(() => {
		let cancelled = false;

		void (async () => {
			await loadLocale(getLocale());
			if (cancelled) return;
			setI18nReady(true);

			const instance = await getEmbedRouter(initialPath);
			if (!cancelled) setRouter(instance);
		})();

		return () => {
			cancelled = true;
		};
	}, [initialPath]);

	useEffect(() => () => clearEmbedConfig(), []);

	return (
		<I18nProvider i18n={i18n}>
			{!router ? (
				i18nReady ? (
					<LoadingScreen />
				) : (
					<div className="flex h-full min-h-40 items-center justify-center bg-background" aria-busy="true" />
				)
			) : (
				<div className={cn("rr-embed flex h-full min-h-0 flex-col overflow-hidden", className)}>
					<RouterProvider router={router} />
				</div>
			)}
		</I18nProvider>
	);
}
