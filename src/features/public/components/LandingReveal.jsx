import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, motionEase, motionTransition } from '@/features/public/motionVariants'
import { cn } from '@/components/ui'

export default function LandingReveal({
  children,
  className,
  delay = 0,
  y = 20,
  as = 'div',
}) {
  const reducedMotion = useReducedMotion()
  const Component = motion[as] || motion.div

  return (
    <Component
      initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={motionTransition(reducedMotion, { duration: 0.55, delay })}
      className={cn(className)}
    >
      {children}
    </Component>
  )
}

export function LandingRevealStagger({ children, className, stagger = 0.1 }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        visible: {
          transition: reducedMotion
            ? { duration: 0 }
            : { staggerChildren: stagger, delayChildren: 0.05 },
        },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

export function LandingRevealItem({ children, className }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      variants={fadeUp}
      transition={motionTransition(reducedMotion, { duration: 0.5 })}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
