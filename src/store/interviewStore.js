import { create } from 'zustand'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase'

// Persist interview practice sessions under users/{uid}/interviewSessions/{sid}.
// Each session stores MCQ questions, the user's picks, and the AI session
// summary that comes from /api/ai/evaluate-session (one call per session).

function sessionsColl(uid) {
  return collection(db, 'users', uid, 'interviewSessions')
}

function normalizeMcq(q, fallbackType) {
  const options = Array.isArray(q?.options) ? q.options.slice(0, 4).map((o) => String(o || '')) : []
  let correctIndex = Number(q?.correctIndex)
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) correctIndex = 0
  return {
    question: q?.question || q?.q || '',
    type: q?.type || fallbackType || 'general',
    difficulty: q?.difficulty || 'medium',
    options,
    correctIndex,
    explanation: q?.explanation || '',
    tips: q?.tips || '',
    hints: Array.isArray(q?.hints) ? q.hints.slice(0, 4) : [],
    selectedIndex: -1,
    isCorrect: false,
    evaluation: null,
  }
}

const useInterviewStore = create((set, get) => ({
  loading: false,
  loaded: false,
  sessions: [],         // recent sessions for history list
  currentSessionId: null,

  reset: () => set({ sessions: [], currentSessionId: null, loading: false, loaded: false }),

  // Cached: revisiting the Interview section uses the in-memory list. Pass
  // force:true to refresh (e.g. pull-to-refresh button if we add one).
  loadHistory: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return get().sessions
    if (!force && get().loaded) return get().sessions
    set({ loading: true })
    try {
      const q = query(sessionsColl(uid), orderBy('createdAt', 'desc'), limit(20))
      const snap = await getDocs(q)
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      set({ sessions, loading: false, loaded: true })
      return sessions
    } catch (err) {
      console.error('interviewStore.loadHistory:', err)
      set({ loading: false })
      return []
    }
  },

  startSession: async ({ role, type, questions }) => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    try {
      const normalizedQs = (questions || []).map((q) => normalizeMcq(q, type))
      const ref = await addDoc(sessionsColl(uid), {
        role: role || '',
        type: type || 'general',
        status: 'in-progress',
        questions: normalizedQs,
        totalScore: 0,
        createdAt: serverTimestamp(),
        completedAt: null,
      })
      // Mirror the new session into the in-memory list so cached loadHistory
      // calls keep showing the latest state without another Firestore read.
      set((s) => ({
        currentSessionId: ref.id,
        sessions: [
          {
            id: ref.id,
            role: role || '',
            type: type || 'general',
            status: 'in-progress',
            questions: normalizedQs,
            totalScore: 0,
            createdAt: new Date(),
            completedAt: null,
          },
          ...s.sessions,
        ],
      }))
      return ref.id
    } catch (err) {
      console.error('interviewStore.startSession:', err)
      return null
    }
  },

  // Persist a single MCQ choice. `selectedIndex` is the option the user picked
  // (-1 for skipped). We also stash the deterministic `isCorrect` flag so the
  // history view doesn't have to recompute it.
  saveAnswer: async ({ sessionId, questions, questionIndex, selectedIndex, evaluation }) => {
    const uid = auth.currentUser?.uid
    const sid = sessionId || get().currentSessionId
    if (!uid || !sid) return
    try {
      const updatedQuestions = (questions || []).map((q, i) => {
        if (i !== questionIndex) return q
        const idx = Number.isInteger(selectedIndex) ? selectedIndex : -1
        return {
          ...q,
          selectedIndex: idx,
          isCorrect: idx >= 0 && idx === q.correctIndex,
          evaluation: evaluation ?? q.evaluation ?? null,
        }
      })
      const totalScore = updatedQuestions.filter((q) => q.isCorrect).length
      await setDoc(
        doc(db, 'users', uid, 'interviewSessions', sid),
        { questions: updatedQuestions, totalScore, updatedAt: serverTimestamp() },
        { merge: true },
      )
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === sid ? { ...sess, questions: updatedQuestions, totalScore } : sess,
        ),
      }))
      return updatedQuestions
    } catch (err) {
      console.error('interviewStore.saveAnswer:', err)
      return questions
    }
  },

  appendQuestions: async ({ sessionId, questions, newQuestions }) => {
    const uid = auth.currentUser?.uid
    const sid = sessionId || get().currentSessionId
    if (!uid || !sid) return questions
    try {
      const merged = [
        ...(questions || []),
        ...(newQuestions || []).map((q) => normalizeMcq(q)),
      ]
      await setDoc(
        doc(db, 'users', uid, 'interviewSessions', sid),
        { questions: merged, updatedAt: serverTimestamp() },
        { merge: true },
      )
      return merged
    } catch (err) {
      console.error('interviewStore.appendQuestions:', err)
      return questions
    }
  },

  completeSession: async (sessionId) => {
    const uid = auth.currentUser?.uid
    const sid = sessionId || get().currentSessionId
    if (!uid || !sid) return
    try {
      await setDoc(
        doc(db, 'users', uid, 'interviewSessions', sid),
        { status: 'completed', completedAt: serverTimestamp() },
        { merge: true },
      )
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === sid ? { ...sess, status: 'completed' } : sess,
        ),
      }))
    } catch (err) {
      console.error('interviewStore.completeSession:', err)
    }
  },
}))

export default useInterviewStore
