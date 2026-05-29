/** Decode HTML entities (handles double-encoded ATS payloads). */
export function decodeHtmlEntities(text) {
  if (!text) return ''
  let s = String(text)
  for (let i = 0; i < 3; i += 1) {
    const el = document.createElement('textarea')
    el.innerHTML = s
    const next = el.value
    if (next === s) break
    s = next
  }
  return s
}

const BLOCKED_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'form', 'input', 'link', 'meta'])

/** Strip unsafe markup; keep basic formatting for job descriptions. */
export function sanitizeJobHtml(html) {
  const decoded = decodeHtmlEntities(html)
  if (!decoded.trim()) return ''

  const tmp = document.createElement('div')
  tmp.innerHTML = decoded

  tmp.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toLowerCase()
    if (BLOCKED_TAGS.has(tag)) {
      el.remove()
      return
    }
    ;[...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on') || name === 'style' || name === 'srcdoc') {
        el.removeAttribute(attr.name)
      }
      if (name === 'href' || name === 'src') {
        const val = String(attr.value || '').trim().toLowerCase()
        if (val.startsWith('javascript:') || val.startsWith('data:text/html')) {
          el.removeAttribute(attr.name)
        }
      }
    })
  })

  return tmp.innerHTML.trim()
}

export function stripHtmlToPlain(html) {
  const safe = sanitizeJobHtml(html)
  if (!safe) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = safe
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
}
