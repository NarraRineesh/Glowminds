import type { ResumeData } from "@/lib/schema/resume/data";
import { defaultResumeData } from "@/lib/schema/resume/default";
import { sampleResumeData } from "@/lib/schema/resume/sample";
import { generateId, generateRandomName, slugify } from "@/lib/utils/string";
import { isEmbedded } from "@/embed/runtime";
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

export function saveLocalResume(resume: Resume): Resume {
	const stored = serialize({ ...resume, data: cloneResumeData(resume.data), updatedAt: new Date() });
	localStorage.setItem(resumeKey(resume.id), JSON.stringify(stored));

	const index = readIndex();
	if (!index.includes(resume.id)) {
		writeIndex([resume.id, ...index]);
	}

	return deserialize(stored);
}

export function createLocalResume(input?: {
	name?: string;
	slug?: string;
	tags?: string[];
	withSampleData?: boolean;
}): Resume {
	const name = input?.name ?? defaultResumeName();
	const slug = input?.slug ?? slugify(name);
	const resume: Resume = {
		id: generateId(),
		name,
		slug,
		tags: input?.tags ?? [],
		data: cloneResumeData(input?.withSampleData ? sampleResumeData : defaultResumeData),
		isLocked: false,
		isPublic: false,
		hasPassword: false,
		updatedAt: new Date(),
	};

	saveLocalResume(resume);
	return resume;
}

export function deleteLocalResume(id: string): void {
	localStorage.removeItem(resumeKey(id));
	writeIndex(readIndex().filter((resumeId) => resumeId !== id));
}

export function duplicateLocalResume(id: string): Resume {
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

export function importLocalResume(data: ResumeData, metadata?: { name?: string; slug?: string; tags?: string[] }): Resume {
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

export function getLocalResumeQueryKey(id: string) {
	return ["local-resume", id] as const;
}
