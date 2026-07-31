import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useIsPro from '@/hooks/useIsPro'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import {
  MAX_FILE_BYTES,
  VAULT_CATEGORIES,
  deleteVaultDoc,
  getVaultObjectUrl,
  listVaultDocs,
  requireUid,
  uploadVaultDoc,
  vaultQuotaBytes,
} from '@/services/vaultService'
import { logActivity } from '@/services/activityLog'
import useAppStore from '@/store/authStore'
import { AppIcon, Badge, Button, DashboardCard, Progress, cn } from '@/components/ui'

function formatBytes(n) {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function relativeTime(ms) {
  if (!ms) return '—'
  const days = Math.floor((Date.now() - ms) / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function categoryLabel(id) {
  return VAULT_CATEGORIES.find((c) => c.id === id)?.label || id || 'Other'
}

/** [v2:vault] Career document store */
export default function VaultSection() {
  const isPro = useIsPro()
  const { addToast } = useAppStore()
  const inputRef = useRef(null)
  const [folder, setFolder] = useState('resumes')
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [opening, setOpening] = useState(null)

  const quota = vaultQuotaBytes(isPro)
  const used = useMemo(() => items.reduce((a, i) => a + (i.size || 0), 0), [items])
  const pct = Math.min(100, Math.round((used / quota) * 100))
  const filtered = useMemo(
    () => (folder === 'all' ? items : items.filter((i) => i.category === folder)),
    [items, folder],
  )
  const folderCounts = useMemo(() => {
    const counts = { all: items.length }
    for (const c of VAULT_CATEGORIES) counts[c.id] = 0
    for (const item of items) {
      const key = item.category || 'others'
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [items])

  const reload = async () => {
    const uid = requireUid()
    setItems(await listVaultDocs(uid))
  }

  useEffect(() => {
    reload().catch((e) => setError(e.message))
  }, [])

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const uid = requireUid()
      if (file.size > MAX_FILE_BYTES) throw new Error('File too large. Max 5 MB per file.')
      if (used + file.size > quota) throw new Error('Storage quota exceeded. Upgrade Pro for more space.')
      const uploadCategory = folder === 'all' ? 'others' : folder
      await uploadVaultDoc({ uid, file, category: uploadCategory })
      await logActivity(uid, { type: 'vault', title: `Uploaded ${file.name}` })
      await reload()
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const onDownload = async (item) => {
    setOpening(item.id)
    try {
      const url = await getVaultObjectUrl(item)
      const a = document.createElement('a')
      a.href = url
      a.download = item.name || 'file'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      addToast('error', err.message || 'Could not download file')
    } finally {
      setOpening(null)
    }
  }

  const onDelete = async (item) => {
    if (!confirm(`Delete ${item.name}?`)) return
    const uid = requireUid()
    await deleteVaultDoc(uid, item)
    await reload()
  }

  const folders = [{ id: 'all', label: 'All files' }, ...VAULT_CATEGORIES]

  const sidebar = (
    <div className="space-y-4">
      <DashboardCard titleIcon="folder" title="Upload" contentClassName="space-y-3">
        <input ref={inputRef} type="file" className="hidden" onChange={onUpload} />
        <Button
          className="w-full"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : 'Upload file'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Saves to{' '}
          {folder === 'all' ? 'Others' : categoryLabel(folder)}
          . Max 5 MB per file.
        </p>
      </DashboardCard>

      <DashboardCard titleIcon="sliders" title="Folders" contentClassName="space-y-1">
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFolder(f.id)}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              folder === f.id
                ? 'border-primary bg-primary/10 font-semibold'
                : 'border-transparent hover:border-border hover:bg-muted/40',
            )}
          >
            <span>{f.label}</span>
            <span className="tabular-nums text-xs text-muted-foreground">{folderCounts[f.id] || 0}</span>
          </button>
        ))}
      </DashboardCard>

      <DashboardCard titleIcon="package" title="Storage" contentClassName="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatBytes(used)} of {formatBytes(quota)}</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
        {!isPro && (
          <p className="text-xs text-muted-foreground">
            Need more space?{' '}
            <Link to="/dashboard/settings" className="underline">Upgrade Pro</Link>
          </p>
        )}
      </DashboardCard>
    </div>
  )

  return (
    <ToolPage>
      <ToolSidebarLayout sidebar={sidebar}>
        <DashboardCard
          titleIcon="folder"
          title={folder === 'all' ? 'All documents' : categoryLabel(folder)}
          action={
            <span className="text-xs text-muted-foreground">
              {filtered.length} file{filtered.length !== 1 ? 's' : ''}
            </span>
          }
          contentClassName="space-y-2"
        >
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <AppIcon name="folder" className="size-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">
                {folder === 'all' ? 'Your vault is empty' : `No ${categoryLabel(folder).toLowerCase()} yet`}
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Upload resumes, certificates, and offers. Files are stored privately under your account.
              </p>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
                Upload your first file
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <AppIcon name={item.category === 'resumes' ? 'resume' : 'folder'} className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="px-1.5 py-0 text-[0.65rem]">
                        {categoryLabel(item.category)}
                      </Badge>
                      <span>{formatBytes(item.size)}</span>
                      <span>·</span>
                      <span>{relativeTime(item.uploadedAtMs)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={opening === item.id}
                      onClick={() => onDownload(item)}
                    >
                      {opening === item.id ? 'Downloading…' : 'Download'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(item)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </ToolSidebarLayout>
    </ToolPage>
  )
}
