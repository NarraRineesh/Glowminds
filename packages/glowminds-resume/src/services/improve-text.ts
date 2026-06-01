import { improveText, IMPROVE_TONES } from "@glowminds/host/resume-ai";

export { IMPROVE_TONES, improveText };

export async function improveResumeText({
	text,
	tone = "professional",
}: {
	text: string;
	tone?: string;
}) {
	return improveText({ text, tone });
}
