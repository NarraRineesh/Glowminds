import { useEffect, useState } from 'react'

const LG = '(min-width: 1024px)'

/** Matches Tailwind `lg` breakpoint (1024px). */
export default function useIsLg() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LG).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(LG)
    const onChange = () => setIsLg(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isLg
}
