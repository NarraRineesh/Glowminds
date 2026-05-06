// import useAppStore from '@/store/authStore'

// NOTE: Pro restrictions are temporarily disabled — every user is treated as Pro.
// Re-enable real gating later by restoring the subscription check below.
export default function useIsPro() {
  return true

  // --- Original logic (uncomment to re-enable Pro gating) ---
  // const user = useAppStore((s) => s.user)
  // const sub = user?.subscription
  // if (!sub || sub.status !== 'active') return false
  // if (!sub.endDate) return false
  // return new Date(sub.endDate) > new Date()
}
