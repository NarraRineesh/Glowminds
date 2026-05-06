/**
 * Resume file parser
 * - Client-side: extracts raw text from PDF / DOCX / TXT
 * - Server-side: sends text to Firebase Cloud Function (AI) for structured parsing
 */
import { getFunctions, httpsCallable } from 'firebase/functions'
import app from './firebase'

const functions = getFunctions(app)
const parseResumeFn = httpsCallable(functions, 'parseResume')

/**
 * Extract raw text from an uploaded file (PDF, DOCX, or TXT)
 */
export async function extractText(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'pdf') return extractPDF(file)
  if (ext === 'docx') return extractDOCX(file)
  if (ext === 'txt') return file.text()

  throw new Error(`Unsupported file type: .${ext}. Please upload PDF, DOCX, or TXT.`)
}

async function extractPDF(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map(item => item.str).join(' '))
  }
  return pages.join('\n\n')
}

async function extractDOCX(file) {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

/**
 * Parse resume file — extract text client-side, then call Cloud Function for AI parsing
 * @param {File} file - uploaded PDF/DOCX/TXT file
 * @returns {Object} structured resume fields
 */
export async function parseResumeWithAI(file) {
  const rawText = await extractText(file)
  if (!rawText || rawText.trim().length < 20) {
    throw new Error('Could not extract enough text from the file. Please try a different format.')
  }

  const { data } = await parseResumeFn({ text: rawText })
  return data
}
