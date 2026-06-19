import { useCallback, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import LandingHeroUserFlow from '@/features/public/components/LandingHeroUserFlow'

const TILT_SPRING = { stiffness: 180, damping: 22, mass: 0.45 }

export default function LandingHeroVideo() {
  const wrapRef = useRef(null)
  const reducedMotion = useReducedMotion()

  const normX = useMotionValue(0)
  const normY = useMotionValue(0)
  const springX = useSpring(normX, TILT_SPRING)
  const springY = useSpring(normY, TILT_SPRING)

  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5])

  const onMove = useCallback(
    (event) => {
      if (reducedMotion) return
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect) return
      normX.set((event.clientX - rect.left) / rect.width - 0.5)
      normY.set((event.clientY - rect.top) / rect.height - 0.5)
    },
    [normX, normY, reducedMotion],
  )

  const onLeave = useCallback(() => {
    normX.set(0)
    normY.set(0)
  }, [normX, normY])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.16, 1, 0.3, 1], delay: reducedMotion ? 0 : 0.15 }}
      className="perspective-[1200px] relative w-full"
    >
      <motion.div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={
          reducedMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }
        }
        className="relative will-change-transform"
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/40">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-destructive/80" />
              <span className="size-2 rounded-full bg-amber-500/80" />
              <span className="size-2 rounded-full bg-emerald-500/80" />
            </div>
            <div className="mx-auto hidden max-w-md flex-1 truncate rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-center text-[10px] text-muted-foreground sm:block">
              app.glowminds.in/dashboard
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-hidden bg-muted/20 sm:min-h-[320px] md:min-h-[360px]">
            <LandingHeroUserFlow initialSceneId="resume" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-background/80 to-transparent md:h-20"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
