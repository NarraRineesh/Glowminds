import { useMemo } from 'react'
import { sanitizeJobHtml, stripHtmlToPlain } from '@/utils/jobHtml'

export default function JobDescriptionHtml({ html, plain, className = '' }) {
  const safeHtml = useMemo(() => sanitizeJobHtml(html || ''), [html])
  const fallback = plain || stripHtmlToPlain(html)

  if (safeHtml) {
    return (
      <div
        className={`job-desc-html ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    )
  }

  return (
    <p className={`job-desc-plain ${className}`.trim()}>
      {fallback || 'No description available.'}
    </p>
  )
}
