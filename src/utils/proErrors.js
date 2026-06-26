/** True when the API rejected the call because Pro is required. */
export function isProUpgradeRequired(err) {
  if (!err) return false
  if (err.needsProUpgrade) return true
  return err.code === 'permission-denied' && /pro/i.test(String(err.message || ''))
}
