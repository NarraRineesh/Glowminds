/** Empty is allowed. A filled phone must look like a real number. */
export function phoneValidationError(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) {
    return 'Enter a phone number with 10–15 digits.'
  }
  if (!/^[+\d][\d\s().-]{6,}$/.test(raw)) {
    return 'Enter a valid phone number.'
  }
  return null
}
