import { useEffect, useState } from 'react'
import { DEFAULT_LANDING_CONTENT } from '@/data/landingDefaults'
import { fetchLandingConfig } from '@/services/landingApi'

function mergeLandingConfig(config) {
  return {
    ...DEFAULT_LANDING_CONTENT,
    ...config,
    stats: { ...DEFAULT_LANDING_CONTENT.stats, ...(config?.stats || {}) },
    aboutMetrics: Array.isArray(config?.aboutMetrics)
      ? config.aboutMetrics
      : DEFAULT_LANDING_CONTENT.aboutMetrics,
    contactInfo: Array.isArray(config?.contactInfo)
      ? config.contactInfo
      : DEFAULT_LANDING_CONTENT.contactInfo,
    socialProof: {
      ...DEFAULT_LANDING_CONTENT.socialProof,
      ...(config?.socialProof || {}),
    },
  }
}

export default function useLandingConfig() {
  const [config, setConfig] = useState(DEFAULT_LANDING_CONTENT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchLandingConfig()
      .then((res) => {
        if (cancelled || !res?.config) return
        setConfig(mergeLandingConfig(res.config))
      })
      .catch((err) => {
        console.warn('useLandingConfig:', err?.message || err)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { config, loaded, fromRemote: loaded && config !== DEFAULT_LANDING_CONTENT }
}
