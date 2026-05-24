// import useProfileStore from '@/store/profileStore'

// NOTE: Pro restrictions are temporarily disabled — every user is treated as
// Pro. To re-enable real gating, uncomment the import above and the original
// logic below.
export default function useIsPro() {
  return true

  // --- Original logic (uncomment to re-enable Pro gating) ---
  // const userDoc = useProfileStore((s) => s.user)
  // const sub = userDoc?.subscription
  // if (!sub) return false
  // if (sub.plan !== 'pro') return false
  // if (sub.status !== 'active') return false
  // if (sub.endDate) {
  //   const end = sub.endDate.toDate ? sub.endDate.toDate() : new Date(sub.endDate)
  //   if (Number.isFinite(end.getTime()) && end < new Date()) return false
  // }
  // return true
}
