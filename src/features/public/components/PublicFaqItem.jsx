import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
} from '@/components/ui'

const VARIANT_CLASS = {
  landing: 'rounded-2xl border border-border bg-card px-2',
  pricing: 'rounded-xl border border-border bg-card px-2',
  contact: 'rounded-xl border border-border bg-card px-2 hover:border-primary/30',
}

export default function PublicFaqItem({ q, a, value, variant = 'landing' }) {
  return (
    <AccordionItem value={value} className={cn('border-0', VARIANT_CLASS[variant] || VARIANT_CLASS.landing)}>
      <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
        {q}
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
        {a}
      </AccordionContent>
    </AccordionItem>
  )
}
