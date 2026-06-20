import { create } from 'zustand'
import {
  collection,
  addDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import {
  loadInterviewSessions,
  interviewSessionDocRef,
} from '@/utils/firestoreCollections'

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
  sessions: [],
  currentSessionId: null,

  reset: () => set({ sessions: [], currentSessionId: null, loading: false, loaded: false }),

  loadHistory: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return get().sessions
    if (!force && get().loaded) return get().sessions
    set({ loading: true })
    try {
      const sessions = await loadInterviewSessions(uid, 20)
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
      const ref = await addDoc(collection(db, 'interviewSessions'), {
        userId: uid,
        role: role || '',
        type: type || 'general',
        status: 'in-progress',
        questions: normalizedQs,
        totalScore: 0,
        createdAt: serverTimestamp(),
        completedAt: null,
      })
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
        interviewSessionDocRef(sid),
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
        interviewSessionDocRef(sid),
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
        interviewSessionDocRef(sid),
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
