import { useEffect, useState } from 'react'
import { DEFAULT_LANDING_CONTENT } from '@/data/landingDefaults'
import { fetchLandingConfig } from '@/services/landingApi'

function isStaleLandingCopy(value) {
  return /98765\s*43210|HSR Layout|52,?000|52K\+|94%/.test(JSON.stringify(value || {}))
}

function mergeLandingConfig(config) {
  const stale = isStaleLandingCopy(config)
  return {
    ...DEFAULT_LANDING_CONTENT,
    ...config,
    aboutMetrics: (!stale && Array.isArray(config?.aboutMetrics))
      ? config.aboutMetrics
      : DEFAULT_LANDING_CONTENT.aboutMetrics,
    contactInfo: (!stale && Array.isArray(config?.contactInfo))
      ? config.contactInfo
      : DEFAULT_LANDING_CONTENT.contactInfo,
    socialProof: stale
      ? DEFAULT_LANDING_CONTENT.socialProof
      : {
      ...DEFAULT_LANDING_CONTENT.socialProof,
      ...(config?.socialProof || {}),
    },
    stats: stale
      ? DEFAULT_LANDING_CONTENT.stats
      : { ...DEFAULT_LANDING_CONTENT.stats, ...(config?.stats || {}) },
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
