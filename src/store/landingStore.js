import { create } from 'zustand'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { DEFAULT_LANDING_CONTENT } from '@/data/landingDefaults'

const useLandingStore = create((set, get) => ({
  // State - Initialize with defaults to prevent flickering
  companies: DEFAULT_LANDING_CONTENT.companies,
  features: DEFAULT_LANDING_CONTENT.features,
  steps: DEFAULT_LANDING_CONTENT.steps,
  tools: DEFAULT_LANDING_CONTENT.tools,
  testimonials: DEFAULT_LANDING_CONTENT.testimonials,
  trustLogos: DEFAULT_LANDING_CONTENT.trustLogos,
  faqs: DEFAULT_LANDING_CONTENT.faqs,
  heroImages: DEFAULT_LANDING_CONTENT.heroImages,
  stats: DEFAULT_LANDING_CONTENT.stats,
  pricing: DEFAULT_LANDING_CONTENT.pricing,
  pricingComparison: DEFAULT_LANDING_CONTENT.pricingComparison,
  pricingFaqs: DEFAULT_LANDING_CONTENT.pricingFaqs,
  freeFeatures: DEFAULT_LANDING_CONTENT.freeFeatures,
  proFeatures: DEFAULT_LANDING_CONTENT.proFeatures,
  loading: false,
  error: null,

  // Actions
  fetchLandingContent: async () => {
    // Don't set loading to true to avoid flickering - defaults are already shown
    
    try {
      // Set timeout for fallback
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )
      
      // Firestore fetch
      const fetchPromise = getDoc(doc(db, 'siteContent', 'landing'))
      
      // Race between fetch and timeout
      const docSnap = await Promise.race([fetchPromise, timeoutPromise])
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        set({
          companies: data.companies || DEFAULT_LANDING_CONTENT.companies,
          features: data.features || DEFAULT_LANDING_CONTENT.features,
          steps: data.steps || DEFAULT_LANDING_CONTENT.steps,
          tools: data.tools || DEFAULT_LANDING_CONTENT.tools,
          testimonials: data.testimonials || DEFAULT_LANDING_CONTENT.testimonials,
          trustLogos: data.trustLogos || DEFAULT_LANDING_CONTENT.trustLogos,
          faqs: data.faqs || DEFAULT_LANDING_CONTENT.faqs,
          heroImages: data.heroImages || DEFAULT_LANDING_CONTENT.heroImages,
          stats: data.stats || DEFAULT_LANDING_CONTENT.stats,
          pricing: data.pricing || DEFAULT_LANDING_CONTENT.pricing,
          pricingComparison: data.pricingComparison || DEFAULT_LANDING_CONTENT.pricingComparison,
          pricingFaqs: data.pricingFaqs || DEFAULT_LANDING_CONTENT.pricingFaqs,
          freeFeatures: data.freeFeatures || DEFAULT_LANDING_CONTENT.freeFeatures,
          proFeatures: data.proFeatures || DEFAULT_LANDING_CONTENT.proFeatures,
          loading: false,
          error: null
        })
      } else {
        // Document doesn't exist, use defaults
        get().setFallbackData()
      }
    } catch (err) {
      console.warn('Failed to fetch landing content from Firestore:', err.message)
      // Use fallback data on error or timeout
      get().setFallbackData()
    }
  },

  setFallbackData: () => {
    set({
      companies: DEFAULT_LANDING_CONTENT.companies,
      features: DEFAULT_LANDING_CONTENT.features,
      steps: DEFAULT_LANDING_CONTENT.steps,
      tools: DEFAULT_LANDING_CONTENT.tools,
      testimonials: DEFAULT_LANDING_CONTENT.testimonials,
      trustLogos: DEFAULT_LANDING_CONTENT.trustLogos,
      faqs: DEFAULT_LANDING_CONTENT.faqs,
      heroImages: DEFAULT_LANDING_CONTENT.heroImages,
      pricing: DEFAULT_LANDING_CONTENT.pricing,
      pricingComparison: DEFAULT_LANDING_CONTENT.pricingComparison,
      pricingFaqs: DEFAULT_LANDING_CONTENT.pricingFaqs,
      freeFeatures: DEFAULT_LANDING_CONTENT.freeFeatures,
      proFeatures: DEFAULT_LANDING_CONTENT.proFeatures,
      loading: false,
      error: null
    })
  },

  // Optional: Update specific content (for future admin panel)
  updateContent: (updates) => {
    set(state => ({
      ...state,
      ...updates
    }))
  }
}))

export default useLandingStore
