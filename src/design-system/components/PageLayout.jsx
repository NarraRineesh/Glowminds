import { cn } from '@/components/ui'

const WIDTH = {
  sm: 'max-w-xl',
  md: 'max-w-3xl',
  lg: 'max-w-6xl',
}

/**
 * App column for product and marketing pages.
 * Safe-area padding covers the Capacitor webview and iOS home indicator.
 */
export function PageLayout({ children, width = 'md', className }) {
  return (
    <div className="ds-root min-h-dvh bg-background text-foreground">
      <a href="#ds-main" className="skip-link">
        Skip to content
      </a>
      <main
        id="ds-main"
        tabIndex={-1}
        className={cn(
          'mx-auto w-full min-w-0 outline-none',
          'px-[var(--gutter)] pt-[max(var(--gutter),env(safe-area-inset-top))]',
          'pb-[max(var(--space-6),env(safe-area-inset-bottom))]',
          'sm:px-[var(--space-6)]',
          WIDTH[width] || WIDTH.md,
          className,
        )}
      >
        {children}
      </main>
    </div>
  )
}
