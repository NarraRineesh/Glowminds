import { create } from 'zustand'
import {
  collection,
  addDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import { loadAiChats, aiChatDocRef } from '@/utils/firestoreCollections'

const useAiChatStore = create((set, get) => ({
  loading: false,
  loaded: false,
  chats: [],
  currentChatId: null,
  currentMessages: [],

  reset: () => set({ chats: [], currentChatId: null, currentMessages: [], loading: false, loaded: false }),

  loadChats: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return []
    if (!force && get().loaded) return get().chats
    set({ loading: true })
    try {
      const rows = await loadAiChats(uid, 20)
      const chats = rows.map((data) => ({
        id: data.id,
        title: data.title || 'Untitled chat',
        messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
        updatedAt: data.updatedAt,
      }))
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
      const snap = await getDoc(aiChatDocRef(chatId))
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

  createChat: async (title = 'New chat') => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    try {
      const ref = await addDoc(collection(db, 'aiChats'), {
        userId: uid,
        title,
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
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

  appendMessage: async (message) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    let chatId = get().currentChatId
    if (!chatId) {
      const title = String(message.text || '').slice(0, 60) || 'New chat'
      chatId = await get().createChat(title)
      if (!chatId) return
    }
    const stamped = {
      role: message.role,
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
        aiChatDocRef(chatId),
        { messages: arrayUnion(stamped), updatedAt: serverTimestamp() },
        { merge: true },
      )
    } catch (err) {
      console.error('aiChatStore.appendMessage:', err)
    }
  },
}))

export default useAiChatStore
