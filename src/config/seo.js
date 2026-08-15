import { pageUrl, SITE_URL } from '@/config/site'

export const SEO_SITE_NAME = 'Glowminds'
export const SEO_LOCALE = 'en_IN'
export const SEO_TWITTER = '@Glowminds'
export const SEO_OG_IMAGE = '/og-image.png'
export const SEO_OG_IMAGE_ALT =
  'Glowminds — Career Operating System for students and early-career professionals worldwide'

export const SEO_DEFAULT_KEYWORDS =
  'career operating system, Glowminds, land a job, ATS resume, worldwide jobs, remote jobs, Glow (Bot), mock interviews, skill gap, application tracker, student career OS'

export const SEO_DEFAULT_DESCRIPTION =
  'Glowminds is a Career Operating System for students and early-career professionals worldwide — ATS resumes, global job matching, Glow (Bot), interviews, skills, cover letters, and tracking in one place so you can land the job. Free to start.'

export const SEO_ORGANIZATION = {
  name: 'Glowminds',
  legalName: 'KNR Tech Solutions',
  email: 'hello@glowminds.in',
  supportEmail: 'support@glowminds.in',
  privacyEmail: 'privacy@glowminds.in',
  legalEmail: 'legal@glowminds.in',
}

/** @typedef {{ title?: string, description: string, path: string, keywords?: string, noIndex?: boolean }} PageSeoMeta */

export const PAGE_SEO = {
  home: {
    title: 'Career OS to Land Your First Job — Anywhere',
    description:
      'Glowminds is a Career Operating System for students and early-career professionals worldwide. One workspace for ATS resumes, jobs from around the world, Glow (Bot), interviews, skills, cover letters, and tracking — built to help you land the job. Free to start.',
    path: '/',
    keywords:
      'career operating system, land a job worldwide, Glowminds Career OS, remote jobs, ATS resume, Glow (Bot), mock interview, application tracker',
  },
  features: {
    title: 'Features — Career OS Tools to Get Hired',
    description:
      'See everything in the Glowminds Career OS: ATS resumes, matched jobs, Glow (Bot), mock interviews, skill-gap learning, cover letters, and a Kanban tracker from apply to offer.',
    path: '/features',
    keywords:
      'Glowminds features, career OS tools, job search platform, Glow (Bot), mock interviews, resume ATS, application tracker',
  },
  pricing: {
    title: 'Pricing — Free, Pro Monthly, Yearly & Lifetime',
    description:
      'Run your job search on Glowminds. Free forever, then Pro at ₹99/month, founding yearly ₹599, or Lifetime ₹2,999. Compare every Career OS feature before you upgrade.',
    path: '/pricing',
    keywords:
      'Glowminds pricing, Career OS price, student Pro, yearly ₹599, lifetime plan',
  },
  careers: {
    title: 'Careers & Internships Demo',
    description:
      'Browse Glowminds careers and internships worldwide on the live board at careers.glowminds.in.',
    path: '/careers',
    keywords: 'Glowminds careers, internships worldwide, remote jobs, careers.glowminds.in, job board',
  },
  about: {
    title: 'About — Why We Built a Career OS',
    description:
      'Glowminds is a Career Operating System for students and early-career professionals worldwide. We put resumes, global jobs, Glow (Bot), interviews, skills, and tracking in one workspace so you can land the role — wherever you are applying.',
    path: '/about',
    keywords:
      'about Glowminds, career operating system, student career platform, Glow (Bot), worldwide jobs',
  },
  contact: {
    title: 'Contact Us — Support & Partnerships',
    description:
      'Contact the Glowminds team at hello@glowminds.in. We reply within 24 hours for support, partnerships, billing, and media inquiries.',
    path: '/contact',
    keywords:
      'contact Glowminds, Glowminds support, career platform help, partnership inquiry',
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
  verifyEmail: {
    title: 'Verify your email',
    description: 'Confirm your Glowminds email address to open the dashboard.',
    path: '/verify-email',
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
  if (!pageTitle) return `${SEO_SITE_NAME} — Career OS to Land Your First Job`
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
    alternateName: 'Glowminds Career OS',
    url: SITE_URL,
    description: SEO_DEFAULT_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-IN',
    about: {
      '@type': 'Thing',
      name: 'Career operating system for students and early-career professionals worldwide',
    },
    hasPart: [
      { '@type': 'WebPage', name: 'About', url: pageUrl('/about') },
      { '@type': 'WebPage', name: 'Features', url: pageUrl('/features') },
      { '@type': 'WebPage', name: 'Pricing', url: pageUrl('/pricing') },
      { '@type': 'WebPage', name: 'Careers', url: pageUrl('/careers') },
      { '@type': 'WebPage', name: 'Contact', url: pageUrl('/contact') },
    ],
  }
}

/** Helps Google understand primary sitelink candidates (About, Features, Pricing). */
export function siteNavigationSchema() {
  const links = [
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Careers', path: '/careers' },
    { name: 'Contact', path: '/contact' },
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Glowminds',
    itemListElement: links.map((link, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: link.name,
      url: pageUrl(link.path),
    })),
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
    applicationSubCategory: 'Career Development',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: SEO_DEFAULT_DESCRIPTION,
    featureList: [
      'Career operating system for getting hired',
      'ATS resume builder',
      'Job matching and careers board',
      'Glow (Bot) career coach',
      'Skill gap analysis and learning paths',
      'Mock interviews',
      'Cover letter generator',
      'Application tracker from apply to offer',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free tier with optional Pro upgrade',
    },
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
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
