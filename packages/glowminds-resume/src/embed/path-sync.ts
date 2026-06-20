export function embedPathFromResumeId(resumeId?: string): string {
	return resumeId ? `/builder/${resumeId}` : "/local";
}

export function dashboardPathFromEmbedPath(embedPath: string): string {
	const normalized = embedPath.replace(/\/$/, "") || "/local";
	if (normalized === "/local") return "/dashboard/resume";
	const match = normalized.match(/^\/builder\/([^/]+)/);
	if (match) return `/dashboard/resume/${match[1]}`;
	return "/dashboard/resume";
}

export function embedPathFromDashboardPath(pathname: string): string {
	const match = pathname.match(/^\/dashboard\/resume(?:\/([^/]+))?\/?$/);
	if (!match) return "/local";
	return match[1] ? `/builder/${match[1]}` : "/local";
}
