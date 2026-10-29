import { toast as sonner } from 'sonner'

/**
 * Same Sonner instance the app already mounts in src/components/Toast.jsx.
 * Does not add a second toaster.
 */
export function notify({ title, description, type = 'message' } = {}) {
  const options = description ? { description } : undefined
  if (type === 'error') return sonner.error(title, options)
  if (type === 'success') return sonner.success(title, options)
  return sonner.message(title, options)
}
