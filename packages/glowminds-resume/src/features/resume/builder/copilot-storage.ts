import type { ResumeData } from "@/lib/schema/resume/data";
import { resumeDataSchema } from "@/lib/schema/resume/data";
import type { CopilotEmbedResume, CopilotInitPayload } from "@/libs/copilot-bridge";
import type { Resume } from "@/features/resume/builder/draft";
import {
	deleteLocalResume,
	getLocalResume,
	listLocalResumes,
	saveLocalResume,
} from "@/features/resume/builder/local-storage";

const COPILOT_INDEX_KEY = "rr:copilot-resume-ids";

function readCopilotIndex(): string[] {
	if (typeof window === "undefined") return [];

	try {
		const raw = localStorage.getItem(COPILOT_INDEX_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
	} catch {
		return [];
	}
}

function writeCopilotIndex(ids: string[]) {
	localStorage.setItem(COPILOT_INDEX_KEY, JSON.stringify(ids));
}

function toResume(record: CopilotEmbedResume): Resume {
	const parsed = resumeDataSchema.parse(record.data) as ResumeData;

	return {
		id: record.id,
		name: record.name,
		slug: record.slug,
		tags: record.tags ?? [],
		data: parsed,
		isLocked: record.isLocked ?? false,
		isPublic: record.isPublic ?? false,
		hasPassword: record.hasPassword ?? false,
		updatedAt: new Date(record.updatedAt),
	};
}

export function hydrateFromCopilot(payload: CopilotInitPayload) {
	if (typeof window === "undefined") return;

	const incoming = payload.resumes ?? [];
	const trackedIds = readCopilotIndex();
	const incomingIds = new Set(incoming.map((resume) => resume.id));

	for (const id of trackedIds) {
		if (!incomingIds.has(id)) {
			deleteLocalResume(id);
		}
	}

	const nextIds: string[] = [];

	for (const record of incoming) {
		try {
			saveLocalResume(toResume(record));
			nextIds.push(record.id);
		} catch (error) {
			console.error("Failed to hydrate copilot resume", record.id, error);
		}
	}

	writeCopilotIndex(nextIds);
}

/** Upload browser-local resumes to the host when cloud storage is empty. */
export async function migrateLocalResumesToHost(
	onResumeSave?: (resume: import("@/libs/copilot-bridge").CopilotEmbedResume) => Promise<void>,
) {
	if (!onResumeSave) return;

	const local = listLocalResumes();
	if (local.length === 0) return;

	await Promise.all(
		local.map((resume) =>
			onResumeSave({
				id: resume.id,
				name: resume.name,
				slug: resume.slug,
				tags: resume.tags,
				data: resume.data,
				isLocked: resume.isLocked,
				isPublic: resume.isPublic,
				hasPassword: resume.hasPassword,
				updatedAt: resume.updatedAt.toISOString(),
			}).catch((err) => {
				console.error("Failed to migrate local resume", resume.id, err);
			}),
		),
	);
}

export function listCopilotSyncedResumes() {
	return readCopilotIndex()
		.map((id) => getLocalResume(id))
		.filter((resume): resume is Resume => resume !== null)
		.map((resume) => ({
			id: resume.id,
			name: resume.name,
			slug: resume.slug,
			tags: resume.tags,
			updatedAt: resume.updatedAt.toISOString(),
		}));
}

/** Resumes visible on the local dashboard (copilot-synced first when embedded). */
export function listDashboardResumes(): Resume[] {
	if (typeof window === "undefined") return listLocalResumes();

	const copilotIds = readCopilotIndex();
	if (copilotIds.length === 0) return listLocalResumes();

	const copilotResumes = copilotIds
		.map((id) => getLocalResume(id))
		.filter((resume): resume is Resume => resume !== null);

	if (copilotResumes.length > 0) return copilotResumes;
	return listLocalResumes();
}
