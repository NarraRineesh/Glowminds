import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import AppIcon from '@/components/icons/AppIcon'
import LandingHeroVideo from '@/features/public/components/LandingHeroVideo'
import LandingHeroMetrics from '@/features/public/components/LandingHeroMetrics'
import LandingTrustBadges from '@/features/public/components/LandingTrustBadges'
import {
  heroFadeUp,
  heroStagger,
  motionTransition,
} from '@/features/public/motionVariants'
import { Badge, Button } from '@/components/ui'

export default function LandingHero({ hero, heroMetrics, trustBadges, stats }) {
  const reducedMotion = useReducedMotion()

    const headline = hero?.headline || 'Your AI-Powered Career Operating System'
  const highlight = hero?.highlight || 'Career Operating System'
  const headlineParts = headline.split(highlight)
  const hasHighlight = headlineParts.length > 1

  return (
    <section id="hero" className="relative overflow-hidden border-b border-border pb-10 pt-8 md:pb-14 md:pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-4 md:px-8 lg:grid-cols-2 lg:gap-10">
        <motion.div
          className="order-1 space-y-5 lg:order-1 lg:pr-2"
          initial="hidden"
          animate="visible"
          variants={heroStagger}
        >
          {hero?.positioning ? (
            <motion.p
              variants={heroFadeUp}
              transition={motionTransition(reducedMotion, { duration: 0.6, delay: 0.1 })}
              className="text-sm font-semibold uppercase tracking-wide text-primary"
            >
              {hero.positioning}
            </motion.p>
          ) : null}

          <motion.div variants={heroFadeUp} transition={motionTransition(reducedMotion, { duration: 0.65, delay: 0.2 })}>
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
              {hero?.liveBadge || 'LIVE'} · {stats?.dailyJobs || '12,400+'} jobs today
            </Badge>
          </motion.div>

          <motion.h1
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.75, delay: 0.3 })}
            className="text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem]"
          >
            {hasHighlight ? (
              <>
                {headlineParts[0]}
                <span className="text-primary">{highlight}</span>
                {headlineParts.slice(1).join(highlight)}
              </>
            ) : (
              headline
            )}
          </motion.h1>

          <motion.p
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.7, delay: 0.42 })}
            className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base"
          >
            {hero?.subheadline}
          </motion.p>

          <motion.div
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.65, delay: 0.52 })}
          >
            <LandingHeroMetrics metrics={heroMetrics} />
          </motion.div>

          <motion.div
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.65, delay: 0.62 })}
            className="flex flex-wrap items-center gap-2"
          >
            <motion.div whileHover={reducedMotion ? {} : { y: -2, scale: 1.01 }} whileTap={reducedMotion ? {} : { y: 1 }}>
              <Button size="lg" render={<Link to="/signup" />} className="gap-2">
                {hero?.primaryCta || 'Build Your Resume'}
                <AppIcon name="send" className="size-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={reducedMotion ? {} : { y: -2, scale: 1.01 }} whileTap={reducedMotion ? {} : { y: 1 }}>
              <Button size="lg" variant="outline" render={<Link to="/features" />} className="gap-2">
                <AppIcon name="sparkle" className="size-4" />
                {hero?.secondaryCta || 'Explore Tools'}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={heroFadeUp}
            transition={motionTransition(reducedMotion, { duration: 0.6, delay: 0.72 })}
          >
            <LandingTrustBadges badges={trustBadges} />
          </motion.div>
        </motion.div>

        <div className="order-2 lg:order-2">
          <LandingHeroVideo />
        </div>
      </div>
    </section>
  )
}
