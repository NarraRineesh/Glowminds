import useAppStore from '@/store/authStore'

const icons = { success: '✅', error: '❌', info: 'ℹ️' }

export default function Toast() {
  const toasts = useAppStore((s) => s.toasts)
  return (
    <div className="tw">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="text-base">{icons[t.type] || 'ℹ️'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
