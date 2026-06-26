import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui'
import { searchSkills } from '@/services/skillsApi'

/**
 * Skill input with Supabase-backed autocomplete suggestions.
 * Falls back to free-text add when API is unavailable.
 */
export default function SkillSuggestInput({
  value,
  onChange,
  onSelect,
  placeholder = 'e.g. React, Python, AWS…',
  className,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)

  const fetchSuggestions = useCallback(async (q) => {
    const query = String(q || '').trim()
    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const { skills = [] } = await searchSkills(query, 8)
      setSuggestions(skills)
      setOpen(skills.length > 0)
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchSuggestions(value), 200)
    return () => clearTimeout(t)
  }, [value, fetchSuggestions])

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(skill) {
    const label = skill.name
      .split(/[\s./-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    onSelect(label)
    onChange('')
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapRef} className={`relative flex-1 ${className || ''}`}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            e.preventDefault()
            onSelect(value.trim())
            onChange('')
            setOpen(false)
          }
          if (e.key === 'Escape') setOpen(false)
        }}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md">
          {loading && (
            <li className="px-3 py-2 text-xs text-muted-foreground">Searching…</li>
          )}
          {!loading && suggestions.map((s) => (
            <li key={s.id || s.name}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => { e.preventDefault(); pick(s) }}
              >
                <span className="font-medium capitalize">{s.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {s.category}{s.jobCount ? ` · ${s.jobCount.toLocaleString()} jobs` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
