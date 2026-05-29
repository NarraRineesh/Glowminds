import { useEffect, useRef } from 'react'
import { Toaster } from 'glowminds-resume/ui'
import { toast } from 'sonner'
import useAppStore from '@/store/authStore'

export default function Toast() {
  const toasts = useAppStore((s) => s.toasts)
  const seen = useRef(new Set())

  useEffect(() => {
    for (const t of toasts) {
      if (seen.current.has(t.id)) continue
      seen.current.add(t.id)
      const message = t.msg
      if (t.type === 'error') toast.error(message)
      else if (t.type === 'success') toast.success(message)
      else toast.message(message)
    }
  }, [toasts])

  return <Toaster richColors position="bottom-right" closeButton />
}
