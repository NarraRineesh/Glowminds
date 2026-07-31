/**
 * Post-build SEO shells for marketing routes.
 * Injects unique meta + crawlable HTML into #seo-boot (outside #root) so:
 * - crawlers see real content without waiting on client JS
 * - First Contentful Paint is not wiped when React mounts into #root
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const publicDir = path.join(root, 'public')
const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || 'https://glowminds.in').replace(/\/$/, '')
const today = new Date().toISOString().slice(0, 10)

const SITE_NAME = 'Glowminds'
const DEFAULT_KEYWORDS =
  'AI resume builder India, ATS resume for freshers, job search India, fresher jobs, skill gap analysis, AI upskilling, learning path, AI interview prep, cover letter generator, job application tracker, career platform India, Glowminds'

const NAV_LINKS = [
  ['/', 'Home'],
  ['/features/', 'Features'],
  ['/pricing/', 'Pricing'],
  ['/about/', 'About'],
  ['/contact/', 'Contact'],
  ['/privacy/', 'Privacy'],
  ['/terms/', 'Terms'],
  ['/signup', 'Sign up free'],
]

/** @type {Array<Record<string, any>>} */
const PAGES = [
  {
    path: '/',
    title: 'AI Resume Builder & Job Matching for Freshers',
    h1: 'Get Hired Faster with One AI Career Platform',
    description:
      'Build ATS-ready resumes, match to jobs, close skill gaps with AI upskilling, practice interviews, and track applications. Free to start for students and freshers in India.',
    keywords:
      'AI resume builder for freshers, job matching India, skill gap analysis, AI learning path, AI mock interview, fresher job search, application tracker',
    priority: '1.0',
    changefreq: 'weekly',
    schema: 'home',
    sections: [
      {
        h2: 'What Glowminds helps you do',
        paragraphs: [
          'Glowminds is an AI career platform built for students and fresh graduates in India. Create ATS-friendly resumes, discover matched jobs, follow skill-gap learning paths, practice interviews, and track every application in one place.',
        ],
        list: [
          'ATS resume builder with live scoring',
          'AI job matching for fresher roles',
          'Skill gap analysis and upskilling paths',
          'AI mock interviews and cover letters',
          'Application tracker from applied to offer',
        ],
      },
      {
        h2: 'Start free today',
        paragraphs: [
          'Create a free Glowminds account to build your first resume, explore jobs, and try AI career tools. Upgrade to Pro only when you need more credits and advanced features.',
        ],
      },
    ],
  },
  {
    path: '/features',
    title: 'Features — Resume, Jobs, Upskilling & Interviews',
    h1: 'Everything you need to get hired',
    description:
      'Explore Glowminds features: ATS resume builder, smart job matching, skill-gap upskilling, AI mock interviews, cover letters, and Kanban application tracking.',
    keywords:
      'resume builder features, AI job matching, skill gap analysis, upskilling platform, mock interview app, cover letter AI, application tracker India',
    priority: '0.9',
    changefreq: 'weekly',
    schema: 'webpage',
    sections: [
      {
        h2: 'Career tools in one workspace',
        paragraphs: [
          'Glowminds brings resume building, job discovery, upskilling, interview prep, and application tracking together so students do not bounce between disconnected apps.',
        ],
        list: [
          'Resume Studio with ATS checks',
          'Job matching by skills and role',
          'Learning paths for skill gaps',
          'Interview practice with AI feedback',
          'Cover letter generator',
          'Kanban application tracker',
        ],
      },
    ],
  },
  {
    path: '/pricing',
    title: 'Pricing — Free Plan & Pro from ₹599/year',
    h1: 'Simple pricing for students and freshers',
    description:
      'Start free with job search, 1 ATS resume, 10 application tracks, and 10 AI credits/month. Glowminds Pro founding offer: ₹599/year for AI career tools.',
    keywords:
      'Glowminds pricing, student career tools price, affordable resume builder India, AI interview prep cost, Pro plan India',
    priority: '0.9',
    changefreq: 'monthly',
    schema: 'webpage',
    sections: [
      {
        h2: 'Free and Pro plans',
        paragraphs: [
          'The Free plan is enough to start your job search. Pro unlocks more AI credits, resumes, and advanced career tools at a student-friendly founding price.',
        ],
        list: [
          'Free: job search, 1 ATS resume, 10 tracks, 10 AI credits/month',
          'Pro: founding offer from ₹599/year with higher limits',
          'No credit card required to start free',
        ],
      },
    ],
  },
  {
    path: '/about',
    title: 'About Glowminds — Career Platform for Students',
    h1: 'About Glowminds',
    description:
      'Glowminds helps students and fresh graduates land jobs with AI resumes, job matching, upskilling paths, and interview prep — affordable tools that level the playing field.',
    keywords:
      'about Glowminds, student career platform India, AI career tools mission, fresher job help, skill gap India',
    priority: '0.7',
    changefreq: 'monthly',
    schema: 'webpage',
    sections: [
      {
        h2: 'Our mission',
        paragraphs: [
          'We build affordable AI career tools so students and freshers in India can compete with confidence — from the first resume draft to the final interview.',
        ],
      },
    ],
  },
  {
    path: '/contact',
    title: 'Contact Glowminds — Support & Partnerships',
    h1: 'Contact Glowminds',
    description:
      'Contact the Glowminds team at hello@glowminds.in. We reply within 24 hours for support, partnerships, billing, and media inquiries.',
    keywords: 'contact Glowminds, Glowminds support, career platform help, partnership inquiry India',
    priority: '0.6',
    changefreq: 'monthly',
    schema: 'webpage',
    sections: [
      {
        h2: 'How to reach us',
        paragraphs: [
          'Email hello@glowminds.in for product support, partnerships, billing questions, or media inquiries. We typically respond within 24 hours on business days.',
        ],
        list: [
          'Support: hello@glowminds.in',
          'Privacy: privacy@glowminds.in',
          'Legal: legal@glowminds.in',
        ],
      },
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    h1: 'Privacy Policy',
    description:
      'Read how Glowminds collects, uses, and protects your data. We never sell personal information. Secure payments via Razorpay. Contact privacy@glowminds.in.',
    keywords: 'Glowminds privacy policy, data protection, student data privacy India',
    priority: '0.3',
    changefreq: 'yearly',
    schema: 'webpage',
    sections: [
      {
        h2: 'Your data',
        paragraphs: [
          'Glowminds collects account and career-profile information needed to provide resume, job, and AI career tools. We do not sell personal information. Contact privacy@glowminds.in for privacy requests.',
        ],
      },
    ],
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    h1: 'Terms of Service',
    description:
      'Glowminds Terms of Service — user responsibilities, subscription billing, acceptable use, and service policies for our AI career platform.',
    keywords: 'Glowminds terms of service, user agreement, subscription terms India',
    priority: '0.3',
    changefreq: 'yearly',
    schema: 'webpage',
    sections: [
      {
        h2: 'Using Glowminds',
        paragraphs: [
          'By using Glowminds you agree to our acceptable-use rules, account responsibilities, and subscription terms. Review the full Terms of Service on this page after the app loads.',
        ],
      },
    ],
  },
  {
    path: '/refund',
    title: 'Refund Policy',
    h1: 'Refund Policy',
    description:
      'Glowminds refund policy for Pro subscriptions — 7-day money-back guarantee, eligibility, and how to request a refund for annual or monthly plans.',
    keywords: 'Glowminds refund policy, subscription refund India, money-back guarantee',
    priority: '0.3',
    changefreq: 'yearly',
    schema: 'webpage',
    sections: [
      {
        h2: 'Refunds',
        paragraphs: [
          'Pro subscriptions include a 7-day money-back guarantee where eligible. Contact support to request a refund and review the full policy details on this page.',
        ],
      },
    ],
  },
]

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fullTitle(pageTitle) {
  return `${pageTitle} — ${SITE_NAME}`
}

function pageUrl(pathname) {
  if (pathname === '/') return `${siteUrl}/`
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`
  return `${siteUrl}${withSlash}`
}

function replaceNamedMeta(html, name, content) {
  const re = new RegExp(
    `(<meta\\s+name=["']${name}["']\\s+content=)(["'])(.*?)\\2`,
    'i',
  )
  return html.replace(re, `$1$2${escapeHtml(content)}$2`)
}

function replaceOg(html, property, content) {
  const re = new RegExp(
    `(<meta\\s+property=["']${property}["']\\s+content=)(["'])(.*?)\\2`,
    'i',
  )
  return html.replace(re, `$1$2${escapeHtml(content)}$2`)
}

function buildJsonLd(page) {
  const url = pageUrl(page.path)
  const orgId = `${siteUrl}/#organization`
  const websiteId = `${siteUrl}/#website`

  if (page.schema === 'home') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': orgId,
          name: SITE_NAME,
          legalName: 'KNR Tech Solutions',
          url: siteUrl,
          logo: `${siteUrl}/logo-mark.png`,
          email: 'hello@glowminds.in',
          areaServed: { '@type': 'Country', name: 'India' },
        },
        {
          '@type': 'WebSite',
          '@id': websiteId,
          name: SITE_NAME,
          url: siteUrl,
          publisher: { '@id': orgId },
          inLanguage: 'en-IN',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/features/`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'SoftwareApplication',
          name: SITE_NAME,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: siteUrl,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
          featureList: [
            'ATS resume builder',
            'AI job matching',
            'Skill gap analysis and upskilling paths',
            'AI mock interviews',
            'Cover letter generator',
            'Application tracker',
          ],
          provider: { '@id': orgId },
          areaServed: { '@type': 'Country', name: 'India' },
        },
      ],
    }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: fullTitle(page.title),
        description: page.description,
        isPartOf: { '@id': websiteId },
        about: { '@id': orgId },
        inLanguage: 'en-IN',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: page.h1, item: url },
        ],
      },
    ],
  }
}

function navHtml() {
  const items = NAV_LINKS.map(
    ([href, label]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`,
  ).join('')
  return `<nav aria-label="Primary"><ul>${items}</ul></nav>`
}

function bodyHtml(page) {
  const sections = (page.sections || [])
    .map((section) => {
      const paras = (section.paragraphs || [])
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('')
      const list = section.list?.length
        ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : ''
      return `<section><h2>${escapeHtml(section.h2)}</h2>${paras}${list}</section>`
    })
    .join('')

  return `<main id="seo-static">
        <header>
          <p><strong>${escapeHtml(SITE_NAME)}</strong> — AI resume, jobs, and upskilling for students in India</p>
          ${navHtml()}
        </header>
        <article>
          <h1>${escapeHtml(page.h1)}</h1>
          <p>${escapeHtml(page.description)}</p>
          ${sections}
          <p><a href="/signup">Create your free Glowminds account</a> · <a href="/features/">Explore features</a> · <a href="/pricing/">See pricing</a></p>
        </article>
      </main>`
}

function injectJsonLd(html, page) {
  const json = JSON.stringify(buildJsonLd(page))
  const script = `<script type="application/ld+json">\n    ${json}\n    </script>`
  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/i.test(html)) {
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, script)
  }
  return html.replace('</head>', `    ${script}\n  </head>`)
}

function injectHreflang(html, page) {
  const url = pageUrl(page.path)
  const tags = [
    `<link rel="alternate" hreflang="en-IN" href="${escapeHtml(url)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(url)}" />`,
  ].join('\n    ')
  if (html.includes('hreflang="en-IN"')) {
    return html
      .replace(/<link rel="alternate" hreflang="en-IN"[^>]*>/i, tags.split('\n    ')[0])
      .replace(/<link rel="alternate" hreflang="x-default"[^>]*>/i, tags.split('\n    ')[1] || '')
  }
  return html.replace('</head>', `    ${tags}\n  </head>`)
}

function injectNoscript(html, page) {
  // Never touch the fonts <noscript> in <head> — only the body SEO fallback.
  const block = `<noscript id="seo-noscript">${bodyHtml(page)}</noscript>`
  if (/id="seo-noscript"/.test(html)) {
    return html.replace(/<noscript\s+id="seo-noscript">[\s\S]*?<\/noscript>/i, block)
  }
  if (/<div id="root"><\/div>/i.test(html)) {
    return html.replace('<div id="root"></div>', `${block}\n    <div id="root"></div>`)
  }
  return html
}

function injectBootContent(html, page) {
  // Keep content outside #root so createRoot() never erases the first paint.
  const boot = bodyHtml(page)
  if (/<div id="seo-boot"[\s\S]*?<\/div>/i.test(html)) {
    return html.replace(/<div id="seo-boot"[\s\S]*?<\/div>/i, `<div id="seo-boot">${boot}</div>`)
  }
  // Legacy shells that still inject into #root
  return html.replace(
    /<div id="root"><\/div>|<div id="root">[\s\S]*?<\/div>/i,
    `<div id="seo-boot">${boot}</div>\n    <div id="root"></div>`,
  )
}

function applyPageMeta(html, page) {
  const title = fullTitle(page.title)
  const url = pageUrl(page.path)
  const keywords = page.keywords
    ? `${DEFAULT_KEYWORDS}, ${page.keywords}`
    : DEFAULT_KEYWORDS

  let next = html
  next = next.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  next = replaceNamedMeta(next, 'description', page.description)
  next = replaceNamedMeta(next, 'keywords', keywords)
  next = next.replace(
    /(<link\s+rel=["']canonical["']\s+href=)(["'])(.*?)\2/i,
    `$1$2${escapeHtml(url)}$2`,
  )
  next = replaceOg(next, 'og:url', url)
  next = replaceOg(next, 'og:title', title)
  next = replaceOg(next, 'og:description', page.description)
  next = replaceNamedMeta(next, 'twitter:url', url)
  next = replaceNamedMeta(next, 'twitter:title', title)
  next = replaceNamedMeta(next, 'twitter:description', page.description)
  next = injectHreflang(next, page)
  next = injectJsonLd(next, page)
  next = injectNoscript(next, page)
  next = injectBootContent(next, page)
  return next
}

function writeSitemap() {
  const urls = PAGES.map(
    (page) => `  <url>
    <loc>${escapeHtml(pageUrl(page.path))}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml)
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml)
}

function ensureIndexNowKey() {
  const key = 'glowminds-indexnow-7f3a9c2e'
  const fileName = `${key}.txt`
  fs.writeFileSync(path.join(publicDir, fileName), key)
  fs.writeFileSync(path.join(distDir, fileName), key)
  return key
}

function main() {
  const indexPath = path.join(distDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.error('[prerender-seo] dist/index.html missing — run vite build first')
    process.exit(1)
  }

  const template = fs.readFileSync(indexPath, 'utf8')
  let count = 0

  for (const page of PAGES) {
    const html = applyPageMeta(template, page)
    if (page.path === '/') {
      fs.writeFileSync(indexPath, html)
    } else {
      const outDir = path.join(distDir, page.path.replace(/^\//, ''))
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'index.html'), html)
    }
    count += 1
  }

  writeSitemap()
  const indexNowKey = ensureIndexNowKey()
  console.log(`[prerender-seo] wrote ${count} page shells + sitemap.xml (${siteUrl})`)
  console.log(`[prerender-seo] IndexNow key file: /${indexNowKey}.txt`)
}

main()
