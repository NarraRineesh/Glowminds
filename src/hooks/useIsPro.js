import useEntitlements from '@/hooks/useEntitlements'

export default function useIsPro() {
  const { isPro } = useEntitlements()
  return isPro
}

export { isActiveProSubscription, hasProAccess } from '@/constants/plans'
