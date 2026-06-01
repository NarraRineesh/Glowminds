import useProfileStore from '@/store/profileStore'
import useAppStore from '@/store/authStore'
import { hasProAccess, isActiveProSubscription } from '@/constants/plans'

export default function useIsPro() {
  const profileSub = useProfileStore((s) => s.user?.subscription)
  const authSub = useAppStore((s) => s.user?.subscription)
  const isAdmin = useAppStore((s) => s.user?.isAdmin)
  return hasProAccess({ subscription: profileSub || authSub, isAdmin })
}

export { isActiveProSubscription, hasProAccess }
