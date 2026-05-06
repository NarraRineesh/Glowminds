import { useState, useRef, useEffect, useCallback } from 'react'
import useAppStore from '@/store/authStore'
import UpgradeGate from '@/components/UpgradeGate'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import app from '@/services/firebase'
import '@/styles/dashboard.css'
import '@/styles/chat.css'
import '@/styles/jobs.css'

const functions = getFunctions(app)
const careerChatFn = httpsCallable(functions, 'careerChat')

const WELCOME_MSG = {
  role: 'ai',
  text: "**Hi! I'm your AI Career Coach.** 👋\n\nI can help you with:\n• **Resume writing** — structure, wording, ATS tips\n• **Interview prep** — mock Q&A, STAR method\n• **Career paths** — what to learn next\n• **Salary negotiation** — scripts & benchmarks\n• **Cold outreach** — emails that get replies\n\nWhat can I help you with today?",
}

const SUGGESTIONS = [
  { label: '📄 Resume tips', text: 'How can I improve my resume to pass ATS screening?' },
  { label: '🎤 Interview prep', text: 'Prepare me for a Python developer technical interview' },
  { label: '📊 Trending skills', text: 'What are the top skills to learn for 2025 job market?' },
  { label: '💰 Salary talk', text: 'How do I negotiate salary as a fresher in India?' },
  { label: '✉️ Cold email', text: 'Write a cold email template to reach out to a recruiter' },
  { label: '🗺️ Career path', text: 'Give me a 6-month roadmap to become a full-stack developer' },
]

function formatAI(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^• /gm, '<span style="color:var(--color-grn);margin-right:4px">•</span> ')
    .replace(/^→ /gm, '<span style="color:var(--color-blu2);margin-right:4px">→</span> ')
    .replace(/\n/g, '<br/>')
}

export default function AISection() {
  const { user, addToast } = useAppStore()
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const msgsRef = useRef(null)
  const inputRef = useRef(null)

  // Load chat history from Firestore on mount
  useEffect(() => {
    if (!user?.uid || historyLoaded) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'chat', 'history'))
        if (snap.exists() && snap.data().messages?.length) {
          setMessages([WELCOME_MSG, ...snap.data().messages])
        }
      } catch (e) {
        console.error('Load chat history:', e)
      }
      setHistoryLoaded(true)
    }
    load()
  }, [user?.uid, historyLoaded])

  // Auto-scroll on new messages
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages, loading])

  // Save chat history to Firestore (debounced, skip welcome msg)
  const saveHistory = useCallback(async (msgs) => {
    if (!user?.uid) return
    const toSave = msgs.filter((m) => m !== WELCOME_MSG)
    try {
      await setDoc(doc(db, 'users', user.uid, 'chat', 'history'), {
        messages: toSave.slice(-50),
        updatedAt: new Date().toISOString(),
      })
    } catch (e) {
      console.error('Save chat history:', e)
    }
  }, [user])

  const send = useCallback(async (text) => {
    if (!text?.trim() || loading) return
    const userMsg = text.trim()
    setInput('')

    const userEntry = { role: 'user', text: userMsg }
    setMessages(prev => [...prev, userEntry])
    setLoading(true)

    try {
      // Build history for context (exclude welcome msg, send last 20 turns)
      const chatHistory = messages
        .filter(m => m !== WELCOME_MSG)
        .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.text }))

      const { data } = await careerChatFn({ message: userMsg, history: chatHistory })
      const aiEntry = { role: 'ai', text: data.reply }
      setMessages(prev => {
        const updated = [...prev, aiEntry]
        saveHistory(updated)
        return updated
      })
    } catch (err) {
      console.error('Chat error:', err)
      const errMsg = err.message?.includes('unauthenticated')
        ? 'Please log in to use AI chat.'
        : err.message?.includes('internal')
          ? 'AI service is temporarily unavailable. Please try again.'
          : 'Something went wrong. Please try again.'
      addToast('error', `⚠️ ${errMsg}`)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `⚠️ ${errMsg}\n\n*Tip: If this persists, try refreshing the page.*`,
      }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }, [messages, loading, saveHistory, addToast])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const clearChat = async () => {
    setMessages([WELCOME_MSG])
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'chat', 'history'), { messages: [], updatedAt: new Date().toISOString() })
      } catch { /* silent */ }
    }
    addToast('info', '🗑️ Chat cleared')
  }

  const hasHistory = messages.length > 1

  return (
    <UpgradeGate feature="AI Career Coach">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <div>
          <div className="dsh-title">AI Career Assistant 🤖</div>
          <div className="dsh-sub" style={{ marginBottom: 0 }}>Glowminds AI — real-time career coaching</div>
        </div>
        {hasHistory && (
          <button className="btn btn-gh btn-sm" onClick={clearChat}>🗑️ Clear Chat</button>
        )}
      </div>

      {/* Suggestion chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {SUGGESTIONS.map(s => (
          <button key={s.label} className="cs" onClick={() => send(s.text)} disabled={loading}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="chat-wrap">
        <div className="chat-msgs" ref={msgsRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
              <div className="mav">{m.role === 'ai' ? '🤖' : (user?.firstName?.[0] || user?.displayName?.[0] || 'U')}</div>
              <div className="mbub" dangerouslySetInnerHTML={{ __html: m.role === 'user' ? m.text.replace(/\n/g, '<br/>') : formatAI(m.text) }} />
            </div>
          ))}
          {loading && (
            <div className="msg ai">
              <div className="mav">🤖</div>
              <div className="mbub">
                <div className="typing"><span /><span /><span /></div>
              </div>
            </div>
          )}
        </div>
        <div className="chat-in-row">
          <textarea
            ref={inputRef}
            className="chat-in"
            placeholder={loading ? 'AI is thinking…' : 'Ask me anything about your career…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows="1"
            disabled={loading}
          />
          <button className="btn btn-p btn-icon" onClick={() => send(input)} disabled={loading || !input.trim()}>
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </UpgradeGate>
  )
}
