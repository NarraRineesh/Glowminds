import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/** Percent-based cursor path + optional scroll on screenshot */
const FLOW_SCENES = [
  {
    id: 'resume',
    src: '/hero/resume-builder.webp',
    alt: 'Glowminds ATS resume builder with live score and section editor',
    duration: 4.5,
    scrollY: [0, 0],
    cursor: {
      left: ['13%', '48%', '48%', '92%', '13%'],
      top: ['22%', '45%', '45%', '48%', '30%'],
      times: [0, 0.3, 0.55, 0.75, 1],
    },
    clickAt: 0.94,
  },
  {
    id: 'overview',
    src: '/hero/overview-light.webp',
    alt: 'Glowminds career dashboard overview with match scores and next actions',
    duration: 5,
    scrollY: [0, 0],
    cursor: {
      left: ['48%', '56%', '56%', '13%', '13%'],
      top: ['72%', '40%', '40%', '22%', '22%'],
      times: [0, 0.35, 0.55, 0.78, 1],
    },
    clickAt: 0.92,
  },
  {
    id: 'jobs',
    src: '/hero/job-board.webp',
    alt: 'Glowminds job board showing matched roles for freshers in India',
    duration: 5,
    scrollY: [0, '-6%'],
    scrollTimes: [0.4, 0.65],
    cursor: {
      left: ['13%', '50%', '50%', '78%', '78%', '13%'],
      top: ['30%', '16%', '16%', '36%', '36%', '36%'],
      times: [0, 0.2, 0.35, 0.55, 0.72, 1],
    },
    clickAt: 0.78,
  },
  {
    id: 'interview',
    src: '/hero/interview-prep.webp',
    alt: 'Glowminds mock interview practice screen with feedback prompts',
    duration: 4.5,
    scrollY: [0, 0],
    cursor: {
      left: ['13%', '38%', '38%', '50%', '50%'],
      top: ['38%', '48%', '48%', '78%', '78%'],
      times: [0, 0.35, 0.55, 0.78, 1],
    },
    clickAt: 0.88,
  },
  {
    id: 'coach',
    src: '/hero/ai-coach.webp',
    alt: 'Glow career bot chat guiding skill-gap upskilling',
    duration: 5,
    scrollY: [0, '-4%'],
    scrollTimes: [0.5, 0.75],
    cursor: {
      left: ['13%', '45%', '45%', '88%', '88%'],
      top: ['42%', '88%', '88%', '88%', '88%'],
      times: [0, 0.35, 0.6, 0.82, 1],
    },
    clickAt: 0.85,
  },
  {
    id: 'profile',
    src: '/hero/profile.webp',
    alt: 'Glowminds student profile with skills, experience, and portfolio highlights',
    duration: 4.5,
    scrollY: [0, '-10%'],
    scrollTimes: [0.35, 0.7],
    cursor: {
      left: ['13%', '52%', '52%', '52%'],
      top: ['48%', '28%', '28%', '55%'],
      times: [0, 0.4, 0.65, 1],
    },
    clickAt: null,
  },
]

function DemoCursor({ clicking }) {
  return (
    <div className="pointer-events-none absolute z-30 size-0">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="-translate-x-0.5 -translate-y-0.5 drop-shadow-md"
        aria-hidden
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.21 3.56a.5.5 0 0 0-.85.35z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.25"
        />
      </svg>
      <AnimatePresence>
        {clicking ? (
          <motion.span
            initial={{ scale: 0.4, opacity: 0.85 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute left-0 top-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/20"
            aria-hidden
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function SceneLayer({ scene, clicking, reducedMotion }) {
  const scrollFrom = scene.scrollY?.[0] ?? 0
  const scrollTo = scene.scrollY?.[1] ?? scrollFrom
  const scrollDuration = scene.duration * ((scene.scrollTimes?.[1] ?? 0.6) - (scene.scrollTimes?.[0] ?? 0.3))

  return (
    <>
      <motion.div
        className="absolute inset-0 will-change-transform"
        initial={{ y: scrollFrom }}
        animate={{ y: reducedMotion ? scrollFrom : scrollTo }}
        transition={{
          duration: reducedMotion ? 0 : Math.max(scrollDuration, 0.8),
          delay: reducedMotion ? 0 : scene.duration * (scene.scrollTimes?.[0] ?? 0.35),
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        <img
          src={scene.src}
          alt={scene.alt}
          width={1024}
          height={550}
          draggable={false}
          className="block h-auto min-h-[118%] w-full min-w-full object-cover object-left-top"
        />
      </motion.div>

      {!reducedMotion ? (
        <motion.div
          key={scene.id}
          className="absolute z-20 will-change-transform"
          initial={{
            left: scene.cursor.left[0],
            top: scene.cursor.top[0],
          }}
          animate={{
            left: scene.cursor.left,
            top: scene.cursor.top,
          }}
          transition={{
            duration: scene.duration,
            times: scene.cursor.times,
            ease: 'easeInOut',
            repeat: 0,
          }}
        >
          <DemoCursor clicking={clicking} />
        </motion.div>
      ) : null}
    </>
  )
}

export default function LandingHeroUserFlow({ initialSceneId = 'resume' } = {}) {
  const reducedMotion = useReducedMotion()
  const initialIndex = Math.max(0, FLOW_SCENES.findIndex((s) => s.id === initialSceneId))
  const [sceneIndex, setSceneIndex] = useState(initialIndex)
  const [clicking, setClicking] = useState(false)
  const scene = FLOW_SCENES[sceneIndex]
  const staticScene = FLOW_SCENES.find((s) => s.id === initialSceneId) || FLOW_SCENES[0]

  useEffect(() => {
    if (reducedMotion) return undefined

    setClicking(false)
    let clickTimer
    let clickOffTimer
    let nextTimer

    if (scene.clickAt != null) {
      clickTimer = setTimeout(() => {
        setClicking(true)
        clickOffTimer = setTimeout(() => setClicking(false), 480)
      }, scene.clickAt * scene.duration * 1000)
    }

    nextTimer = setTimeout(() => {
      setSceneIndex((i) => (i + 1) % FLOW_SCENES.length)
    }, scene.duration * 1000)

    return () => {
      clearTimeout(clickTimer)
      clearTimeout(clickOffTimer)
      clearTimeout(nextTimer)
    }
  }, [sceneIndex, reducedMotion, scene.clickAt, scene.duration])

  if (reducedMotion) {
    return (
      <img
        src={staticScene.src}
        alt={staticScene.alt}
        width={1024}
        height={550}
        className="block size-full min-h-[inherit] object-cover object-left-top"
        draggable={false}
      />
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={scene.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <SceneLayer scene={scene} clicking={clicking} reducedMotion={false} />
      </motion.div>
    </AnimatePresence>
  )
}

export { FLOW_SCENES as HERO_FLOW_SCENES }
