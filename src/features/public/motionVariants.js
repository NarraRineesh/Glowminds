/** Shared Framer Motion presets for marketing pages */

export const motionEase = [0.16, 1, 0.3, 1]

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
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
