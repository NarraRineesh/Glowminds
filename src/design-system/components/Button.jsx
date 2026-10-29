import { Button as UiButton, cn } from '@/components/ui'

/**
 * Product button. One accent, no glow. Coarse pointers (webview) get a 44px target.
 */
export function Button({ className, size = 'default', ...props }) {
  return (
    <UiButton
      size={size}
      className={cn(
        'rounded-[var(--radius-control)] shadow-none',
        'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
        '[@media(pointer:coarse)]:min-h-11',
        className,
      )}
      {...props}
    />
  )
}
