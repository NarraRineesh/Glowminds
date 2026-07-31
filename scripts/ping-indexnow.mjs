/**
 * Notify IndexNow (Bing/Yandex/etc.) about public URLs after deploy.
 * Google does not use IndexNow, but this still helps multi-engine discovery.
 */
const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || 'https://glowminds.in').replace(/\/$/, '')
const key = 'glowminds-indexnow-7f3a9c2e'
const urls = [
  `${siteUrl}/`,
  `${siteUrl}/features/`,
  `${siteUrl}/pricing/`,
  `${siteUrl}/about/`,
  `${siteUrl}/contact/`,
  `${siteUrl}/privacy/`,
  `${siteUrl}/terms/`,
  `${siteUrl}/refund/`,
]

const payload = {
  host: new URL(siteUrl).host,
  key,
  keyLocation: `${siteUrl}/${key}.txt`,
  urlList: urls,
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
})

const text = await res.text().catch(() => '')
console.log(`[indexnow] ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ''}`)
if (!res.ok && res.status !== 202) process.exitCode = 1
