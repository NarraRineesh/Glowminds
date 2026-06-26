import { deleteDoc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { resumeDocRef, loadUserResumes } from '@/utils/firestoreCollections'
import { apiFetch } from '@/services/apiClient'
import { invalidateEntitlementsCache } from '@/hooks/useEntitlements'

export { loadUserResumes }

const CLOUD_SAVE_DEBOUNCE_MS = 1500
const pendingCloudSaves = new Map()
const FREE_TEMPLATE = 'onyx'

function clampResumeTemplateForPlan(resume, isPro) {
  if (isPro || !resume?.data?.metadata) return resume
  const template = resume.data.metadata.template
  if (!template || template === FREE_TEMPLATE) return resume
  return {
    ...resume,
    data: {
      ...resume.data,
      metadata: {
        ...resume.data.metadata,
        template: FREE_TEMPLATE,
      },
    },
  }
}

function parseUpdatedAt(value) {
  if (!value) return new Date().toISOString()
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export async function loadEmbedResumes(uid) {
  const docs = await loadUserResumes(uid)
  return docs.map((row) => ({
    id: row.id,
    name: row.name || 'Untitled Resume',
    slug: row.slug || row.id,
    tags: Array.isArray(row.tags) ? row.tags : [],
    data: row.data,
    isLocked: !!row.isLocked,
    isPublic: !!row.isPublic,
    hasPassword: !!row.hasPassword,
    updatedAt: parseUpdatedAt(row.updatedAt),
  }))
}

export function sanitizeLoadedEmbedResumes(resumes, isPro) {
  return (resumes ?? []).map((resume) => clampResumeTemplateForPlan(resume, isPro))
}

async function writeEmbedResume(uid, resume) {
  await setDoc(
    resumeDocRef(uid, resume.id),
    {
      userId: uid,
      id: resume.id,
      name: resume.name,
      slug: resume.slug,
      tags: resume.tags ?? [],
      data: resume.data,
      isLocked: !!resume.isLocked,
      isPublic: !!resume.isPublic,
      hasPassword: !!resume.hasPassword,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

async function registerEmbedResumeIfNeeded(uid, resume, isPro) {
  if (isPro) return

  const ref = resumeDocRef(uid, resume.id)
  const existing = await getDoc(ref)
  if (existing.exists()) return

  await apiFetch('/resumes/register', { body: { resumeId: resume.id } })
  invalidateEntitlementsCache()
}

export async function saveEmbedResumeImmediate(uid, resume, { isPro = false } = {}) {
  if (!uid || !resume?.id) return

  const sanitized = clampResumeTemplateForPlan(resume, isPro)
  await registerEmbedResumeIfNeeded(uid, sanitized, isPro)
  await writeEmbedResume(uid, sanitized)
}

export function scheduleEmbedResumeSave(uid, resume, { isPro = false } = {}) {
  if (!uid || !resume?.id) return

  const key = `${uid}:${resume.id}`
  const existing = pendingCloudSaves.get(key)
  if (existing) clearTimeout(existing.timer)

  const timer = setTimeout(() => {
    pendingCloudSaves.delete(key)
    void saveEmbedResumeImmediate(uid, resume, { isPro }).catch((err) => {
      console.error('Failed to save resume to Firestore', err)
    })
  }, CLOUD_SAVE_DEBOUNCE_MS)

  pendingCloudSaves.set(key, { timer, resume, isPro })
}

export async function flushEmbedResumeSave(uid, resume, { isPro = false } = {}) {
  if (!uid || !resume?.id) return

  const key = `${uid}:${resume.id}`
  const pending = pendingCloudSaves.get(key)
  if (pending) {
    clearTimeout(pending.timer)
    pendingCloudSaves.delete(key)
  }

  await saveEmbedResumeImmediate(uid, resume, { isPro })
}

export async function deleteEmbedResume(uid, resumeId) {
  if (!uid || !resumeId) return

  const key = `${uid}:${resumeId}`
  const pending = pendingCloudSaves.get(key)
  if (pending) {
    clearTimeout(pending.timer)
    pendingCloudSaves.delete(key)
  }

  await deleteDoc(resumeDocRef(uid, resumeId))
}
