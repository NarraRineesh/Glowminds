import { useId } from 'react'
import { Input, Label, Select, Textarea, cn } from '@/components/ui'

function describedBy(hintId, errorId, hint, error) {
  return [hint && !error ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
}

function FieldChrome({ id, label, hint, error, children }) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
      <Label htmlFor={id} className="text-[length:var(--font-size-sm)] font-medium text-foreground">
        {label}
      </Label>
      {children(describedBy(hintId, errorId, hint, error))}
      {hint && !error ? (
        <p id={hintId} className="m-0 text-[length:var(--font-size-xs)] leading-[var(--leading-body)] text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="m-0 text-[length:var(--font-size-xs)] leading-[var(--leading-body)] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const controlClass = 'rounded-[var(--radius-control)] shadow-none'

export function TextField({ id, label, hint, error, className, ...props }) {
  const uid = useId()
  const fieldId = id || uid
  return (
    <FieldChrome id={fieldId} label={label} hint={hint} error={error}>
      {(ariaDescribedBy) => (
        <Input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          className={cn(controlClass, className)}
          {...props}
        />
      )}
    </FieldChrome>
  )
}

export function TextAreaField({ id, label, hint, error, className, ...props }) {
  const uid = useId()
  const fieldId = id || uid
  return (
    <FieldChrome id={fieldId} label={label} hint={hint} error={error}>
      {(ariaDescribedBy) => (
        <Textarea
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          className={cn(controlClass, 'min-h-24', className)}
          {...props}
        />
      )}
    </FieldChrome>
  )
}

export function SelectField({ id, label, hint, error, className, children, ...props }) {
  const uid = useId()
  const fieldId = id || uid
  return (
    <FieldChrome id={fieldId} label={label} hint={hint} error={error}>
      {(ariaDescribedBy) => (
        <Select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          className={cn(controlClass, 'min-h-11', className)}
          {...props}
        >
          {children}
        </Select>
      )}
    </FieldChrome>
  )
}
