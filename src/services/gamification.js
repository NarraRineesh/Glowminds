/**
 * Career OS gamification + score history helpers.
 * Persists on users/{uid}.profile.gamification and users/{uid}/scoreHistory.
 */
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import {
  createDefaultGamification,
  normalizeGamification,
} from '@/constants/schema'
import { v2Debug } from '@/utils/v2Debug'

const XP_PER_LEVEL = 500

const XP_EVENTS = {
  daily: 10,
  learning: 25,
  ats: 15,
  apply: 20,
  interview: 30,
  linkedin: 15,
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function weekStartKey(d = new Date()) {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x.toISOString().slice(0, 10)
}

function dayIndex(d = new Date()) {
  return (d.getDay() + 6) % 7
}

function yesterdayKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

async function readGamification(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return createDefaultGamification()
  return normalizeGamification(snap.data()?.profile?.gamification)
}

async function writeGamification(uid, gamification) {
  await updateDoc(doc(db, 'users', uid), {
    'profile.gamification': gamification,
    updatedAt: serverTimestamp(),
  })
}

/** Record a calendar day of activity and refresh streak / week dots. */
export async function recordActivityDay(uid) {
  if (!uid) return null
  try {
    const g = await readGamification(uid)
    const today = todayKey()
    if (g.lastActiveDate === today) return g

    const week = [...g.weekActive]
    week[dayIndex()] = true

    let streak = 1
    if (g.lastActiveDate === yesterdayKey()) streak = (g.streak || 0) + 1
    else if (g.lastActiveDate) streak = 1

    const next = {
      ...g,
      streak,
      bestStreak: Math.max(g.bestStreak || 0, streak),
      lastActiveDate: today,
      weekActive: week,
    }
    await writeGamification(uid, next)
    v2Debug('gamification', 'activity day', streak)
    return next
  } catch (err) {
    v2Debug('gamification', 'recordActivityDay failed', err?.message)
    return null
  }
}

/** Award XP for a named event; bumps level when threshold crossed. */
export async function awardXp(uid, eventKey, amount) {
  if (!uid) return null
  const pts = amount ?? XP_EVENTS[eventKey] ?? 0
  if (!pts) return null
  try {
    await recordActivityDay(uid)
    const g = await readGamification(uid)
    const ws = weekStartKey()
    const xpWeek = g.xpWeekStart === ws ? (g.xpWeek || 0) + pts : pts
    const xp = (g.xp || 0) + pts
    const level = Math.floor(xp / XP_PER_LEVEL) + 1
    const next = {
      ...g,
      xp,
      xpWeek,
      xpWeekStart: ws,
      level,
    }
    await writeGamification(uid, next)
    v2Debug('gamification', 'xp', eventKey, pts, 'level', level)
    return next
  } catch (err) {
    v2Debug('gamification', 'awardXp failed', err?.message)
    return null
  }
}

export async function unlockBadge(uid, badge) {
  if (!uid || !badge?.id) return null
  try {
    const g = await readGamification(uid)
    if ((g.badges || []).some((b) => b.id === badge.id)) return g
    const next = {
      ...g,
      badges: [...(g.badges || []), { ...badge, unlockedAt: new Date().toISOString() }],
    }
    await writeGamification(uid, next)
    return next
  } catch (err) {
    v2Debug('gamification', 'unlockBadge failed', err?.message)
    return null
  }
}

export async function updateGamificationPrefs(uid, prefsPartial) {
  if (!uid) return null
  const g = await readGamification(uid)
  const next = { ...g, prefs: { ...g.prefs, ...prefsPartial } }
  await writeGamification(uid, next)
  return next
}

/** Snapshot career scores for sparklines (max kept client-side when reading). */
export async function snapshotScores(uid, scores) {
  if (!uid || !scores) return
  try {
    await addDoc(collection(db, 'users', uid, 'scoreHistory'), {
      ...scores,
      createdAt: serverTimestamp(),
    })
    v2Debug('gamification', 'score snapshot')
  } catch (err) {
    v2Debug('gamification', 'snapshotScores failed', err?.message)
  }
}

export async function loadScoreHistory(uid, max = 12) {
  if (!uid) return []
  try {
    const q = query(
      collection(db, 'users', uid, 'scoreHistory'),
      orderBy('createdAt', 'desc'),
      limit(max),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()
  } catch (err) {
    v2Debug('gamification', 'loadScoreHistory failed', err?.message)
    return []
  }
}

export function xpToNextLevel(g) {
  const level = g?.level || 1
  const xp = g?.xp || 0
  const nextThreshold = level * XP_PER_LEVEL
  return { xpInLevel: xp % XP_PER_LEVEL, xpToNext: XP_PER_LEVEL, nextThreshold }
}

export { XP_EVENTS, XP_PER_LEVEL }
