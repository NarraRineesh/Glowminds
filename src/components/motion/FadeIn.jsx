import { motion } from 'framer-motion'

export default function FadeIn({
  children,
  delay = 0,
  duration = 0.55,
  y = 28,
  once = true,
  className = '',
  style,
  as = 'div',
}) {
  const Tag = motion[as] || motion.div
  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  )
}
