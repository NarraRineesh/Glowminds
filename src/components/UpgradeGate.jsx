import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useIsPro from '@/hooks/useIsPro'
import { AppIcon, Button, Card, CardContent } from '@/components/ui'

export default function UpgradeGate({ feature, children }) {
  const isPro = useIsPro()
  const navigate = useNavigate()

  if (isPro) return children

  return (
    <div className="relative min-h-[60vh]">
      <div className="pointer-events-none select-none opacity-30 blur-sm">
        {children}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        <Card className="relative max-w-md overflow-hidden border-2 border-primary shadow-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--primary)_8%,transparent),transparent)]"
          />
          <CardContent className="relative p-7 text-center sm:p-10">
            <AppIcon name="lock" className="mx-auto mb-3 size-10 text-primary" />
            <h2 className="mb-2 text-xl font-black">
              {feature || 'This Feature'} is Pro Only
            </h2>
            <p className="mx-auto mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Upgrade to Glowminds Pro to unlock {feature ? feature.toLowerCase() : 'this feature'} and all premium tools. Starting at just <strong className="text-foreground">₹49/month</strong>.
            </p>
            <Button size="lg" onClick={() => navigate('/pricing')}>
              <AppIcon name="lightning" className="size-4" />
              Upgrade to Pro
            </Button>
            <p className="mt-3.5 text-xs text-muted-foreground">
              Cancel anytime · Secure payments via Razorpay
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
