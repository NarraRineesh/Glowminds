import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import Loader from '@/components/Loader'
import useTheme from '@/hooks/useTheme'
import useAppStore from '@/store/authStore'
import { getCopilotThemeTokens } from '@/constants/copilotThemeTokens'
import { applyCopilotTheme, clearCopilotTheme } from 'glowminds-resume/embed-theme'

const ResumeBuilderRoot = lazy(() =>
  import('glowminds-resume/embed').then((module) => ({ default: module.ResumeBuilderRoot })),
)

export default function GlowmindsResumeSection() {
  const hostRef = useRef(null)
  const { theme } = useTheme()
  const user = useAppStore((state) => state.user)
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  // Single source of truth: theme prop drives class + tokens on the embed host.
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    applyCopilotTheme(resolvedTheme, getCopilotThemeTokens(resolvedTheme), host)
    return () => clearCopilotTheme(host)
  }, [resolvedTheme])

  const payload = {
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
  }

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
