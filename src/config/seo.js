import { pageUrl, SITE_URL } from '@/config/site'
import { LEGAL_ADDRESS, LEGAL_CIN, LEGAL_NAME } from '@/config/legal'

export const SEO_SITE_NAME = 'Glowminds'
export const SEO_LOCALE = 'en_IN'
export const SEO_TWITTER = '@Glowminds'
export const SEO_OG_IMAGE = '/og-image.png'
export const SEO_OG_IMAGE_ALT =
  'Glowminds — AI resume builder, job matching, and interview prep for students in India'

export const SEO_DEFAULT_KEYWORDS =
  'AI resume builder, ATS resume, job search India, student jobs, fresher jobs, AI interview prep, cover letter generator, job application tracker, career platform India, Glowminds'

export const SEO_DEFAULT_DESCRIPTION =
  'Build ATS-ready resumes, get AI job matches, practice mock interviews, and track applications. Free to start — built for students and early-career professionals in India.'

export const SEO_ORGANIZATION = {
  name: 'Glowminds',
  legalName: LEGAL_NAME,
  cin: LEGAL_CIN,
  email: 'hello@glowminds.in',
  supportEmail: 'support@glowminds.in',
  privacyEmail: 'privacy@glowminds.in',
  legalEmail: 'legal@glowminds.in',
}

/** @typedef {{ title?: string, description: string, path: string, keywords?: string, noIndex?: boolean }} PageSeoMeta */

export const PAGE_SEO = {
  home: {
    title: 'AI Resume Builder & Job Matching for Students',
    description:
      'Get hired faster with ATS-ready resumes, AI job matching, mock interviews, and application tracking. Free tier available — built for students and fresh graduates in India.',
    path: '/',
    keywords:
      'AI career platform, student resume builder, job matching India, AI mock interview, fresher job search, application tracker',
  },
  features: {
    title: 'Features — Resume, Jobs, Interviews & Tracking',
    description:
      'Explore Glowminds features: ATS resume builder, smart job matching, AI mock interviews, cover letters, grammar check, and Kanban application tracking in one platform.',
    path: '/features',
    keywords:
      'resume builder features, AI job matching, mock interview app, cover letter AI, application tracker, career tools India',
  },
  pricing: {
    title: 'Pricing — Free Plan & Pro from ₹599/year',
    description:
      'Start free with job search, 1 resume, and 5 AI credits. Glowminds Pro founding offer: ₹599/year for 100 AI credits/month, unlimited resumes, and full AI career tools.',
    path: '/pricing',
    keywords:
      'Glowminds pricing, student career tools price, affordable resume builder India, AI interview prep cost, Pro plan India',
  },
  about: {
    title: 'About — AI Career Platform for Indian Students',
    description:
      'Glowminds helps students and fresh graduates land jobs with AI-powered resumes, job matching, and interview prep — affordable tools that level the playing field.',
    path: '/about',
    keywords:
      'about Glowminds, student career platform India, AI career tools mission, fresher job help',
  },
  contact: {
    title: 'Contact Us — Support & Partnerships',
    description:
      'Contact the Glowminds team at hello@glowminds.in. We reply within 24 hours for support, partnerships, billing, and media inquiries.',
    path: '/contact',
    keywords:
      'contact Glowminds, Glowminds support, career platform help, partnership inquiry India',
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'Read how Glowminds collects, uses, and protects your data. We never sell personal information. Secure payments via Razorpay. Contact privacy@glowminds.in.',
    path: '/privacy',
    keywords: 'Glowminds privacy policy, data protection, student data privacy India',
  },
  terms: {
    title: 'Terms of Service',
    description:
      'Glowminds Terms of Service — user responsibilities, subscription billing, acceptable use, and service policies for our AI career platform.',
    path: '/terms',
    keywords: 'Glowminds terms of service, user agreement, subscription terms India',
  },
  refund: {
    title: 'Refund Policy',
    description:
      'Glowminds refund policy for Pro subscriptions — 7-day money-back guarantee, eligibility, and how to request a refund for annual or monthly plans.',
    path: '/refund',
    keywords: 'Glowminds refund policy, subscription refund India, money-back guarantee',
  },
  login: {
    title: 'Log In',
    description: 'Log in to Glowminds to access your dashboard, resume builder, job matches, and AI career tools.',
    path: '/login',
    noIndex: true,
  },
  signup: {
    title: 'Sign Up Free',
    description:
      'Create your free Glowminds account. Build ATS resumes, get matched to jobs, try AI tools, and track applications — no credit card required.',
    path: '/signup',
    noIndex: true,
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or has been moved.',
    path: '/404',
    noIndex: true,
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Your Glowminds career dashboard.',
    path: '/dashboard',
    noIndex: true,
  },
}

export function ogImageUrl(image = SEO_OG_IMAGE) {
  if (!image) return `${SITE_URL}${SEO_OG_IMAGE}`
  return image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`
}

export function buildTitle(pageTitle) {
  if (!pageTitle) return `${SEO_SITE_NAME} — AI Career Platform for Students & Job Seekers`
  return `${pageTitle} — ${SEO_SITE_NAME}`
}

/** @param {unknown} data */
export function normalizeStructuredData(data) {
  if (!data) return null
  const items = Array.isArray(data) ? data.filter(Boolean) : [data]
  if (items.length === 0) return null
  if (items.length === 1) return items[0]
  return {
    '@context': 'https://schema.org',
    '@graph': items.map((item) => {
      const { '@context': _ctx, ...rest } = item
      return rest
    }),
  }
}

export function organizationSchema(overrides = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SEO_ORGANIZATION.name,
    legalName: SEO_ORGANIZATION.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon/favicon-96x96.png`,
    email: SEO_ORGANIZATION.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${LEGAL_ADDRESS.line1}, ${LEGAL_ADDRESS.line2}`,
      addressLocality: LEGAL_ADDRESS.city,
      addressRegion: LEGAL_ADDRESS.region,
      postalCode: LEGAL_ADDRESS.postalCode,
      addressCountry: LEGAL_ADDRESS.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SEO_ORGANIZATION.email,
      availableLanguage: ['English', 'Hindi'],
      areaServed: 'IN',
    },
    ...overrides,
  }
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SEO_SITE_NAME,
    url: SITE_URL,
    description: SEO_DEFAULT_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-IN',
  }
}

/** @param {{ label: string, path?: string }[]} items */
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.path ? pageUrl(item.path) : undefined,
    })),
  }
}

/** @param {{ q: string, a: string }[]} faqs */
export function faqPageSchema(faqs) {
  if (!faqs?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  }
}

/** @param {{ name: string, description: string, path: string, type?: string }} opts */
export function webPageSchema({ name, description, path, type = 'WebPage' }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url: pageUrl(path),
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'en-IN',
  }
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SEO_SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: SEO_DEFAULT_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free tier with optional Pro upgrade',
    },
    provider: { '@id': `${SITE_URL}/#organization` },
  }
}

/** @param {{ price: string, name?: string, description?: string, path?: string }} opts */
export function productOfferSchema({ price, name = 'Glowminds Pro', description, path = '/pricing' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || PAGE_SEO.pricing.description,
    brand: { '@type': 'Brand', name: SEO_SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: pageUrl(path),
      price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: `${new Date().getFullYear()}-12-31`,
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  }
}

/** @param {string[]} featureNames */
export function itemListSchema(featureNames, path = '/features') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Glowminds Platform Features',
    url: pageUrl(path),
    itemListElement: featureNames.map((name, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
    })),
  }
}

export function contactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Glowminds',
    url: pageUrl('/contact'),
    description: PAGE_SEO.contact.description,
    mainEntity: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      email: SEO_ORGANIZATION.email,
    },
  }
}

/** @param {keyof typeof PAGE_SEO} key @param {{ label: string, path?: string }[]} [breadcrumbs] */
export function pageStructuredData(key, breadcrumbs, extra = []) {
  const meta = PAGE_SEO[key]
  const crumbs = breadcrumbs ?? [{ label: 'Home', path: '/' }, { label: meta.title.split(' — ')[0] || meta.title, path: meta.path }]
  const base = [
    webPageSchema({
      name: buildTitle(meta.title),
      description: meta.description,
      path: meta.path,
      type: key === 'about' ? 'AboutPage' : key === 'contact' ? 'ContactPage' : 'WebPage',
    }),
    breadcrumbSchema(crumbs),
    ...extra,
  ]
  return normalizeStructuredData(base.filter(Boolean))
}

export const DASHBOARD_PAGE_SEO = {
  '/dashboard': { title: 'Dashboard', description: 'Your Glowminds career dashboard.' },
  '/dashboard/jobs': { title: 'Job Board', description: 'Matched jobs for your target role.' },
  '/dashboard/resume': { title: 'Resume Builder', description: 'Build an ATS-ready Glowminds resume.' },
  '/dashboard/applications': { title: 'Application Tracker', description: 'Track every application on a Kanban board.' },
  '/dashboard/profile': { title: 'Profile', description: 'Your Glowminds career profile.' },
  '/dashboard/ai': { title: 'AI Coach', description: 'Career coaching in Glowminds.' },
  '/dashboard/interview': { title: 'Interview Prep', description: 'Practice interviews with Glowminds.' },
  '/dashboard/cover-letters': { title: 'Cover Letters', description: 'Draft cover letters in Glowminds.' },
  '/dashboard/linkedin': { title: 'LinkedIn Optimizer', description: 'Audit your LinkedIn profile.' },
  '/dashboard/salary': { title: 'Salary Insights', description: 'India salary ranges for early-career roles.' },
  '/dashboard/settings': { title: 'Settings', description: 'Account, billing, and preferences.' },
  '/dashboard/grammar-check': { title: 'Grammar Check', description: 'Polish career documents.' },
  '/dashboard/paraphrase': { title: 'Paraphrasing Tool', description: 'Rewrite bullets and paragraphs.' },
  '/dashboard/quiz': { title: 'Daily Quiz', description: 'Daily career quiz.' },
  '/dashboard/badges': { title: 'Badges', description: 'Your Glowminds badges.' },
  '/dashboard/admin': { title: 'Admin', description: 'Glowminds admin console.', noIndex: true },
}

export function dashboardSeo(pathname) {
  if (DASHBOARD_PAGE_SEO[pathname]) return DASHBOARD_PAGE_SEO[pathname]
  if (pathname.startsWith('/dashboard/jobs/')) {
    return { title: 'Job Detail', description: 'Job details on Glowminds.' }
  }
  return PAGE_SEO.dashboard
}
