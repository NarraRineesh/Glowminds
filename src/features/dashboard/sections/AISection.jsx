import { useState, useRef, useEffect, useCallback } from 'react'
import useAppStore from '@/store/authStore'
import useAiChatStore from '@/store/aiChatStore'
import UpgradeGate from '@/components/UpgradeGate'
import { apiFetch } from '@/services/apiClient'
import '@/styles/dashboard.css'
import '@/styles/chat.css'
import '@/styles/jobs.css'

const WELCOME_MSG = {
  role: 'assistant',
  text: "**Hi! I'm your AI Career Coach.** 👋\n\nI can help you with:\n• **Resume writing** — structure, wording, ATS tips\n• **Interview prep** — mock Q&A, STAR method\n• **Career paths** — what to learn next\n• **Salary negotiation** — scripts & benchmarks\n• **Cold outreach** — emails that get replies\n\nWhat can I help you with today?",
  isWelcome: true,
}

const SUGGESTIONS = [
  { label: '📄 Resume tips', text: 'How can I improve my resume to pass ATS screening?' },
  { label: '🎤 Interview prep', text: 'Prepare me for a Python developer technical interview' },
  { label: '📊 Trending skills', text: 'What are the top skills to learn for 2025 job market?' },
  { label: '💰 Salary talk', text: 'How do I negotiate salary as a fresher in India?' },
  { label: '✉️ Cold email', text: 'Write a cold email template to reach out to a recruiter' },
  { label: '🗺️ Career path', text: 'Give me a 6-month roadmap to become a full-stack developer' },
]

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Inline markdown (bold / italic / inline-code / bullets). HTML is escaped
// first so anything the model produces is rendered as text, not markup.
function formatInline(text) {
  return escapeHtml(text)
    .replace(/`([^`\n]+)`/g, '<code class="chat-icode">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^• /gm, '<span style="color:var(--color-grn);margin-right:4px">•</span> ')
    .replace(/^→ /gm, '<span style="color:var(--color-blu2);margin-right:4px">→</span> ')
    .replace(/\n/g, '<br/>')
}

// Splits an assistant reply into text + fenced-code segments. Handles the
// streaming case where the closing ``` hasn't been generated yet by tagging
// the in-progress block with `streaming: true`.
function parseChatContent(text) {
  const src = String(text || '')
  const parts = []
  const re = /```([^\n`]*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let m
  while ((m = re.exec(src)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', content: src.slice(lastIndex, m.index) })
    }
    parts.push({
      type: 'code',
      lang: (m[1] || '').trim(),
      content: m[2],
      streaming: false,
    })
    lastIndex = m.index + m[0].length
  }
  const tail = src.slice(lastIndex)
  if (!tail) return parts
  const openIdx = tail.indexOf('```')
  if (openIdx === -1) {
    parts.push({ type: 'text', content: tail })
    return parts
  }
  if (openIdx > 0) parts.push({ type: 'text', content: tail.slice(0, openIdx) })
  const rest = tail.slice(openIdx + 3)
  const nlIdx = rest.indexOf('\n')
  const lang = (nlIdx === -1 ? rest : rest.slice(0, nlIdx)).trim()
  const content = nlIdx === -1 ? '' : rest.slice(nlIdx + 1)
  parts.push({ type: 'code', lang, content, streaming: true })
  return parts
}

function CodeBlock({ lang, content, streaming }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.warn('Copy failed:', e)
    }
  }, [content])
  return (
    <div className="chat-code">
      <div className="chat-code-head">
        <span className="chat-code-lang">{lang || 'code'}</span>
        <button
          type="button"
          className={`chat-code-copy${copied ? ' ok' : ''}`}
          onClick={copy}
          disabled={!content || streaming}
          title={streaming ? 'Generating…' : copied ? 'Copied' : 'Copy code'}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      <pre className="chat-code-body"><code>{content}</code></pre>
    </div>
  )
}

function RichMessage({ text }) {
  const parts = parseChatContent(text)
  return (
    <>
      {parts.map((p, i) =>
        p.type === 'code' ? (
          <CodeBlock key={i} lang={p.lang} content={p.content} streaming={p.streaming} />
        ) : (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: formatInline(p.content) }}
          />
        ),
      )}
    </>
  )
}

// Reveals an assistant reply progressively (~350 chars/sec) so it feels
// generated live instead of arriving as a wall of text. We format the
// currently-revealed prefix on every tick — partial markdown like "**bol"
// safely renders as literal text until the closing "**" arrives, then snaps
// into bold, mirroring how ChatGPT-style UIs feel.
function StreamingText({ text, scrollRef, onDone, charsPerSec = 350 }) {
  const [revealed, setRevealed] = useState(0)

  // Reset whenever the source text changes (e.g. switching messages).
  useEffect(() => {
    setRevealed(0)
  }, [text])

  useEffect(() => {
    if (revealed >= text.length) {
      onDone?.()
      return undefined
    }
    const tickMs = 24
    const step = Math.max(1, Math.round((charsPerSec * tickMs) / 1000))
    const id = setTimeout(() => {
      setRevealed((r) => Math.min(text.length, r + step))
      // Keep the conversation pinned to the bottom while it grows.
      const el = scrollRef?.current
      if (el) el.scrollTop = el.scrollHeight
    }, tickMs)
    return () => clearTimeout(id)
  }, [revealed, text, scrollRef, charsPerSec, onDone])

  const isDone = revealed >= text.length
  return (
    <>
      <RichMessage text={text.slice(0, revealed)} />
      {!isDone && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-current align-text-bottom opacity-70"
        />
      )}
    </>
  )
}

export default function AISection() {
  const { user, addToast } = useAppStore()
  const chats = useAiChatStore((s) => s.chats)
  const currentChatId = useAiChatStore((s) => s.currentChatId)
  const currentMessages = useAiChatStore((s) => s.currentMessages)
  const loadChats = useAiChatStore((s) => s.loadChats)
  const loadChat = useAiChatStore((s) => s.loadChat)
  const appendMessage = useAiChatStore((s) => s.appendMessage)
  const resetChats = useAiChatStore((s) => s.reset)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const msgsRef = useRef(null)
  const inputRef = useRef(null)

  // Streaming state: which assistant message (by index) should reveal
  // character-by-character. Set right after a fresh reply lands; cleared
  // when the chat changes or the reveal completes.
  const [streamingIdx, setStreamingIdx] = useState(-1)
  const wantsStreamingRef = useRef(false)

  // Hydrate the most recent chat (or seed with welcome) on mount.
  useEffect(() => {
    if (!user?.uid || hydrated) return
    let cancelled = false
    const load = async () => {
      try {
        const list = await loadChats()
        if (cancelled) return
        if (list.length > 0) {
          await loadChat(list[0].id)
        }
      } catch (e) {
        console.error('Hydrate AI chats:', e)
      }
      if (!cancelled) setHydrated(true)
    }
    load()
    return () => { cancelled = true }
  }, [user?.uid, hydrated, loadChats, loadChat])

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [currentMessages, loading])

  // When a freshly-sent reply lands in the store, mark it as the streaming
  // message. Anything loaded from history (e.g. switching chats) is skipped
  // because the ref only flips during a live `send()` call.
  useEffect(() => {
    if (!wantsStreamingRef.current) return
    const last = currentMessages[currentMessages.length - 1]
    if (last?.role === 'assistant') {
      wantsStreamingRef.current = false
      setStreamingIdx(currentMessages.length - 1)
    }
  }, [currentMessages])

  // Reset the streaming pointer whenever the user switches chats so an old
  // message doesn't suddenly start animating.
  useEffect(() => {
    setStreamingIdx(-1)
    wantsStreamingRef.current = false
  }, [currentChatId])

  const messages = currentMessages.length > 0 ? currentMessages : [WELCOME_MSG]

  const send = useCallback(async (text) => {
    if (!text?.trim() || loading) return
    const userMsg = text.trim()
    setInput('')
    setLoading(true)

    // Snapshot history that gets sent to the model BEFORE we append the new
    // user message (so it isn't double-included).
    const historyForModel = currentMessages
      .filter((m) => !m.isWelcome && String(m.text || '').trim())
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: String(m.text).trim(),
      }))

    try {
      await appendMessage({ role: 'user', text: userMsg })

      const data = await apiFetch('/ai/career-chat', {
        body: { message: userMsg, history: historyForModel },
      })
      const reply = data?.reply
      if (!reply || !String(reply).trim()) {
        throw new Error('Empty response from AI')
      }
      // Flag the next assistant message so the bubble streams its text.
      wantsStreamingRef.current = true
      await appendMessage({ role: 'assistant', text: String(reply).trim() })
    } catch (err) {
      console.error('Chat error:', err)
      const errMsg = err.message?.includes('unauthenticated')
        ? 'Please log in to use AI chat.'
        : err.message?.includes('internal')
          ? 'AI service is temporarily unavailable. Please try again.'
          : 'Something went wrong. Please try again.'
      addToast('error', `⚠️ ${errMsg}`)
      wantsStreamingRef.current = true
      await appendMessage({
        role: 'assistant',
        text: `⚠️ ${errMsg}\n\n*Tip: If this persists, try refreshing the page.*`,
      })
    }
    setLoading(false)
    inputRef.current?.focus()
  }, [currentMessages, loading, appendMessage, addToast])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const startNewChat = async () => {
    resetChats()
    await loadChats()
    addToast('info', '✨ Started a new chat')
  }

  const switchChat = async (id) => {
    await loadChat(id)
  }

  const hasHistory = currentMessages.length > 0

  return (
    <UpgradeGate feature="AI Career Coach">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <div>
          <div className="dsh-title">AI Career Assistant 🤖</div>
          <div className="dsh-sub" style={{ marginBottom: 0 }}>Glowminds AI — real-time career coaching</div>
        </div>
        <div className="flex items-center gap-2">
          {chats.length > 1 && (
            <select
              className="fsl text-[.72rem] py-1 px-2"
              value={currentChatId || ''}
              onChange={(e) => switchChat(e.target.value)}
              style={{ minWidth: 180 }}
            >
              {chats.map((c) => (
                <option key={c.id} value={c.id}>{c.title || 'Untitled chat'}</option>
              ))}
            </select>
          )}
          <button className="btn btn-gh btn-sm" onClick={startNewChat}>＋ New chat</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {SUGGESTIONS.map((s) => (
          <button key={s.label} className="cs" onClick={() => send(s.text)} disabled={loading}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="chat-wrap">
        <div className="chat-msgs" ref={msgsRef}>
          {messages.map((m, i) => {
            const isAssistant = m.role !== 'user'
            const isStreaming = isAssistant && i === streamingIdx
            return (
              <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                <div className="mav">{isAssistant ? '🤖' : (user?.firstName?.[0] || user?.displayName?.[0] || 'U')}</div>
                <div className="mbub">
                  {!isAssistant ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: escapeHtml(m.text).replace(/\n/g, '<br/>'),
                      }}
                    />
                  ) : isStreaming ? (
                    <StreamingText
                      text={String(m.text || '')}
                      scrollRef={msgsRef}
                      onDone={() => setStreamingIdx(-1)}
                    />
                  ) : (
                    <RichMessage text={m.text} />
                  )}
                </div>
              </div>
            )
          })}
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows="1"
            disabled={loading}
          />
          <button className="btn btn-p btn-icon" onClick={() => send(input)} disabled={loading || !input.trim()}>
            {loading ? '⏳' : '➤'}
          </button>
        </div>
        {hasHistory && <div style={{ fontSize: '.66rem', color: 'var(--color-muted)', marginTop: 6, textAlign: 'right' }}>Chats are saved automatically — switch between them above.</div>}
      </div>
    </UpgradeGate>
  )
}
