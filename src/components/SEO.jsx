import { Helmet } from 'react-helmet-async'
import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_KEYWORDS,
  SEO_LOCALE,
  SEO_OG_IMAGE_ALT,
  SEO_SITE_NAME,
  SEO_TWITTER,
  buildTitle,
  normalizeStructuredData,
  ogImageUrl,
} from '@/config/seo'
import { pageUrl } from '@/config/site'

const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const NOINDEX_ROBOTS = 'noindex, nofollow'

/**
 * @param {{
 *   title?: string
 *   description?: string
 *   path?: string
 *   image?: string
 *   imageAlt?: string
 *   type?: string
 *   noIndex?: boolean
 *   keywords?: string
 *   structuredData?: object | object[] | null
 * }} props
 */
export default function SEO({
  title,
  description = SEO_DEFAULT_DESCRIPTION,
  path = '/',
  image,
  imageAlt = SEO_OG_IMAGE_ALT,
  type = 'website',
  noIndex = false,
  keywords,
  structuredData,
}) {
  const fullTitle = buildTitle(title)
  const url = pageUrl(path)
  const imageUrl = ogImageUrl(image)
  const metaKeywords = keywords ? `${SEO_DEFAULT_KEYWORDS}, ${keywords}` : SEO_DEFAULT_KEYWORDS
  const jsonLd = normalizeStructuredData(structuredData)

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en-IN" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={SEO_SITE_NAME} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noIndex ? NOINDEX_ROBOTS : INDEX_ROBOTS} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:site_name" content={SEO_SITE_NAME} />
      <meta property="og:locale" content={SEO_LOCALE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />
      <meta name="twitter:site" content={SEO_TWITTER} />

      <meta name="theme-color" content="#07090f" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={SEO_SITE_NAME} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  )
}
