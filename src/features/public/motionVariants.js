/** Shared Framer Motion presets for marketing pages */

export const motionEase = [0.16, 1, 0.3, 1]

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

/** Reactive Resume–style hero: larger vertical offset for headline block */
export const heroFadeUp = {
  hidden: { opacity: 0, y: 100 },
  visible: { opacity: 1, y: 0 },
}

export const heroMockup = {
  hidden: { opacity: 0, y: 80, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

function staggerChildren(stagger = 0.12, delayChildren = 0) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  }
}

/** Common defaults used across landing / auth-adjacent pages */
export const stagger = staggerChildren(0.12)
export const staggerFast = staggerChildren(0.08)
export const staggerContact = staggerChildren(0.1)
export const heroStagger = staggerChildren(0.15, 0.25)

export function motionTransition(reducedMotion, { duration = 0.6, delay = 0 } = {}) {
  if (reducedMotion) return { duration: 0 }
  return { duration, ease: motionEase, delay }
}
