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
  Select,
  Textarea,
  cn,
} from '@/components/ui'
import { apiFetch } from '@/services/apiClient'

const WELCOME_MSG = {
  role: 'assistant',
  text: "**Hi! I'm Glow.**\n\nI can help you with:\n• **Resume writing** — structure, wording, ATS tips\n• **Interview prep** — mock Q&A, STAR method\n• **Career paths** — what to learn next\n• **Salary negotiation** — scripts & benchmarks\n• **Cold outreach** — emails that get replies\n\nWhat can I help you with today?",
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

function formatInlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`\n]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-primary">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*(.+?)\*(?=[\s).,]|$)/g, '$1<em>$2</em>')
    .replace(/^• /gm, '<span class="mr-1 text-emerald-500">•</span> ')
    .replace(/^→ /gm, '<span class="mr-1 text-primary">→</span> ')
}

/** Convert common markdown blocks (headings, lists, hr) to HTML. */
function formatMarkdown(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n')
  const out = []
  let listType = null // 'ul' | 'ol'

  const closeList = () => {
    if (listType) {
      out.push(listType === 'ol' ? '</ol>' : '</ul>')
      listType = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      out.push('<div class="h-2"></div>')
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList()
      out.push('<hr class="my-3 border-border" />')
      continue
    }

    const heading = /^(#{1,4})\s*(.+)$/.exec(trimmed)
    if (heading && heading[2]) {
      closeList()
      const level = heading[1].length
      const cls =
        level === 1
          ? 'mt-3 mb-1.5 text-base font-bold tracking-tight text-foreground'
          : level === 2
            ? 'mt-3 mb-1.5 text-[0.95rem] font-bold tracking-tight text-foreground'
            : 'mt-2.5 mb-1 text-sm font-semibold text-foreground'
      out.push(`<h${level} class="${cls}">${formatInlineMarkdown(heading[2])}</h${level}>`)
      continue
    }

    const ol = /^(\d+)[.)]\s+(.+)$/.exec(trimmed)
    if (ol) {
      if (listType !== 'ol') {
        closeList()
        out.push('<ol class="my-1.5 list-decimal space-y-1 ps-5">')
        listType = 'ol'
      }
      out.push(`<li class="leading-relaxed">${formatInlineMarkdown(ol[2])}</li>`)
      continue
    }

    const ul = /^([-•*]|\u2022)\s+(.+)$/.exec(trimmed)
    if (ul) {
      if (listType !== 'ul') {
        closeList()
        out.push('<ul class="my-1.5 list-disc space-y-1 ps-5">')
        listType = 'ul'
      }
      out.push(`<li class="leading-relaxed">${formatInlineMarkdown(ul[2])}</li>`)
      continue
    }

    closeList()
    out.push(`<p class="my-1.5 leading-relaxed">${formatInlineMarkdown(trimmed)}</p>`)
  }

  closeList()
  return out.join('')
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
    <div className="min-w-0 break-words [overflow-wrap:anywhere] [&_p:first-child]:mt-0 [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0">
      {parts.map((p, i) =>
        p.type === 'code' ? (
          <CodeBlock key={i} lang={p.lang} content={p.content} streaming={p.streaming} />
        ) : (
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: formatMarkdown(p.content) }}
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
  const showSuggestions = !hasHistory && !loading

  return (
    <UpgradeGate feature="AI Career Coach" className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-2 overflow-hidden sm:gap-3">
        <div className="flex shrink-0 items-center gap-2">
          {jobContext?.jobTitle ? (
            <p className="m-0 min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-sm">
              Context: <span className="font-medium text-foreground">{jobContext.jobTitle}</span>
              {jobContext.company ? ` @ ${jobContext.company}` : ''}
            </p>
          ) : (
            <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto sm:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                  disabled={loading || !canSend}
                  onClick={() => send(s.text)}
                >
                  <AppIcon name={s.icon} className="size-3.5" />
                  {s.label}
                </Button>
              ))}
            </div>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {chats.length > 1 && (
              <Select
                className="h-8 w-[min(100%,11rem)] text-xs sm:w-auto sm:min-w-[11rem]"
                value={currentChatId || ''}
                onChange={(e) => switchChat(e.target.value)}
                aria-label="Switch chat"
              >
                {chats.map((c) => (
                  <option key={c.id} value={c.id}>{c.title || 'Untitled chat'}</option>
                ))}
              </Select>
            )}
            <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={startNewChat}>
              <span className="sm:hidden">＋ New</span>
              <span className="hidden sm:inline">＋ New chat</span>
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:max-w-4xl sm:gap-4 sm:px-6 sm:py-5 lg:max-w-5xl">
              {showSuggestions ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-muted/40 px-4 py-5 text-center sm:px-6 sm:py-8">
                    <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <AppIcon name="robot" className="size-5" />
                    </div>
                    <h2 className="m-0 text-base font-semibold tracking-tight sm:text-lg">Glow (Bot)</h2>
                    <p className="mx-auto mt-1.5 mb-0 max-w-md text-sm text-muted-foreground">
                      Resume wording, interview prep, salary scripts, cold outreach, and learning paths.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        disabled={loading || !canSend}
                        onClick={() => send(s.text)}
                        className={cn(
                          'flex min-h-14 flex-col items-start gap-1 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors',
                          'hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50',
                        )}
                      >
                        <AppIcon name={s.icon} className="size-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground sm:text-sm">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((m, i) => {
                const isUser = m.role === 'user'
                const isAssistant = !isUser
                const isStreaming = isAssistant && i === streamingIdx
                if (m.isWelcome && showSuggestions) return null
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex w-full items-start gap-2',
                      isUser ? 'flex-row-reverse' : 'flex-row',
                    )}
                  >
                    <Avatar className="mt-0.5 hidden h-7 w-7 shrink-0 sm:flex sm:h-8 sm:w-8">
                      <AvatarFallback className={cn(
                        'text-xs font-bold',
                        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                      )}>
                        {isAssistant ? <AppIcon name="robot" className="size-4" /> : userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'min-w-0 rounded-2xl px-3 py-2.5 text-[0.875rem] leading-relaxed sm:px-3.5',
                        isUser
                          ? 'max-w-[min(28rem,88%)] bg-primary text-primary-foreground'
                          : 'w-full max-w-none border border-border bg-muted/30 text-foreground sm:bg-background',
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
                <div className="flex w-full items-start gap-2">
                  <Avatar className="mt-0.5 hidden h-7 w-7 shrink-0 sm:flex sm:h-8 sm:w-8">
                    <AvatarFallback className="bg-muted text-xs"><AppIcon name="robot" className="size-4" /></AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2.5 sm:bg-background">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
            <div className="mx-auto flex w-full max-w-3xl items-end gap-2 sm:max-w-4xl lg:max-w-5xl">
              <Textarea
                ref={inputRef}
                className="min-h-11 max-h-32 flex-1 resize-none rounded-xl text-sm"
                placeholder={
                  !canSend
                    ? 'No credits left — upgrade or wait for monthly reset'
                    : loading
                      ? 'AI is thinking…'
                      : 'Ask Glow anything about your career…'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={loading || !canSend}
              />
              <Button
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                onClick={() => send(input)}
                disabled={loading || !input.trim() || !canSend}
                aria-label="Send message"
              >
                {loading ? <AppIcon name="hourglass" className="size-4 animate-pulse" /> : <AppIcon name="send" className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </UpgradeGate>
  )
}
