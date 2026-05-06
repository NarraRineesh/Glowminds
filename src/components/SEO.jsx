import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '@/config/site'

const SITE_NAME = 'Glowminds'
const DEFAULT_IMG = `${SITE_URL}/og-image.png`

export default function SEO({ title, description, path = '/', image, type = 'website', noIndex = false, keywords, structuredData }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — AI-Powered Career Platform for Students`
  const url = `${SITE_URL}${path}`
  const defaultKeywords = 'AI career platform, student jobs, resume builder, career coach, job search India, internship, fresher jobs, career guidance, AI interview prep, job application tracker'
  const metaKeywords = keywords ? `${defaultKeywords}, ${keywords}` : defaultKeywords

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content="Glowminds AI" />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || DEFAULT_IMG} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || DEFAULT_IMG} />
      <meta name="twitter:site" content="@Glowminds" />

      {/* Additional SEO */}
      <meta name="theme-color" content="#388bfd" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )
}
