export function getReadableErrorMessage(error: unknown, fallback: string): string {
	if (typeof error === "string" && error) return error;
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}

export function getResumeErrorMessage(error: unknown): string {
	return getReadableErrorMessage(error, "Something went wrong. Please try again.");
}
