import { apiFetch } from './apiClient'
import { dedupeAsync } from '@/utils/dedupeAsync'
import { decryptPricingPayload } from '@/utils/pricingCrypto'

async function normalizePricingResponse(res) {
  if (res?.encrypted === true) {
    const config = await decryptPricingPayload(res)
    return { config }
  }
  return res
}

export function fetchPricingConfig() {
  return dedupeAsync('GET:/config/pricing', async () => {
    const res = await apiFetch('/config/pricing', { method: 'GET', auth: false })
    return normalizePricingResponse(res)
  })
}
