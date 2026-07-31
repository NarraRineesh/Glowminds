import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useAiChatStore from '@/store/aiChatStore'
import useProfileStore from '@/store/profileStore'
import { getCareerChatCost } from '@/components/AiCreditBar'
import UpgradeGate from '@/components/UpgradeGate'
import useEntitlements from '@/hooks/useEntitlements'
import { AppIcon,
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardFooter,
  PageTitle,
  Select,
  Textarea,
  cn,
} from '@/components/ui'
import { apiFetch } from '@/services/apiClient'

const WELCOME_MSG = {
  role: 'assistant',
  text: "**Hi! I'm your AI Career Coach.**\n\nI can help you with:\n• **Resume writing** — structure, wording, ATS tips\n• **Interview prep** — mock Q&A, STAR method\n• **Career paths** — what to learn next\n• **Salary negotiation** — scripts & benchmarks\n• **Cold outreach** — emails that get replies\n\nWhat can I help you with today?",
  isWelcome: true,
}

const SUGGESTIONS = [
  { icon: 'resume', label: 'Resume tips', text: 'How can I improve my resume to pass ATS screening?' },
  { icon: 'microphone', label: 'Interview prep', text: 'Prepare me for a Python developer technical interview' },
  { icon: 'chart', label: 'Trending skills', text: 'What are the top skills to learn for 2025 job market?' },
  { icon: 'salary', label: 'Salary talk', text: 'How do I negotiate salary as a fresher in India?' },
  { icon: 'cover-letters', label: 'Cold email', text: 'Write a cold email template to reach out to a recruiter' },
  { icon: 'map', label: 'Career path', text: 'Give me a 6-month roadmap to become a full-stack developer' },
]

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/`([^`\n]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-primary">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^• /gm, '<span class="mr-1 text-emerald-500">•</span> ')
    .replace(/^→ /gm, '<span class="mr-1 text-primary">→</span> ')
    .replace(/\n/g, '<br/>')
}

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
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-muted/60">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-[0.68rem] uppercase tracking-wide text-muted-foreground">{lang || 'code'}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-auto px-2 py-0.5 text-[0.7rem]', copied && 'text-emerald-500')}
          onClick={copy}
          disabled={!content || streaming}
          title={streaming ? 'Generating…' : copied ? 'Copied' : 'Copy code'}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[0.78rem] leading-relaxed text-foreground"><code>{content}</code></pre>
    </div>
  )
}

function RichMessage({ text }) {
  const parts = parseChatContent(text)
  return (
    <div className="min-w-0 break-words [overflow-wrap:anywhere]">
      {parts.map((p, i) =>
        p.type === 'code' ? (
          <CodeBlock key={i} lang={p.lang} content={p.content} streaming={p.streaming} />
        ) : (
          <span
            key={i}
            className="block"
            dangerouslySetInnerHTML={{ __html: formatInline(p.content) }}
          />
        ),
      )}
    </div>
  )
}

function StreamingText({ text, onScroll, onDone, charsPerSec = 350 }) {
  const [revealed, setRevealed] = useState(0)

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
      onScroll?.()
    }, tickMs)
    return () => clearTimeout(id)
  }, [revealed, text, onScroll, charsPerSec, onDone])

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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default function AISection() {
  const { user, addToast } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const { credits, creditCosts, isPro, loading: entitlementsLoading, refresh: refreshEntitlements } = useEntitlements()
  const chatCost = getCareerChatCost(creditCosts)
  const creditBalance = credits?.balance
  const canSend = creditBalance == null || creditBalance >= chatCost
  const chats = useAiChatStore((s) => s.chats)
  const currentChatId = useAiChatStore((s) => s.currentChatId)
  const currentMessages = useAiChatStore((s) => s.currentMessages)
  const loadChats = useAiChatStore((s) => s.loadChats)
  const loadChat = useAiChatStore((s) => s.loadChat)
  const appendMessage = useAiChatStore((s) => s.appendMessage)
  const loadProfile = useProfileStore((s) => s.load)
  const profile = useProfileStore((s) => s.profile)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [jobContext, setJobContext] = useState(null)
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const seededRef = useRef(false)

  const coachContext = useMemo(() => {
    const digest = {
      headline: profile?.headline || '',
      careerLevel: profile?.careerLevel || '',
      skills: profile?.skills?.technical || [],
      expectedCTC: profile?.preferences?.expectedCTC || '',
      summary: profile?.summary || '',
    }
    return {
      profileDigest: digest,
      ...(jobContext || {}),
    }
  }, [profile, jobContext])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [])
  const [streamingIdx, setStreamingIdx] = useState(-1)
  const wantsStreamingRef = useRef(false)

  useEffect(() => {
    if (!user?.uid || hydrated) return
    let cancelled = false
    const load = async () => {
      try {
        await loadProfile({ force: false }).catch(() => {})
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
  }, [user?.uid, hydrated, loadChats, loadChat, loadProfile])

  useEffect(() => {
    const jobId = searchParams.get('jobId')
    const jobTitle = searchParams.get('jobTitle')
    const company = searchParams.get('company')
    const seed = searchParams.get('seed')
    const topics = searchParams.get('topics')
    if (jobId || jobTitle || company || topics) {
      setJobContext({
        jobId: jobId || '',
        jobTitle: jobTitle || '',
        company: company || '',
        coachTopics: topics || '',
      })
    }
    if (seed && !seededRef.current) {
      seededRef.current = true
      setInput(seed)
      const next = new URLSearchParams(searchParams)
      next.delete('seed')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    scrollToBottom()
  }, [currentMessages, loading, currentChatId, scrollToBottom])

  useEffect(() => {
    if (!wantsStreamingRef.current) return
    const last = currentMessages[currentMessages.length - 1]
    if (last?.role === 'assistant') {
      wantsStreamingRef.current = false
      setStreamingIdx(currentMessages.length - 1)
    }
  }, [currentMessages])

  useEffect(() => {
    setStreamingIdx(-1)
    wantsStreamingRef.current = false
  }, [currentChatId])

  const messages = currentMessages.length > 0 ? currentMessages : [WELCOME_MSG]

  const send = useCallback(async (text) => {
    if (!text?.trim() || loading || !canSend) return
    const userMsg = text.trim()
    setInput('')
    setLoading(true)

    const historyForModel = currentMessages
      .filter((m) => !m.isWelcome && String(m.text || '').trim())
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: String(m.text).trim(),
      }))

    try {
      await appendMessage({ role: 'user', text: userMsg })

      const data = await apiFetch('/ai/career-chat', {
        body: { message: userMsg, history: historyForModel, context: coachContext },
      })
      const reply = data?.reply
      if (!reply || !String(reply).trim()) {
        throw new Error('Empty response from AI')
      }
      wantsStreamingRef.current = true
      await appendMessage({ role: 'assistant', text: String(reply).trim() })
      if (typeof data?.credits?.balance === 'number') {
        await refreshEntitlements({ force: true })
      }
    } catch (err) {
      console.error('Chat error:', err)
      const errMsg = err.code === 'permission-denied' || err.message?.includes('credit')
        ? (err.message || 'Not enough AI credits for this message.')
        : err.message?.includes('unauthenticated')
          ? 'Please log in to use AI chat.'
          : err.message?.includes('internal')
            ? 'AI service is temporarily unavailable. Please try again.'
            : 'Something went wrong. Please try again.'
      addToast('error', errMsg)
      if (err.code === 'permission-denied') {
        await refreshEntitlements({ force: true })
      }
      if (!err.message?.includes('credit') && err.code !== 'permission-denied') {
        wantsStreamingRef.current = true
        await appendMessage({
          role: 'assistant',
          text: `${errMsg}\n\n*Tip: If this persists, try refreshing the page.*`,
        })
      }
    }
    setLoading(false)
    inputRef.current?.focus()
  }, [currentMessages, loading, canSend, appendMessage, addToast, refreshEntitlements, coachContext])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const startNewChat = () => {
    useAiChatStore.setState({ currentChatId: null, currentMessages: [] })
    addToast('info', 'Started a new chat')
  }

  const switchChat = async (id) => {
    await loadChat(id)
  }

  const hasHistory = currentMessages.length > 0
  const userInitial = user?.firstName?.[0] || user?.displayName?.[0] || 'U'

  return (
    <UpgradeGate feature="AI Career Coach">
    <div className="flex h-[calc(100dvh-16rem)] min-h-[26rem] w-full flex-col md:h-[calc(100dvh-12rem)]">
      <div className="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-2">
        <PageTitle
          title="Career Copilot"
          subtitle={
            jobContext?.jobTitle
              ? `Coaching with context: ${jobContext.jobTitle}${jobContext.company ? ` @ ${jobContext.company}` : ''}`
              : 'Glowminds AI — real-time career coaching grounded in your profile'
          }
          className="mb-0"
        />
        <div className="flex items-center gap-2">
          {chats.length > 1 && (
            <Select
              className="h-8 min-w-[180px] text-[0.72rem]"
              value={currentChatId || ''}
              onChange={(e) => switchChat(e.target.value)}
            >
              {chats.map((c) => (
                <option key={c.id} value={c.id}>{c.title || 'Untitled chat'}</option>
              ))}
            </Select>
          )}
          <Button variant="ghost" size="sm" onClick={startNewChat}>＋ New chat</Button>
        </div>
      </div>

      <div className="mb-2.5 flex shrink-0 flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <Button key={s.label} variant="outline" size="sm" onClick={() => send(s.text)} disabled={loading || !canSend}>
            <AppIcon name={s.icon} className="size-3.5" />
            {s.label}
          </Button>
        ))}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-4"
          >
            <div className="flex flex-col gap-4">
            {messages.map((m, i) => {
              const isUser = m.role === 'user'
              const isAssistant = !isUser
              const isStreaming = isAssistant && i === streamingIdx
              return (
                <div
                  key={i}
                  className={cn(
                    'flex w-full items-start gap-2.5',
                    isUser ? 'flex-row-reverse' : 'flex-row',
                  )}
                >
                  <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                    <AvatarFallback className={cn(
                      'text-xs font-bold',
                      isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                    )}>
                      {isAssistant ? <AppIcon name="robot" className="size-4" /> : userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'min-w-0 max-w-[min(42rem,88%)] rounded-xl px-3.5 py-2.5 text-[0.84rem] leading-relaxed',
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-muted/50 text-foreground',
                    )}
                  >
                    {!isAssistant ? (
                      <p className="m-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {m.text}
                      </p>
                    ) : isStreaming ? (
                      <StreamingText
                        text={String(m.text || '')}
                        onScroll={scrollToBottom}
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
              <div className="flex w-full items-start gap-2.5">
                <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-muted text-xs"><AppIcon name="robot" className="size-4" /></AvatarFallback>
                </Avatar>
                <div className="rounded-xl border border-border bg-muted/50 px-3.5 py-2.5">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="shrink-0 flex-col gap-2 border-t p-3">
          <div className="flex w-full items-end gap-2">
            <Textarea
              ref={inputRef}
              className="min-h-[44px] max-h-32 flex-1 resize-none text-[0.84rem]"
              placeholder={
                !canSend
                  ? 'No credits left — upgrade or wait for monthly reset'
                  : loading
                    ? 'AI is thinking…'
                    : 'Ask me anything about your career…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading || !canSend}
            />
            <Button
              size="icon"
              className="shrink-0"
              onClick={() => send(input)}
              disabled={loading || !input.trim() || !canSend}
              aria-label="Send message"
            >
              {loading ? <AppIcon name="hourglass" className="size-4 animate-pulse" /> : <AppIcon name="send" className="size-4" />}
            </Button>
          </div>
          {hasHistory && canSend && (
            <p className="w-full text-right text-[0.66rem] text-muted-foreground">
              Chats are saved automatically — switch between them above.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
    </UpgradeGate>
  )
}
