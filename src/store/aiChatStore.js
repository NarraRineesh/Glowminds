import { create } from 'zustand'
import {
  doc,
  collection,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import useGamificationStore from '@/store/gamificationStore'

// Multi-chat AI Coach storage backed by users/{uid}/aiChats/{chatId}.
// Each chat doc holds an append-only `messages` array.

function chatColl(uid) {
  return collection(db, 'users', uid, 'aiChats')
}

const useAiChatStore = create((set, get) => ({
  loading: false,
  loaded: false,
  chats: [],            // metadata list [{ id, title, updatedAt, ... }]
  currentChatId: null,
  currentMessages: [],

  reset: () => set({ chats: [], currentChatId: null, currentMessages: [], loading: false, loaded: false }),

  // Cached by default. The local `chats` list is kept in sync by createChat /
  // appendMessage so re-mounting the AI section doesn't re-query Firestore.
  loadChats: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return []
    if (!force && get().loaded) return get().chats
    set({ loading: true })
    try {
      const q = query(chatColl(uid), orderBy('updatedAt', 'desc'), limit(20))
      const snap = await getDocs(q)
      const chats = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          title: data.title || 'Untitled chat',
          messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
          updatedAt: data.updatedAt,
        }
      })
      set({ chats, loading: false, loaded: true })
      return chats
    } catch (err) {
      console.error('aiChatStore.loadChats:', err)
      set({ loading: false })
      return []
    }
  },

  loadChat: async (chatId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'aiChats', chatId))
      if (!snap.exists()) return null
      const data = snap.data()
      const messages = Array.isArray(data.messages) ? data.messages : []
      set({ currentChatId: chatId, currentMessages: messages })
      return { id: chatId, ...data, messages }
    } catch (err) {
      console.error('aiChatStore.loadChat:', err)
      return null
    }
  },

  // Create a new empty chat doc (or reuse an existing untouched one if you want).
  createChat: async (title = 'New chat') => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    try {
      const ref = await addDoc(chatColl(uid), {
        title,
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      // Mirror into the cached chats[] so the picker stays accurate without
      // forcing another loadChats round-trip.
      set((s) => ({
        currentChatId: ref.id,
        currentMessages: [],
        chats: [
          { id: ref.id, title, messageCount: 0, updatedAt: new Date() },
          ...s.chats,
        ],
      }))
      return ref.id
    } catch (err) {
      console.error('aiChatStore.createChat:', err)
      return null
    }
  },

  // Append a single message (any role) to the current chat. Creates the chat
  // doc lazily if there isn't one yet.
  appendMessage: async (message) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    let chatId = get().currentChatId
    if (!chatId) {
      // First message becomes the chat title (truncated).
      const title = String(message.text || '').slice(0, 60) || 'New chat'
      chatId = await get().createChat(title)
      if (!chatId) return
    }
    const stamped = {
      role: message.role,        // 'user' | 'assistant'
      text: String(message.text || ''),
      timestamp: new Date().toISOString(),
    }
    set((s) => ({
      currentMessages: [...s.currentMessages, stamped],
      chats: s.chats.map((c) =>
        c.id === chatId
          ? { ...c, messageCount: (c.messageCount || 0) + 1, updatedAt: new Date() }
          : c,
      ),
    }))
    try {
      await setDoc(
        doc(db, 'users', uid, 'aiChats', chatId),
        { messages: arrayUnion(stamped), updatedAt: serverTimestamp() },
        { merge: true },
      )
      if (message.role === 'user') {
        useGamificationStore.getState().syncEligibleBadges({ aiChatCount: 1 }).catch(() => {})
      }
    } catch (err) {
      console.error('aiChatStore.appendMessage:', err)
    }
  },
}))

export default useAiChatStore
