import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionEase } from '@/features/public/motionVariants'

const VARIANT_STYLES = {
  landing: {
    outer: 'rounded-2xl bg-[var(--color-surf)] text-[var(--color-txt)] border border-[var(--color-bdr)] overflow-hidden',
    trigger:
      'flex w-full items-center justify-between gap-3 px-6 py-4.5 text-left text-sm font-bold text-[var(--color-txt)] bg-transparent border-0 cursor-pointer font-[inherit]',
    panelInner: 'px-6 pb-4.5 text-sm text-[var(--color-txt2)] leading-relaxed',
  },
  pricing: {
    outer: 'pp-faq-item',
    trigger:
      'pp-faq-q flex w-full items-center justify-between gap-3 text-left bg-transparent border-0 cursor-pointer font-[inherit] text-[inherit]',
    panelInner: 'pp-faq-a',
  },
  contact: {
    outer:
      'rounded-xl bg-[var(--color-surf)] border border-[var(--color-bdr)] overflow-hidden transition-colors hover:border-[var(--color-bdr2)]',
    trigger:
      'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-bold text-[var(--color-txt)] bg-transparent border-0 cursor-pointer font-[inherit]',
    panelInner: 'px-4 pb-3.5 text-sm text-[var(--color-txt2)] leading-relaxed',
  },
}

export default function PublicFaqItem({
  q,
  a,
  index,
  isOpen,
  onToggle,
  variant = 'landing',
}) {
  const reactId = useId()
  const safeId = reactId.replace(/:/g, '')
  const headerId = `faq-${variant}-${safeId}-h-${index}`
  const panelId = `faq-${variant}-${safeId}-p-${index}`
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.landing

  return (
    <div className={v.outer}>
      <button
        type="button"
        id={headerId}
        className={v.trigger}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{q}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={
            variant === 'pricing'
              ? 'pp-faq-arrow'
              : 'shrink-0 text-[var(--color-blu2)] text-sm ml-3'
          }
          aria-hidden
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: motionEase }}
            className="overflow-hidden"
          >
            <div className={v.panelInner}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
