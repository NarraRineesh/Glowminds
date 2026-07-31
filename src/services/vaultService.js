import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { deleteObject, ref, uploadBytes } from 'firebase/storage'
import { auth, db, storage } from '@/services/firebase'
import { API_BASE_URL } from '@/services/apiClient'
import { v2Debug } from '@/utils/v2Debug'

export const VAULT_CATEGORIES = [
  { id: 'resumes', label: 'Resumes' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'offer-letters', label: 'Offer letters' },
  { id: 'experience-letters', label: 'Experience letters' },
  { id: 'id-proofs', label: 'ID proofs' },
  { id: 'projects', label: 'Projects' },
  { id: 'others', label: 'Others' },
]

const FREE_QUOTA = 200 * 1024 * 1024
const PRO_QUOTA = 5 * 1024 * 1024 * 1024

/** Per-file upload cap (mirrors storage.rules). */
export const MAX_FILE_BYTES = 5 * 1024 * 1024

export function vaultQuotaBytes(isPro) {
  return isPro ? PRO_QUOTA : FREE_QUOTA
}

function toMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  const n = new Date(value).getTime()
  return Number.isFinite(n) ? n : 0
}

/** Storage path: everything under the user's uid. */
export function vaultStoragePath(uid, fileName) {
  const safeName = String(fileName || 'file').replace(/[^\w.\-()+\s]/g, '_')
  return `${uid}/vault/${Date.now()}_${safeName}`
}

/** [v2:vault] List user vault documents */
export async function listVaultDocs(uid) {
  const q = query(collection(db, 'users', uid, 'vault'), orderBy('uploadedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      uploadedAtMs: toMillis(data.uploadedAt),
    }
  })
}

/** [v2:vault] Upload file to Storage + metadata under `{uid}/vault/…`.
 * No public download URL is generated — files are read back through the
 * session-gated API so they can't be opened via a shareable link. */
export async function uploadVaultDoc({ uid, file, category = 'others' }) {
  if (!uid) throw new Error('Sign in required')
  const path = vaultStoragePath(uid, file.name)
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' })
  const meta = {
    name: file.name,
    category,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
    storagePath: path,
    uploadedAt: serverTimestamp(),
  }
  const docRef = await addDoc(collection(db, 'users', uid, 'vault'), meta)
  v2Debug('vault', 'uploaded', docRef.id, path)
  return { id: docRef.id, ...meta, uploadedAtMs: Date.now() }
}

/**
 * Fetch a vault file through the authenticated API and return a temporary
 * object URL. Requires an active session; the URL is short-lived and local
 * to this browser tab (revoke it when done).
 */
export async function getVaultObjectUrl(item) {
  const user = auth.currentUser
  if (!user) throw new Error('Sign in required')
  if (!item?.id) throw new Error('Invalid file')
  const token = await user.getIdToken()
  const res = await fetch(`${API_BASE_URL}/vault/file/${encodeURIComponent(item.id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Could not open file')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export async function deleteVaultDoc(uid, item) {
  if (item.storagePath) {
    try {
      await deleteObject(ref(storage, item.storagePath))
    } catch (err) {
      v2Debug('vault', 'storage delete failed', err?.message)
    }
  }
  await deleteDoc(doc(db, 'users', uid, 'vault', item.id))
  v2Debug('vault', 'deleted', item.id)
}

export async function updateVaultCategory(uid, id, category) {
  await updateDoc(doc(db, 'users', uid, 'vault', id), { category })
}

export function requireUid() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Sign in required')
  return uid
}
