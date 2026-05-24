/**
 * Resume file import + AI parsing.
 * - extractTextFromFile: PDF / plain text on the client
 * - parseResumeWithAI: structured fields via the backend `/api/ai/parse-resume` endpoint
 */
import { apiFetch } from '@/services/apiClient'

const MAX_PARSE_CHARS = 50_000

/**
 * @param {string} text
 * @returns {Promise<Record<string, string>>}
 */
export async function parseResumeWithAI(text) {
  const trimmed = (text || '').trim()
  if (trimmed.length < 50) {
    throw new Error('Not enough text to parse — try a longer resume file.')
  }
  if (trimmed.length > MAX_PARSE_CHARS) {
    throw new Error(`Resume text is too long (max ${MAX_PARSE_CHARS.toLocaleString()} characters).`)
  }
  const data = await apiFetch('/ai/parse-resume', { body: { text: trimmed } })
  return data?.parsed || data || {}
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  if (!file) throw new Error('No file selected')

  const name = (file.name || '').toLowerCase()

  if (name.endsWith('.txt') || file.type === 'text/plain') {
    return file.text()
  }

  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist')
    const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

    const data = new Uint8Array(await file.arrayBuffer())
    const doc = await pdfjs.getDocument({ data }).promise
    const parts = []
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i)
      const textContent = await page.getTextContent()
      parts.push(textContent.items.map((item) => item.str).join(' '))
    }
    return parts.join('\n\n')
  }

  throw new Error('Unsupported file type. Upload a PDF or .txt file.')
}
