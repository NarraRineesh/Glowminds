import { deleteDoc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { resumeDocRef, loadUserResumes } from '@/utils/firestoreCollections'
import { apiFetch } from '@/services/apiClient'
import { invalidateEntitlementsCache } from '@/hooks/useEntitlements'

export { loadUserResumes }

function parseUpdatedAt(value) {
  if (!value) return new Date().toISOString()
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

/** Map Firestore resume doc → embed payload shape. */
export function resumeDocToEmbedRecord(doc) {
  const data = doc.data()
  const id = data.id || doc.id.replace(/^[^_]+_/, '')
  return {
    id,
    name: data.name || 'Untitled Resume',
    slug: data.slug || id,
    tags: Array.isArray(data.tags) ? data.tags : [],
    data: data.data,
    isLocked: !!data.isLocked,
    isPublic: !!data.isPublic,
    hasPassword: !!data.hasPassword,
    updatedAt: parseUpdatedAt(data.updatedAt),
  }
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

export async function saveEmbedResume(uid, resume) {
  if (!uid || !resume?.id) return

  const ref = resumeDocRef(uid, resume.id)
  const existing = await getDoc(ref)

  if (!existing.exists()) {
    await apiFetch('/resumes/register', { body: { resumeId: resume.id } })
    invalidateEntitlementsCache()
  }

  await setDoc(
    ref,
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

export async function deleteEmbedResume(uid, resumeId) {
  if (!uid || !resumeId) return
  await deleteDoc(resumeDocRef(uid, resumeId))
}
