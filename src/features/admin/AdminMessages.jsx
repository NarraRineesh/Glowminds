import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard } from './AdminCharts'

function messageDay(m) {
  if (m.createdAt?.toDate) return m.createdAt.toDate().toISOString().slice(0, 10)
  if (m.createdAt?._seconds) return new Date(m.createdAt._seconds * 1000).toISOString().slice(0, 10)
  if (typeof m.createdAt === 'string') return m.createdAt.slice(0, 10)
  return 'unknown'
}

export default function AdminMessages() {
  const addToast = useAppStore((s) => s.addToast)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await adminApi.contactMessages(80)
      setMessages(res.messages || [])
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Contact messages</h1>
          <p className="text-sm text-muted-foreground">Inbox from the public contact form.</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <AdminChartCard title="Messages by day" subtitle="Inbox volume from loaded set">
        <AdminBarChart
          data={Object.entries(
            messages.reduce((acc, m) => {
              const d = messageDay(m)
              acc[d] = (acc[d] || 0) + 1
              return acc
            }, {}),
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, value]) => ({ label, value }))}
        />
      </AdminChartCard>

      <div className="space-y-3">
        {messages.map((m) => (
          <article key={m.id} className="rounded-lg border border-border/70 bg-background p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-medium">{m.subject || '(no subject)'}</h2>
              <time className="text-xs text-muted-foreground">
                {m.createdAt?.toDate
                  ? m.createdAt.toDate().toLocaleString('en-IN')
                  : m.createdAt?._seconds
                    ? new Date(m.createdAt._seconds * 1000).toLocaleString('en-IN')
                    : ''}
              </time>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {m.name} · {m.email}{m.mobile ? ` · ${m.mobile}` : ''}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
          </article>
        ))}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        )}
      </div>
    </div>
  )
}
