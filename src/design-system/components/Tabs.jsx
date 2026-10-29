import { Tabs as UiTabs, TabsContent, TabsList as UiTabsList, TabsTrigger as UiTabsTrigger, cn } from '@/components/ui'

export function Tabs(props) {
  return <UiTabs {...props} />
}

export function TabsList({ className, ...props }) {
  return (
    <UiTabsList
      variant="line"
      className={cn(
        'h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }) {
  return (
    <UiTabsTrigger
      className={cn(
        'min-h-11 flex-none px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] font-medium shadow-none',
        className,
      )}
      {...props}
    />
  )
}

export { TabsContent }
