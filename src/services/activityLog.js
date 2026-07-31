import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { v2Debug } from '@/utils/v2Debug'

/** [v2:activity] Append a lightweight career activity event for Dashboard + Analytics */
export async function logActivity(uid, { type, title, meta = {} }) {
  if (!uid || !type) return
  try {
    await addDoc(collection(db, 'users', uid, 'activity'), {
      type,
      title: title || type,
      meta,
      createdAt: serverTimestamp(),
    })
    v2Debug('activity', 'logged', type, title)
  } catch (err) {
    v2Debug('activity', 'log failed', err?.message)
  }
}

/** [v2:activity] Load recent activity (newest first) */
export async function loadActivity(uid, max = 20) {
  if (!uid) return []
  try {
    const q = query(
      collection(db, 'users', uid, 'activity'),
      orderBy('createdAt', 'desc'),
      limit(max),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    v2Debug('activity', 'load failed', err?.message)
    return []
  }
}
