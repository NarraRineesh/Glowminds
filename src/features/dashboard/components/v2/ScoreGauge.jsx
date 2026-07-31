import { cn } from '@/components/ui'
import styles from '@/features/dashboard/styles/ScoreGauge.module.scss'

/**
 * [v2] Circular score gauge — uses CSS vars for dash offset (no layout inline styles).
 * @param {{ score: number, max?: number, size?: number, label?: string, className?: string }} props
 */
export default function ScoreGauge({ score = 0, max = 100, size = 88, label, className }) {
  const safeMax = max > 0 ? max : 100
  const clamped = Math.max(0, Math.min(safeMax, Number(score) || 0))
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - clamped / safeMax)

  return (
    <div
      className={cn(styles.gauge, className)}
      style={{
        width: size,
        height: size,
        '--gauge-circ': circ,
        '--gauge-offset': offset,
        '--gauge-stroke': size > 100 ? 10 : 8,
        '--gauge-value-size': size > 100 ? '1.6rem' : '1.15rem',
      }}
    >
      <svg className={styles.ring} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className={styles.track} cx={size / 2} cy={size / 2} r={r} />
        <circle className={styles.fill} cx={size / 2} cy={size / 2} r={r} />
      </svg>
      <div className={styles.label}>
        <span className={styles.value}>{Math.round(clamped)}</span>
        {label ? <span className={styles.suffix}>{label}</span> : <span className={styles.suffix}>/{safeMax}</span>}
      </div>
    </div>
  )
}
