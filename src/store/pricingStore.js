import { create } from 'zustand'
import { fetchPricingConfig } from '@/services/pricingApi'
import {
  DEFAULT_PRICING_CONFIG,
  mergePricingConfig,
  yearlyPriceLabel,
} from '@/constants/pricingDefaults'

let inflightLoad = null

const usePricingStore = create((set, get) => ({
  loading: false,
  loaded: false,
  fromRemote: false,
  config: DEFAULT_PRICING_CONFIG,

  load: async ({ force = false } = {}) => {
    if (!force && get().loaded) return get().config
    if (!force && inflightLoad) return inflightLoad

    inflightLoad = (async () => {
      set({ loading: true })
      try {
        const remote = await fetchPricingConfig()
        const config = mergePricingConfig(remote?.config || remote)
        set({ config, loaded: true, loading: false, fromRemote: true })
        return config
      } catch (err) {
        console.warn('pricingStore.load:', err)
        set({ loaded: true, loading: false, fromRemote: false })
        return get().config
      } finally {
        inflightLoad = null
      }
    })()

    return inflightLoad
  },

  setConfig: (config) => {
    set({ config: mergePricingConfig(config), loaded: true, fromRemote: true })
  },
}))

export default usePricingStore
export { yearlyPriceLabel, DEFAULT_PRICING_CONFIG, mergePricingConfig }
