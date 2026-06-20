import type { ResumeData } from "@/lib/schema/resume/data";
import { defaultResumeData } from "@/lib/schema/resume/default";
import { glowmindsSampleResumeData } from "@/lib/schema/resume/glowminds-sample";
import { generateId, generateRandomName, slugify } from "@/lib/utils/string";
import { isEmbedded, getEmbedConfig } from "@/embed/runtime";
import { FREE_LIMITS, getEmbedIsPro } from "@/lib/plans";
import type { Resume } from "./draft";

const STANDALONE_INDEX_KEY = "rr:local-resume-index";
const EMBED_INDEX_KEY = "rr:glowminds-resume-index";

type StoredResume = Omit<Resume, "updatedAt"> & { updatedAt: string };

function indexKey() {
	return isEmbedded() ? EMBED_INDEX_KEY : STANDALONE_INDEX_KEY;
}

function resumeKey(id: string) {
	return isEmbedded() ? `rr:glowminds-resume:${id}` : `rr:local-resume:${id}`;
}

function defaultResumeName() {
	return isEmbedded() ? "Untitled Resume" : generateRandomName();
}

function serialize(resume: Resume): StoredResume {
	return { ...resume, updatedAt: resume.updatedAt.toISOString() };
}

function deserialize(stored: StoredResume): Resume {
	return { ...stored, updatedAt: new Date(stored.updatedAt) };
}

function readIndex(): string[] {
	if (typeof window === "undefined") return [];

	try {
		const raw = localStorage.getItem(indexKey());
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
	} catch {
		return [];
	}
}

function writeIndex(ids: string[]) {
	localStorage.setItem(indexKey(), JSON.stringify(ids));
}

function cloneResumeData(data: ResumeData): ResumeData {
	return structuredClone(data);
}

export class ResumeLimitError extends Error {
	constructor(message = "Free plan allows up to 3 resumes. Upgrade to Pro for unlimited resumes.") {
		super(message);
		this.name = "ResumeLimitError";
	}
}

function assertCanCreateLocalResume() {
	if (!isEmbedded() || getEmbedIsPro()) return;
	if (listLocalResumes().length >= FREE_LIMITS.resumes) {
		throw new ResumeLimitError();
	}
}

function notifyResumeLimit() {
	getEmbedConfig()?.onUpgrade?.();
}

export function listLocalResumes(): Resume[] {
	return readIndex()
		.map((id) => getLocalResume(id))
		.filter((resume): resume is Resume => resume !== null)
		.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getLocalResume(id: string): Resume | null {
	if (typeof window === "undefined") return null;

	try {
		const raw = localStorage.getItem(resumeKey(id));
		if (!raw) return null;
		return deserialize(JSON.parse(raw) as StoredResume);
	} catch {
		return null;
	}
}

type SaveLocalResumeOptions = {
	syncHost?: boolean;
};

export function saveLocalResume(resume: Resume, options: SaveLocalResumeOptions = {}): Resume {
	const { syncHost = true } = options;
	const stored = serialize({ ...resume, data: cloneResumeData(resume.data), updatedAt: new Date() });
	localStorage.setItem(resumeKey(resume.id), JSON.stringify(stored));

	const index = readIndex();
	const isNew = !index.includes(resume.id);
	if (isNew) {
		writeIndex([resume.id, ...index]);
	}

	const saved = deserialize(stored);
	if (syncHost) {
		void syncResumeWithHost(saved).catch((err) => {
			console.error("Failed to sync resume with host", err);
		});
	}
	return saved;
}

/** Remove all embed-scoped resume entries from localStorage. */
export function clearEmbedLocalResumes(): void {
	if (typeof window === "undefined" || !isEmbedded()) return;

	for (const id of readIndex()) {
		localStorage.removeItem(resumeKey(id));
	}
	writeIndex([]);
}

function resumeToEmbedRecord(resume: Resume): import("@/libs/copilot-bridge").CopilotEmbedResume {
	return {
		id: resume.id,
		name: resume.name,
		slug: resume.slug,
		tags: resume.tags,
		data: resume.data,
		isLocked: resume.isLocked,
		isPublic: resume.isPublic,
		hasPassword: resume.hasPassword,
		updatedAt: resume.updatedAt.toISOString(),
	};
}

async function syncResumeWithHost(resume: Resume) {
	const hook = getEmbedConfig()?.onResumeSave;
	if (hook) {
		await hook(resumeToEmbedRecord(resume));
		return;
	}
	const legacyHook = getEmbedConfig()?.onResumeCreate;
	if (legacyHook) await legacyHook();
}

export async function createLocalResume(input?: {
	name?: string;
	slug?: string;
	tags?: string[];
	withSampleData?: boolean;
}): Promise<Resume> {
	assertCanCreateLocalResume();
	const name = input?.name ?? defaultResumeName();
	const slug = input?.slug ?? slugify(name);
	const resume: Resume = {
		id: generateId(),
		name,
		slug,
		tags: input?.tags ?? [],
		data: cloneResumeData(input?.withSampleData ? glowmindsSampleResumeData : defaultResumeData),
		isLocked: false,
		isPublic: false,
		hasPassword: false,
		updatedAt: new Date(),
	};

	saveLocalResume(resume);
	return resume;
}

export async function createLocalResumeFromSample(): Promise<Resume> {
	return createLocalResume({
		name: "Sample Resume",
		tags: ["sample"],
		withSampleData: true,
	});
}

export function applyGlowmindsSampleToResume(id: string): Resume {
	const resume = getLocalResume(id);
	if (!resume) throw new Error("Resume not found");
	if (resume.isLocked) throw new Error("Resume is locked");

	return saveLocalResume({
		...resume,
		data: cloneResumeData(glowmindsSampleResumeData),
		updatedAt: new Date(),
	});
}

export function deleteLocalResume(id: string, options: SaveLocalResumeOptions = {}): void {
	const { syncHost = true } = options;
	localStorage.removeItem(resumeKey(id));
	writeIndex(readIndex().filter((resumeId) => resumeId !== id));
	if (!syncHost) return;
	const hook = getEmbedConfig()?.onResumeDelete;
	if (hook) {
		void hook(id).catch((err) => {
			console.error("Failed to delete resume on host", err);
		});
	}
}

export async function duplicateLocalResume(id: string): Promise<Resume> {
	assertCanCreateLocalResume();
	const source = getLocalResume(id);
	if (!source) throw new Error("Resume not found");

	const name = `${source.name} (Copy)`;
	const resume: Resume = {
		id: generateId(),
		name,
		slug: slugify(name),
		tags: [...source.tags],
		data: cloneResumeData(source.data),
		isLocked: false,
		isPublic: false,
		hasPassword: false,
		updatedAt: new Date(),
	};

	saveLocalResume(resume);
	return resume;
}

export function updateLocalResumeMetadata(
	id: string,
	metadata: { name?: string; slug?: string; tags?: string[] },
): Resume {
	const resume = getLocalResume(id);
	if (!resume) throw new Error("Resume not found");

	return saveLocalResume({
		...resume,
		name: metadata.name ?? resume.name,
		slug: metadata.slug ?? resume.slug,
		tags: metadata.tags ?? resume.tags,
	});
}

export function setLocalResumeLocked(id: string, isLocked: boolean): Resume {
	const resume = getLocalResume(id);
	if (!resume) throw new Error("Resume not found");

	return saveLocalResume({ ...resume, isLocked });
}

export async function importLocalResume(data: ResumeData, metadata?: { name?: string; slug?: string; tags?: string[] }): Promise<Resume> {
	assertCanCreateLocalResume();
	const name = metadata?.name ?? defaultResumeName();
	const resume: Resume = {
		id: generateId(),
		name,
		slug: metadata?.slug ?? slugify(name),
		tags: metadata?.tags ?? [],
		data: cloneResumeData(data),
		isLocked: false,
		isPublic: false,
		hasPassword: false,
		updatedAt: new Date(),
	};

	saveLocalResume(resume);
	return resume;
}

export { notifyResumeLimit };

export function getLocalResumeQueryKey(id: string) {
	return ["local-resume", id] as const;
}
