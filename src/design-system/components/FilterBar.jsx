import { useRef } from 'react'
import { cn } from '@/components/ui'

/**
 * Single-select filter. Radiogroup with arrow, Home, and End keys.
 */
export function FilterBar({ label, options, value, onChange, className }) {
  const refs = useRef([])
  const ids = options.map((option) => option.id)
  const selectedIndex = ids.indexOf(value)
  const tabIndexFor = (index) => (index === (selectedIndex === -1 ? 0 : selectedIndex) ? 0 : -1)

  function move(index) {
    const count = ids.length
    if (!count) return
    const next = (index + count) % count
    onChange(ids[next])
    refs.current[next]?.focus()
  }

  function onKeyDown(event, index) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      move(index + 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      move(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      move(ids.length - 1)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex flex-wrap gap-[var(--space-1)]', className)}
    >
      {options.map((option, index) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={tabIndexFor(index)}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'min-h-11 rounded-[var(--radius-control)] border px-[var(--space-3)] text-[length:var(--font-size-sm)] font-medium',
              'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
