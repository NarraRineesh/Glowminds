import { motion } from 'framer-motion'

const container = {
  hidden: {},
  visible: (stagger = 0.08) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.1 },
  }),
}

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export function StaggerContainer({
  children,
  stagger = 0.08,
  once = true,
  className = '',
  style,
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-40px' }}
      custom={stagger}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '', style }) {
  return (
    <motion.div className={className} style={style} variants={item}>
      {children}
    </motion.div>
  )
}
