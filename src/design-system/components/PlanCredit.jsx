/** Presentational. Callers pass the live balance and plan name. */
export function CreditIndicator({ balance, label = 'Credits' }) {
  const value = typeof balance === 'number' ? balance : '—'
  return (
    <p className="m-0 inline-flex min-h-11 items-center gap-[var(--space-2)] rounded-[var(--radius-control)] border border-border bg-card px-[var(--space-3)] text-[length:var(--font-size-sm)]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-[length:var(--font-size-sm)] font-medium tabular-nums text-foreground">{value}</span>
    </p>
  )
}

export function PlanIndicator({ name, detail }) {
  return (
    <p className="m-0 inline-flex min-h-11 items-center gap-[var(--space-2)] rounded-[var(--radius-control)] border border-border bg-card px-[var(--space-3)] text-[length:var(--font-size-sm)]">
      <span className="font-medium text-foreground">{name}</span>
      {detail ? <span className="text-muted-foreground">{detail}</span> : null}
    </p>
  )
}
