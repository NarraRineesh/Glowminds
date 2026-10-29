import { slugify } from "./string";

export function generateFilename(prefix: string, extension?: string) {
	const cleaned = String(prefix || "Resume")
		.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
		.replace(/\s+/g, " ")
		.trim();
	const name = cleaned || slugify(prefix) || "Resume";
	return `${name}${extension ? `.${extension}` : ""}`;
}

export function downloadWithAnchor(blob: Blob, filename: string) {
	const a = document.createElement("a");
	const url = URL.createObjectURL(blob);

	a.href = url;
	a.rel = "noopener";
	a.download = filename;

	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadFromUrl(url: string, filename: string) {
	const response = await fetch(url);
	const blob = await response.blob();

	downloadWithAnchor(blob, filename);
}
