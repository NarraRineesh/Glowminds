import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { v2Debug } from '@/utils/v2Debug'

function slugify(raw) {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

/** [v2:public] Build public payload from private profile */
export function buildPublicPayload(uid, profile, publicSettings = {}) {
  return {
    uid,
    slug: publicSettings.slug,
    enabled: !!publicSettings.enabled,
    name: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
      || profile?.displayName
      || 'Glowminds member',
    headline: profile?.headline || '',
    location: profile?.location || '',
    summary: profile?.summary || profile?.aiReview?.summaryDraft || '',
    skills: profile?.skills?.technical || [],
    experience: Array.isArray(profile?.experience) ? profile.experience : [],
    projects: Array.isArray(profile?.projects) ? profile.projects : [],
    education: Array.isArray(profile?.education) ? profile.education : [],
    links: profile?.links || {},
    showEmail: !!publicSettings.showEmail,
    showPhone: !!publicSettings.showPhone,
    email: publicSettings.showEmail ? profile?.email || '' : '',
    phone: publicSettings.showPhone ? profile?.phone || '' : '',
    publicResumeId: publicSettings.publicResumeId || null,
    stats: publicSettings.stats || { views: 0, resumeDownloads: 0 },
    updatedAt: serverTimestamp(),
  }
}

export async function isSlugTaken(slug, exceptUid) {
  const snap = await getDoc(doc(db, 'publicProfiles', slug))
  if (!snap.exists()) return false
  return snap.data()?.uid !== exceptUid
}

/** [v2:public] Publish or update public profile document */
export async function publishPublicProfile(uid, profile, settings) {
  const slug = slugify(settings.slug)
  if (!slug || slug.length < 3) throw new Error('Choose a URL slug (min 3 characters).')
  if (await isSlugTaken(slug, uid)) throw new Error('That profile URL is already taken.')

  // Remove previous slug doc if changed
  const prev = profile?.public?.slug
  if (prev && prev !== slug) {
    try {
      await deleteDoc(doc(db, 'publicProfiles', prev))
    } catch {
      // ignore
    }
  }

  const payload = buildPublicPayload(uid, profile, { ...settings, slug, enabled: true })
  await setDoc(doc(db, 'publicProfiles', slug), payload, { merge: true })
  v2Debug('public', 'published', slug)
  return { slug, payload }
}

export async function unpublishPublicProfile(slug) {
  if (!slug) return
  await deleteDoc(doc(db, 'publicProfiles', slug))
  v2Debug('public', 'unpublished', slug)
}

export async function getPublicProfile(slug) {
  const snap = await getDoc(doc(db, 'publicProfiles', slugify(slug)))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function bumpPublicStat(slug, field) {
  try {
    await updateDoc(doc(db, 'publicProfiles', slugify(slug)), {
      [`stats.${field}`]: increment(1),
    })
  } catch (err) {
    v2Debug('public', 'stat bump failed', err?.message)
  }
}

export { slugify }
