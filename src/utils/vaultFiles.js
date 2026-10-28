const DEFAULT_MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
  'png', 'jpg', 'jpeg', 'webp', 'gif',
  'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'zip',
])

const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'dll', 'js', 'mjs', 'vbs', 'ps1', 'sh', 'jar', 'apk', 'dmg',
])

export const VAULT_ACCEPT = [...ALLOWED_EXTENSIONS].map((ext) => `.${ext}`).join(',')

function extensionOf(name) {
  const base = String(name || '').trim().toLowerCase()
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return ''
  return base.slice(dot + 1)
}

export function formatBytes(n) {
  const size = Number(n) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/** @returns {string|null} user-facing rejection, or null when the file may be uploaded. */
export function vaultFileRejection(file, { maxBytes = DEFAULT_MAX_BYTES } = {}) {
  if (!file) return 'Choose a file to upload.'
  const ext = extensionOf(file.name)
  if (!ext || BLOCKED_EXTENSIONS.has(ext)) {
    return 'This file type isn’t allowed. Upload a PDF, document, spreadsheet, or image.'
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return 'This file type isn’t allowed. Upload a PDF, document, spreadsheet, or image.'
  }
  if (file.size > maxBytes) {
    return `That file is ${formatBytes(file.size)}. The maximum is ${formatBytes(maxBytes)} per file.`
  }
  return null
}
