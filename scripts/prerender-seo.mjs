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
  'career operating system, Glowminds, land a job, ATS resume, worldwide jobs, remote jobs, Glow (Bot), mock interviews, application tracker, student career OS'

const NAV_LINKS = [
  ['/', 'Home'],
  ['/about/', 'About'],
  ['/features/', 'Features'],
  ['/pricing/', 'Pricing'],
  ['/careers/', 'Careers'],
  ['/contact/', 'Contact'],
  ['/signup', 'Sign up free'],
]

/** @type {Array<Record<string, any>>} */
const PAGES = [
  {
    path: '/',
    title: 'Career OS to Land Your First Job — Anywhere',
    h1: 'Glowminds — the Career OS that helps you land the job, anywhere',
    description:
      'Glowminds is a Career Operating System for students and early-career professionals worldwide. One workspace for ATS resumes, jobs from around the world, Glow (Bot), interviews, skills, cover letters, and tracking — built to help you land the job. Free to start.',
    keywords:
      'career operating system, land a job worldwide, Glowminds Career OS, remote jobs, ATS resume, Glow (Bot), mock interview, application tracker',
    priority: '1.0',
    changefreq: 'weekly',
    schema: 'home',
    sections: [
      {
        h2: 'Not a resume tool. A Career Operating System.',
        paragraphs: [
          'Glowminds runs the full loop from first resume to offer: write and score ATS resumes, match jobs worldwide (including remote), talk to Glow (Bot), practice interviews, close skill gaps, draft cover letters, and track every application in one account. Built for students and early-career professionals wherever they are applying.',
        ],
        list: [
          'ATS resumes with templates, scoring, and PDF export',
          'Matched jobs and a live careers board',
          'Glow (Bot) for resume, interview, salary, and outreach help',
          'Mock interviews and skill-gap learning paths',
          'Cover letters and a Kanban tracker from applied to offer',
        ],
      },
      {
        h2: 'Explore Glowminds',
        paragraphs: [
          'Use the pages below to see the product, plans, and the team. Sign up free — no credit card.',
        ],
        list: [
          'About — why we built a Career OS',
          'Features — every tool in the workspace',
          'Pricing — Free, ₹99/month, ₹599/year, Lifetime ₹2,999',
          'Careers — live jobs and internships',
        ],
      },
      {
        h2: 'Start free today',
        paragraphs: [
          'Create a Glowminds account to open your Career OS. Free includes job search, 1 ATS resume, 10 application tracks, and 10 AI credits a month. Upgrade when you need more.',
        ],
      },
    ],
  },
  {
    path: '/features',
    title: 'Features — Career OS Tools to Get Hired',
    h1: 'Every tool you need to land the job — in one Career OS',
    description:
      'See everything in the Glowminds Career OS: ATS resumes, matched jobs, Glow (Bot), mock interviews, skill-gap learning, cover letters, and a Kanban tracker from apply to offer.',
    keywords:
      'Glowminds features, career OS tools, job search platform, Glow (Bot), mock interviews, resume ATS, application tracker',
    priority: '0.9',
    changefreq: 'weekly',
    schema: 'webpage',
    sections: [
      {
        h2: 'Inside the Career OS',
        paragraphs: [
          'Glowminds is not a single-purpose resume site. Features cover the whole search: write, match, coach, practice, learn, apply, and track until you have an offer.',
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
    title: 'Pricing — Free, Pro Monthly, Yearly & Lifetime',
    h1: 'Plans for your Career OS',
    description:
      'Run your job search on Glowminds. Free forever, then Pro at ₹99/month, founding yearly ₹599, or Lifetime ₹2,999. Compare every Career OS feature before you upgrade.',
    keywords:
      'Glowminds pricing, Career OS price, student Pro, yearly ₹599, lifetime plan',
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
    title: 'About — Why We Built a Career OS',
    h1: 'About Glowminds',
    description:
      'Glowminds is a Career Operating System for students and early-career professionals worldwide. We put resumes, global jobs, Glow (Bot), interviews, skills, and tracking in one workspace so you can land the role — wherever you are applying.',
    keywords:
      'about Glowminds, career operating system, student career platform, Glow (Bot), worldwide jobs',
    priority: '0.7',
    changefreq: 'monthly',
    schema: 'webpage',
    sections: [
      {
        h2: 'Our mission',
        paragraphs: [
          'We build affordable career tools so students and early-career professionals worldwide can compete with confidence — from the first resume draft to the final interview.',
        ],
      },
    ],
  },
  {
    path: '/careers',
    title: 'Careers & Internships',
    h1: 'Careers and internships on Glowminds',
    description:
      'Browse live jobs and internships on the Glowminds careers board. Part of the Career OS — then match, apply, and track in the same account.',
    keywords: 'Glowminds careers, internships worldwide, remote jobs, careers.glowminds.in, fresher jobs',
    priority: '0.8',
    changefreq: 'daily',
    schema: 'webpage',
    sections: [
      {
        h2: 'Live job board',
        paragraphs: [
          'Open careers.glowminds.in for current roles worldwide, or sign in to Glowminds to match jobs against your profile and track applications.',
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
          areaServed: { '@type': 'Place', name: 'Worldwide' },
        },
        {
          '@type': 'WebSite',
          '@id': websiteId,
          name: SITE_NAME,
          alternateName: 'Glowminds Career OS',
          url: siteUrl,
          description:
            'Career Operating System for students and early-career professionals worldwide — resumes, global jobs, Glow (Bot), interviews, skills, and tracking to land the job.',
          publisher: { '@id': orgId },
          inLanguage: 'en-IN',
          hasPart: [
            { '@type': 'WebPage', name: 'About', url: `${siteUrl}/about/` },
            { '@type': 'WebPage', name: 'Features', url: `${siteUrl}/features/` },
            { '@type': 'WebPage', name: 'Pricing', url: `${siteUrl}/pricing/` },
            { '@type': 'WebPage', name: 'Careers', url: `${siteUrl}/careers/` },
            { '@type': 'WebPage', name: 'Contact', url: `${siteUrl}/contact/` },
          ],
        },
        {
          '@type': 'ItemList',
          name: 'Glowminds',
          itemListElement: [
            { '@type': 'SiteNavigationElement', position: 1, name: 'About', url: `${siteUrl}/about/` },
            { '@type': 'SiteNavigationElement', position: 2, name: 'Features', url: `${siteUrl}/features/` },
            { '@type': 'SiteNavigationElement', position: 3, name: 'Pricing', url: `${siteUrl}/pricing/` },
            { '@type': 'SiteNavigationElement', position: 4, name: 'Careers', url: `${siteUrl}/careers/` },
            { '@type': 'SiteNavigationElement', position: 5, name: 'Contact', url: `${siteUrl}/contact/` },
          ],
        },
        {
          '@type': 'SoftwareApplication',
          name: SITE_NAME,
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: 'Career Development',
          operatingSystem: 'Web',
          url: siteUrl,
          description:
            'Career Operating System for students and early-career professionals worldwide to land a job.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
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
          provider: { '@id': orgId },
          areaServed: { '@type': 'Place', name: 'Worldwide' },
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
          <p><strong>${escapeHtml(SITE_NAME)}</strong> — Career OS for students and early-career professionals worldwide. About · Features · Pricing</p>
          ${navHtml()}
        </header>
        <article>
          <h1>${escapeHtml(page.h1)}</h1>
          <p>${escapeHtml(page.description)}</p>
          ${sections}
          <p><a href="/about/">About</a> · <a href="/features/">Features</a> · <a href="/pricing/">Pricing</a> · <a href="/signup">Sign up free</a></p>
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
