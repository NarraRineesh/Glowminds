/**
 * Resume Builder AI helpers. Thin wrapper around the backend `/api/ai/paraphrase`
 * endpoint, which is routed to Gemini 2.5 Flash via the unified ai client
 * (falls back to OpenRouter). The wrapper exists so the resume builder can
 * own its tone presets without coupling to the generic paraphrase UI.
 */
import { apiFetch } from '@/services/apiClient'

export const IMPROVE_TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'concise', label: 'Concise' },
  { id: 'creative', label: 'Creative' },
]

/**
 * Send a snippet of resume text to the AI for rewrite.
 * @param {Object} params
 * @param {string} params.text - the original text to rewrite (3-4000 chars)
 * @param {string} [params.tone='professional']
 * @returns {Promise<string[]>} up to 3 rewritten variants
 */
export async function improveText({ text, tone = 'professional' } = {}) {
  const trimmed = (text || '').trim()
  if (trimmed.length < 3) {
    throw new Error('Select at least a few words to improve.')
  }
  if (trimmed.length > 4000) {
    throw new Error('Selection is too long (max 4000 characters).')
  }
  const data = await apiFetch('/ai/paraphrase', {
    body: { text: trimmed, tone },
  })
  return Array.isArray(data?.variants) ? data.variants.slice(0, 3) : []
}
