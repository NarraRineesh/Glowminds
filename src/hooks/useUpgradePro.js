import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/services/apiClient'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import { invalidateEntitlementsCache } from '@/hooks/useEntitlements'

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
 * Reusable hook to start the Razorpay upgrade flow.
 * - If the user is not logged in, redirects to /login.
 * - Otherwise: createOrder → Razorpay checkout → verifyPayment.
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

      setLoading(true)
      try {
        const loaded = await loadRazorpayScript()
        if (!loaded) {
          addToast('error', 'Failed to load payment gateway')
          setLoading(false)
          return
        }

        const data = await apiFetch('/payments/create-order', { body: { plan } })
        const { orderId, amount, currency, key } = data

        const options = {
          key,
          amount,
          currency,
          name: 'Glowminds AI',
          description: plan === 'yearly' ? 'Pro Yearly Plan' : 'Pro Monthly Plan',
          order_id: orderId,
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
          theme: { color: '#388bfd' },
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
        addToast('error', 'Could not start payment. Try again.')
        setLoading(false)
      }
    },
    [loggedIn, navigate, addToast, user],
  )

  return { startUpgrade, loading }
}
