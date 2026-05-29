import { FormControl, FormDescription, FormItem, FormLabel, cn } from 'glowminds-resume/ui'

export { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from 'glowminds-resume/ui'

export function Label(props) {
  return <FormLabel {...props} />
}

export function FormField({ label, htmlFor, children, className, hint, error }) {
  return (
    <FormItem className={cn('gap-1.5', className)}>
      {label && <FormLabel htmlFor={htmlFor}>{label}</FormLabel>}
      <FormControl>{children}</FormControl>
      {hint && !error && <FormDescription>{hint}</FormDescription>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </FormItem>
  )
}

export function FormRow({ children, className }) {
  return <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>{children}</div>
}
