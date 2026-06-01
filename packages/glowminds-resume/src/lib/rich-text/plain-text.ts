function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** Flatten rich HTML to plain text for the AI paraphrase API. */
export function htmlToPlainText(html: string | undefined): string {
	if (!html) return "";

	return html
		.replace(/<\/li>/gi, "\n")
		.replace(/<\/p>/gi, "\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/** Convert AI plain-text output back into resume-friendly HTML. */
export function plainTextToResumeHtml(text: string): string {
	const lines = text
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);

	if (!lines.length) return "<p></p>";

	const isBullet = (line: string) => /^[-•*]\s/.test(line) || /^\d+\.\s/.test(line);
	const bulletCount = lines.filter(isBullet).length;

	if (bulletCount >= Math.max(1, Math.ceil(lines.length * 0.5))) {
		const items = lines
			.map((line) => {
				const content = line.replace(/^[-•*]\s+/, "").replace(/^\d+\.\s+/, "").trim();
				return `<li><p>${escapeHtml(content)}</p></li>`;
			})
			.join("");
		return `<ul>${items}</ul>`;
	}

	return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}
