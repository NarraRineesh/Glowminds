/** Resolve a public/ path that works when the app is hosted under a subpath (e.g. /resume-builder/). */
export function publicAsset(path: string): string {
	const base = import.meta.env.BASE_URL;
	const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
	return `${base}${normalizedPath}`;
}
