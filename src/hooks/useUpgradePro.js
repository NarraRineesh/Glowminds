import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (document.getElementById('razorpay-sdk')) return resolve(true)
    const s = document.createElement('script')
    s.id = 'razorpay-sdk'
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

/**
 * Upgrade flow — UI only selects a plan; Razorpay order + amount come from the backend.
 * 1) POST /payments/create-order { plan }  → server verifies plan & creates Razorpay order
 * 2) Open Razorpay Checkout with the server payload only
 * 3) POST /payments/verify-payment → server re-checks session/order/payment
 */
export default function useUpgradePro() {
  const navigate = useNavigate()
  const { user, loggedIn, addToast } = useAppStore()
  const [loading, setLoading] = useState(false)

  const startUpgrade = useCallback(
    async ({ plan = 'yearly', onSuccess } = {}) => {
      if (!loggedIn) {
        navigate('/login')
        return
      }

      // Only a plan id/key — never send amounts from the client.
      const planRef =
        typeof plan === 'string'
          ? plan.trim()
          : String(plan?.id || plan?.key || '').trim()
      if (!planRef) {
        addToast('error', 'No plan selected')
        return
      }

      setLoading(true)
      try {
        const [{ apiFetch }, { default: useProfileStore }, { invalidateEntitlementsCache }] =
          await Promise.all([
            import('@/services/apiClient'),
            import('@/store/profileStore'),
            import('@/hooks/useEntitlements'),
          ])

        // Backend verifies plan against pricing config and creates the Razorpay order.
        const session = await apiFetch('/payments/create-order', {
          body: { plan: planRef },
        })

        if (!session?.orderId || session.amount == null || !session.key) {
          throw new Error('Checkout session incomplete')
        }

        const loaded = await loadRazorpayScript()
        if (!loaded) {
          addToast('error', 'Failed to load payment gateway')
          setLoading(false)
          return
        }

        const options = {
          key: session.key,
          amount: session.amount,
          currency: session.currency,
          name: 'Glowminds AI',
          description: session.planLabel
            || (session.planKey ? `Glowminds Pro (${session.planKey})` : 'Glowminds Pro'),
          order_id: session.orderId,
          handler: async (response) => {
            try {
              const result = await apiFetch('/payments/verify-payment', {
                body: {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                },
              })
              await useProfileStore.getState().load({ force: true })
              invalidateEntitlementsCache()
              addToast('success', 'Welcome to Glowminds Pro!')
              setLoading(false)
              if (typeof onSuccess === 'function') {
                onSuccess(result)
              } else {
                navigate('/dashboard')
              }
            } catch (err) {
              console.error('Verify payment:', err)
              addToast('error', 'Payment verification failed. Contact support.')
              setLoading(false)
            }
          },
          prefill: {
            name: user?.displayName || '',
            email: user?.email || '',
          },
          theme: { color: '#2563eb' },
          modal: { ondismiss: () => setLoading(false) },
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', (resp) => {
          console.error('Payment failed:', resp.error)
          addToast('error', `Payment failed: ${resp.error?.description || 'Unknown error'}`)
          setLoading(false)
        })
        rzp.open()
      } catch (err) {
        console.error('Create order:', err)
        const msg = err?.message || 'Could not start payment. Try again.'
        addToast('error', msg)
        setLoading(false)
      }
    },
    [loggedIn, navigate, addToast, user],
  )

  return { startUpgrade, loading }
}
