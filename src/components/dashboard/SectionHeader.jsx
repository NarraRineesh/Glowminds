import { motion } from 'framer-motion'

/**
 * v2-style dashboard section header.
 * Mirrors the landing-v2 hero pattern: pill badge + gradient-accented heading + subtitle.
 */
export default function SectionHeader({
  badge,
  badgeColor,
  badgeBg,
  title,
  accent,
  subtitle,
  actions,
}) {
  let titleNode = title
  if (accent && typeof title === 'string' && title.includes(accent)) {
    const [pre, post] = title.split(accent)
    titleNode = (
      <>
        {pre}
        <span className="bg-gradient-to-r from-[var(--color-blu2)] via-[var(--color-grn)] to-[var(--color-blu)] bg-clip-text text-transparent">
          {accent}
        </span>
        {post}
      </>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6"
    >
      <div className="min-w-0 flex-1">
        {badge && (
          <span
            className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-bdr)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em]"
            style={{
              background: badgeBg || 'var(--color-blu3)',
              color: badgeColor || 'var(--color-blu2)',
            }}
          >
            {badge}
          </span>
        )}
        <h1 className="text-[clamp(1.4rem,2.8vw,1.95rem)] font-black leading-tight tracking-[-0.02em] text-[var(--color-txt)]">
          {titleNode}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-[0.86rem] leading-relaxed text-[var(--color-txt2)] sm:text-[0.92rem]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  )
}
