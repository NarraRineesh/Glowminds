/** Local-calendar day key (YYYYMMDD) for streaks and daily quiz. */
export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export function yesterdayKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}
