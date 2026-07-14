import { reviewResume } from "@glowminds/host/resume-ai";

export async function runResumeReview({
	resume,
	jobDescription = "",
}: {
	resume: unknown;
	jobDescription?: string;
}) {
	return reviewResume({ resume, jobDescription });
}
