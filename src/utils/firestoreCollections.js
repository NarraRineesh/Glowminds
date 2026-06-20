import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/services/firebase'

export function savedJobDocId(uid, jobId) {
  return `${uid}_${jobId}`
}

export function resumeDocId(uid, resumeId) {
  return `${uid}_${resumeId}`
}

export function savedJobRef(uid, jobId) {
  return doc(db, 'savedJobs', savedJobDocId(uid, jobId))
}

export function resumeDocRef(uid, resumeId) {
  return doc(db, 'resumes', resumeDocId(uid, resumeId))
}

export function applicationDocRef(appId) {
  return doc(db, 'applications', appId)
}

export function notificationDocRef(notifId) {
  return doc(db, 'notifications', notifId)
}

export function aiChatDocRef(chatId) {
  return doc(db, 'aiChats', chatId)
}

export function interviewSessionDocRef(sessionId) {
  return doc(db, 'interviewSessions', sessionId)
}

export function userEntitlementsDocRef(uid) {
  return doc(db, 'userEntitlements', uid)
}

export async function loadUserUsage(uid) {
  const usageSnap = await getDoc(userEntitlementsDocRef(uid))
  if (!usageSnap.exists()) {
    return { usage: {}, updatedAt: null }
  }
  const data = usageSnap.data()
  return {
    usage: data.usage && typeof data.usage === 'object' ? data.usage : {},
    updatedAt: data.updatedAt || null,
  }
}

export async function loadApplications(uid) {
  const q = query(
    collection(db, 'applications'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function loadNotifications(uid, max = 50) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function loadAiChats(uid, max = 20) {
  const q = query(
    collection(db, 'aiChats'),
    where('userId', '==', uid),
    orderBy('updatedAt', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function loadInterviewSessions(uid, max = 20) {
  const q = query(
    collection(db, 'interviewSessions'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function loadSavedJobs(uid) {
  const q = query(collection(db, 'savedJobs'), where('userId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    const id = data.jobId || data.id || d.id.replace(`${uid}_`, '')
    return { ...data, id }
  })
}

export async function loadResume(uid, resumeId) {
  const snap = await getDoc(resumeDocRef(uid, resumeId))
  if (!snap.exists()) return null
  return { id: resumeId, ...snap.data() }
}

export async function loadUserResumes(uid) {
  const q = query(collection(db, 'resumes'), where('userId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    const id = data.id || d.id.replace(`${uid}_`, '')
    return { id, ...data }
  })
}
