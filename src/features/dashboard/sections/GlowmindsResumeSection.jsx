import { lazy, Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '@/components/Loader'
import useTheme from '@/hooks/useTheme'
import useIsPro from '@/hooks/useIsPro'
import useAppStore from '@/store/authStore'
import { getCopilotThemeTokens } from '@/constants/copilotThemeTokens'
import { applyCopilotTheme, clearCopilotTheme } from 'glowminds-resume/embed-theme'

const ResumeBuilderRoot = lazy(() =>
  import('glowminds-resume/embed').then((module) => ({ default: module.ResumeBuilderRoot })),
)

export default function GlowmindsResumeSection() {
  const hostRef = useRef(null)
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isPro = useIsPro()
  const user = useAppStore((state) => state.user)
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    applyCopilotTheme(resolvedTheme, getCopilotThemeTokens(resolvedTheme), host)
    return () => clearCopilotTheme(host)
  }, [resolvedTheme])

  const payload = useMemo(() => ({
    theme: resolvedTheme,
    themeTokens: getCopilotThemeTokens(resolvedTheme),
    user: user
      ? {
          uid: user.uid,
          email: user.email ?? undefined,
          displayName: user.displayName ?? undefined,
        }
      : undefined,
    resumes: [],
    seedFromProfile: false,
    isPro: isPro || !!user?.isAdmin,
    onUpgrade: () => navigate('/pricing'),
  }), [resolvedTheme, user, isPro, navigate])

  return (
    <div
      ref={hostRef}
      className="rr-copilot-host flex h-full min-h-0 flex-col overflow-hidden"
    >
      <Suspense fallback={<Loader variant="section" label="Loading resume builder…" />}>
        <ResumeBuilderRoot {...payload} className="h-full min-h-0" />
      </Suspense>
    </div>
  )
}
