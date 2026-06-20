import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Loader from '@/components/Loader'
import useTheme from '@/hooks/useTheme'
import useAppStore from '@/store/authStore'
import { getCopilotThemeTokens } from '@/constants/copilotThemeTokens'
import { applyCopilotTheme, clearCopilotTheme } from 'glowminds-resume/embed-theme'
import {
  dashboardPathFromEmbedPath,
  embedPathFromDashboardPath,
  embedPathFromResumeId,
} from '@/utils/resumeEmbedPaths'
import {
  deleteEmbedResume,
  loadEmbedResumes,
  saveEmbedResume,
} from '@/services/resumeStore'

const ResumeBuilderRoot = lazy(() =>
  import('glowminds-resume/embed').then((module) => ({ default: module.ResumeBuilderRoot })),
)

export default function GlowmindsResumeSection() {
  const hostRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { resumeId } = useParams()
  const { theme } = useTheme()
  const user = useAppStore((state) => state.user)
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const [cloudResumes, setCloudResumes] = useState(null)
  const initialPath = useMemo(() => embedPathFromResumeId(resumeId), [resumeId])
  const externalPath = useMemo(
    () => embedPathFromDashboardPath(location.pathname),
    [location.pathname],
  )

  const onEmbedRouteChange = useCallback((embedPath, replace) => {
    const nextPath = dashboardPathFromEmbedPath(embedPath)
    if (nextPath === location.pathname) return
    navigate(nextPath, { replace })
  }, [location.pathname, navigate])

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    applyCopilotTheme(resolvedTheme, getCopilotThemeTokens(resolvedTheme), host)
    return () => clearCopilotTheme(host)
  }, [resolvedTheme])

  useEffect(() => {
    if (!user?.uid) {
      setCloudResumes([])
      return undefined
    }
    let cancelled = false
    loadEmbedResumes(user.uid)
      .then((resumes) => {
        if (!cancelled) setCloudResumes(resumes)
      })
      .catch((err) => {
        console.error('Failed to load resumes from Firestore', err)
        if (!cancelled) setCloudResumes([])
      })
    return () => { cancelled = true }
  }, [user?.uid])

  const onResumeSave = useCallback(async (resume) => {
    if (!user?.uid) return
    await saveEmbedResume(user.uid, resume)
  }, [user?.uid])

  const onResumeDelete = useCallback(async (resumeId) => {
    if (!user?.uid) return
    await deleteEmbedResume(user.uid, resumeId)
    setCloudResumes((prev) => (prev ?? []).filter((row) => row.id !== resumeId))
  }, [user?.uid])

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
    resumes: cloudResumes ?? [],
    seedFromProfile: false,
    isPro: true,
    onUpgrade: () => navigate('/pricing'),
    onResumeSave,
    onResumeDelete,
  }), [resolvedTheme, user, navigate, cloudResumes, onResumeSave, onResumeDelete])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div
        ref={hostRef}
        className="rr-copilot-host flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <Suspense fallback={<Loader variant="section" label="Loading resume builder…" />}>
          {cloudResumes === null ? (
            <Loader variant="section" label="Loading your resumes…" />
          ) : (
            <ResumeBuilderRoot
              {...payload}
              className="h-full min-h-0"
              initialPath={initialPath}
              externalPath={externalPath}
              onRouteChange={onEmbedRouteChange}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}
