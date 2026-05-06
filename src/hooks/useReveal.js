import { useEffect, useRef } from 'react'

export default function useReveal(threshold = 0.15) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )

    const children = el.querySelectorAll('.reveal')
    children.forEach((child) => observer.observe(child))

    if (el.classList.contains('reveal')) observer.observe(el)

    return () => observer.disconnect()
  }, [threshold])

  return ref
}
