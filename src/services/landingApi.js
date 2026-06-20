import { apiFetch } from './apiClient'
import { dedupeAsync } from '@/utils/dedupeAsync'
import { decryptPricingPayload } from '@/utils/pricingCrypto'

async function normalizeLandingResponse(res) {
  if (res?.encrypted === true) {
    const config = await decryptPricingPayload(res)
    return { config }
  }
  return res
}

export function fetchLandingConfig() {
  return dedupeAsync('GET:/config/landing', async () => {
    const res = await apiFetch('/config/landing', { method: 'GET', auth: false })
    return normalizeLandingResponse(res)
  })
}
