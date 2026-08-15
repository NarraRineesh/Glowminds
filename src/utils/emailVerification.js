/** Password accounts must verify email. Google sign-in is already verified. */
export function requiresEmailVerification(user) {
  if (!user) return false
  const providers = Array.isArray(user.providerData)
    ? user.providerData.map((p) => p.providerId)
    : (user.providerIds || [])
  if (providers.includes('google.com')) return false
  if (!providers.includes('password')) return false
  return user.emailVerified !== true
}
