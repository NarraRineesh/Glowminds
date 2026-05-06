import { motion, AnimatePresence } from 'framer-motion'
import DailyQuizCard from '@/features/dashboard/components/DailyQuizCard'

export default function DailyQuizModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[680] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--color-bdr2)] bg-[var(--color-surf)] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 100% 0%, var(--color-prp2), transparent 60%), radial-gradient(ellipse 50% 50% at 0% 100%, var(--color-glow), transparent 60%)',
              }}
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-bdr)] bg-[var(--color-surf2)] text-[var(--color-txt2)] transition-colors hover:bg-[var(--color-red2)] hover:text-[var(--color-red)]"
            >
              ✕
            </button>

            <div className="relative px-6 pt-6 sm:px-7 sm:pt-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-bdr)] bg-[var(--color-prp2)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--color-prp)]">
                Daily Quiz
              </span>
              <h2 className="mt-3 text-[clamp(1.4rem,3vw,1.85rem)] font-black leading-tight tracking-[-0.02em] text-[var(--color-txt)]">
                One question.{' '}
                <span className="bg-gradient-to-r from-[var(--color-blu2)] via-[var(--color-grn)] to-[var(--color-blu)] bg-clip-text text-transparent">
                  Sharper career.
                </span>
              </h2>
              <p className="mt-1.5 max-w-md text-[0.86rem] text-[var(--color-txt2)]">
                Build your streak — answer right, earn XP, unlock badges.
              </p>
            </div>

            <div className="relative px-6 pb-2 pt-5 sm:px-7">
              <DailyQuizCard compact onComplete={() => { /* keep modal open so user can read explanation */ }} />
            </div>

            <div className="relative flex items-center justify-end gap-2 border-t border-[var(--color-bdr)] px-6 py-4 sm:px-7">
              <button type="button" onClick={onClose} className="btn btn-o btn-sm">
                Done — see you tomorrow
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
