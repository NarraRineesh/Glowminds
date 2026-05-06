import { motion, AnimatePresence } from 'framer-motion'

export default function ModalMotion({ open, onClose, children, large = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="mb on"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            className={`mo${large ? ' mo-lg' : ''}`}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr2)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,.6)', width: '100%' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
