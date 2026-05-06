import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useIsPro from '@/hooks/useIsPro'

export default function UpgradeGate({ feature, children }) {
  const isPro = useIsPro()
  const navigate = useNavigate()

  if (isPro) return children

  return (
    <div style={{ position: 'relative', minHeight: '60vh' }}>
      {/* Blurred preview behind the gate */}
      <div style={{ filter: 'blur(6px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>

      {/* Upgrade overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>
        <div style={{
          background: 'var(--color-surf)',
          border: '2px solid var(--color-blu)',
          borderRadius: 20,
          padding: 'clamp(28px, 5vw, 48px)',
          textAlign: 'center',
          maxWidth: 420,
          boxShadow: '0 8px 40px rgba(0,0,0,.25)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(56,139,253,.08), transparent)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 8 }}>
            {feature || 'This Feature'} is Pro Only
          </h2>
          <p style={{ fontSize: '.86rem', color: 'var(--color-txt2)', lineHeight: 1.7, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
            Upgrade to Glowminds Pro to unlock {feature ? feature.toLowerCase() : 'this feature'} and all premium tools. Starting at just <strong>₹49/month</strong>.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-p btn-glow"
              style={{ fontSize: '.86rem', padding: '12px 28px' }}
              onClick={() => navigate('/pricing')}>
              ⚡ Upgrade to Pro
            </motion.button>
          </div>
          <div style={{ marginTop: 14, fontSize: '.72rem', color: 'var(--color-muted)' }}>
            Cancel anytime · Secure payments via Razorpay
          </div>
        </div>
      </motion.div>
    </div>
  )
}
