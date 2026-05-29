import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import AppIcon from '@/components/icons/AppIcon'
import LandingHeroVideo from '@/features/public/components/LandingHeroVideo'
import {
  heroFadeUp,
  heroStagger,
  motionTransition,
} from '@/features/public/motionVariants'
import { Badge, Button } from '@/components/ui'

export default function LandingHero({ stats, onSignup }) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  return (
    <section id="hero" className="relative flex min-h-svh w-full flex-col items-center overflow-hidden border-b border-border pb-8">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-8">
        <LandingHeroVideo />

        <motion.div
          className="relative z-10 mx-auto max-w-3xl space-y-5 pb-8 pt-8 text-center md:pb-12 md:pt-10"
          initial="hidden"
          animate="visible"
          variants={heroStagger}
        >
          <motion.div variants={heroFadeUp} transition={motionTransition(reducedMotion, { duration: 0.7, delay: 0.55 })}>
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
              LIVE · {stats?.dailyJobs || '12,400+'} jobs today
            </Badge>
          </motion.div>

          <motion.h1
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.75, delay: 0.7 })}
            className="text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Your Career Starts{' '}
            <span className="text-primary">Right Here</span>
          </motion.h1>

          <motion.p
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.7, delay: 0.82 })}
            className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base"
          >
            Build a beautiful resume in minutes, get AI-matched to jobs across 50+ portals, and apply with one click —
            built for students and fresh graduates.
          </motion.p>

          <motion.div
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.65, delay: 0.95 })}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <motion.div whileHover={reducedMotion ? {} : { y: -2, scale: 1.01 }} whileTap={reducedMotion ? {} : { y: 1 }}>
              <Button size="lg" onClick={onSignup} className="gap-2">
                Get started
                <AppIcon name="send" className="size-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={reducedMotion ? {} : { y: -2, scale: 1.01 }} whileTap={reducedMotion ? {} : { y: 1 }}>
              <Button size="lg" variant="outline" onClick={() => navigate('/features')} className="gap-2">
                <AppIcon name="sparkle" className="size-4" />
                View features
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.6, delay: 1.05 })}
            className="text-sm text-muted-foreground"
          >
            Trusted by {stats?.students || '52K+'} students · {stats?.matchRate || '94%'} match rate
          </motion.p>
        </motion.div>
      </div>

      {!reducedMotion ? (
        <motion.div
          aria-hidden
          className="absolute bottom-8 left-1/2 z-10 flex h-8 w-5 -translate-x-1/2 items-start justify-center rounded-full border border-muted-foreground/30 p-1.5"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="h-1.5 w-1 rounded-full bg-muted-foreground/50" />
        </motion.div>
      ) : null}
    </section>
  )
}
