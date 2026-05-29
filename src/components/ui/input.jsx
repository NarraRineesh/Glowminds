import { cn } from 'glowminds-resume/ui'

export { Input, Textarea } from 'glowminds-resume/ui'

export function Select({ className, ...props }) {
  return (
    <select
      className={cn(
        'flex h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
