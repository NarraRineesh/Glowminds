function hexToBytes(hex) {
  const normalized = String(hex).trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error('VITE_PRICING_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }
  const out = new Uint8Array(32)
  for (let i = 0; i < 32; i += 1) {
    out[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function base64ToBytes(value) {
  const binary = atob(value)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i)
  }
  return out
}

async function importAesKey(hexKey) {
  const raw = hexToBytes(hexKey)
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt'])
}

/** Decrypt a pricing payload from GET /api/config/pricing (AES-256-GCM). */
export async function decryptPricingPayload({ iv, tag, data }) {
  const hexKey = import.meta.env.VITE_PRICING_ENCRYPTION_KEY
  if (!hexKey?.trim()) {
    throw new Error('Missing VITE_PRICING_ENCRYPTION_KEY for encrypted pricing response')
  }
  if (!iv || !tag || !data) {
    throw new Error('Encrypted pricing payload is incomplete')
  }

  const key = await importAesKey(hexKey.trim())
  const ivBytes = base64ToBytes(iv)
  const tagBytes = base64ToBytes(tag)
  const dataBytes = base64ToBytes(data)
  const combined = new Uint8Array(dataBytes.length + tagBytes.length)
  combined.set(dataBytes, 0)
  combined.set(tagBytes, dataBytes.length)

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
    key,
    combined,
  )
  return JSON.parse(new TextDecoder().decode(plainBuf))
}

export function isPricingDecryptionConfigured() {
  const hex = import.meta.env.VITE_PRICING_ENCRYPTION_KEY
  return typeof hex === 'string' && /^[0-9a-fA-F]{64}$/.test(hex.trim())
}
