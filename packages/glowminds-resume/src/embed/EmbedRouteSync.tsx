import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

type EmbedRouteSyncProps = {
	externalPath: string;
	onRouteChange?: (embedPath: string, replace: boolean) => void;
};

export function EmbedRouteSync({ externalPath, onRouteChange }: EmbedRouteSyncProps) {
	const router = useRouter();
	const syncingFromParent = useRef(false);
	const lastExternalPath = useRef(externalPath);

	useEffect(() => {
		if (!onRouteChange) return undefined;

		return router.history.subscribe(({ location, action }) => {
			if (syncingFromParent.current) {
				syncingFromParent.current = false;
				return;
			}
			onRouteChange(location.pathname, action.type === "REPLACE");
		});
	}, [onRouteChange, router]);

	useEffect(() => {
		if (externalPath === lastExternalPath.current) return;
		lastExternalPath.current = externalPath;

		const currentPath = router.state.location.pathname;
		if (currentPath === externalPath) return;

		syncingFromParent.current = true;

		if (externalPath.startsWith("/builder/")) {
			const resumeId = externalPath.split("/")[2];
			if (resumeId) {
				void router.navigate({ to: "/builder/$resumeId", params: { resumeId }, replace: true });
			}
		} else {
			void router.navigate({ to: "/local", replace: true });
		}
	}, [externalPath, router]);

	return null;
}
