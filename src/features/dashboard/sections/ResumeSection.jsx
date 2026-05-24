import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import ImproveTextModal from './resume/ImproveTextModal'
import Loader from '@/components/Loader'
import { createResumeFirestorePayload } from '@/constants/resumeProfileSchema'
import { trackToolUsage } from '@/services/usageTracker'
import { buildSyncedResumeContent, profileHasResumeData } from '@/utils/resumeFromProfile'
import {
  RESUME_TEMPLATES,
  SECTION_TYPES,
  LAYOUTS,
  DEFAULT_DESIGN,
  EMPTY_CONTENT,
  cloneTemplate,
  getTemplateById,
} from '@/constants/resumeTemplates'
import '@/styles/resume-builder.css'

/** Single resume document per user. */
const PRIMARY_RESUME_ID = 'primary'

/* =========================================================
   Constants (UI-only)
========================================================= */

const COLORS = [
  '#0d6cf2', '#1f2330', '#7a8896', '#16b981', '#ef4444', '#3b82f6',
  '#f97316', '#facc15', '#7c3aed', '#0ea5a8', '#9a4a16', '#0f172a',
]

const FONTS = ['Source Serif 4', 'Inter', 'Playfair Display', 'Merriweather', 'Roboto', 'Volkhov']

const FONT_SCALES = { small: 0.92, medium: 1, large: 1.06, xl: 1.14 }

/* Physical sheet sizes at 96dpi — used for true multi-page pagination */
const PAGE_PX = {
  A4:     { w: 794, h: 1123 }, // 210 × 297 mm
  Letter: { w: 816, h: 1056 }, // 8.5 × 11 in
}

/* =========================================================
   Helpers
========================================================= */

const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}`

function handlePaste(e) {
  e.preventDefault()
  const text = (e.clipboardData || window.clipboardData).getData('text/plain')
  document.execCommand('insertText', false, text)
}

function handleSingleLineKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.currentTarget.blur()
  }
}

/* ---------- normalizeContent: accept any past shape, return v3 ----------
   v3 shape:
     { header, sections: [...] }                                          (single)
     { header, main: [...], sidebar: [...] }                              (two-column)
*/
function normalizeContent(raw) {
  if (!raw?.header && !raw?.sections?.length && !raw?.main?.length && !raw?.sidebar?.length) {
    return cloneTemplate(EMPTY_CONTENT)
  }
  return {
    header: { name: '', headline: '', contact: '', ...raw.header },
    sections: Array.isArray(raw.sections) ? raw.sections.map((s) => ({ ...s })) : [],
    main: Array.isArray(raw.main) ? raw.main.map((s) => ({ ...s })) : [],
    sidebar: Array.isArray(raw.sidebar) ? raw.sidebar.map((s) => ({ ...s })) : [],
  }
}

/** Apply a template's sample content + design (no profile merge). */
function applyTemplateContent(tpl) {
  const layout = tpl.layout || LAYOUTS.SINGLE
  return {
    content: normalizeContent(tpl.content),
    design: { ...DEFAULT_DESIGN, ...tpl.design, template: tpl.id },
    layout,
    sidebarSide: tpl.sidebarSide || 'right',
  }
}

/* =========================================================
   Editable primitive
========================================================= */

// Maps an Editable DOM node to its latest React onChange so the AI
// "Improve text" flow can flush replacements straight back into state.
const editableCallbacks = new WeakMap()

function Editable({ as: Tag = 'div', value, onChange, placeholder, singleLine = false, className, style }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (document.activeElement === el || el.contains(document.activeElement)) return
    if ((el.innerText || '') !== (value || '')) el.innerText = value || ''
  }, [value])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    editableCallbacks.set(el, onChange)
    return () => { editableCallbacks.delete(el) }
  }, [onChange])

  const flush = (el) => onChange((el?.innerText || '').replace(/\u00a0/g, ' '))

  return (
    <Tag
      ref={ref}
      className={className}
      style={style}
      contentEditable
      suppressContentEditableWarning
      data-rbv2-editable=""
      data-placeholder={placeholder}
      onPaste={handlePaste}
      onKeyDown={singleLine ? handleSingleLineKey : undefined}
      onInput={(e) => flush(e.currentTarget)}
      onBlur={(e) => flush(e.currentTarget)}
    />
  )
}

/**
 * Tracks the last selection / focus inside any Editable so that the toolbar
 * "Improve text" button (which steals focus when clicked) can still know
 * what to act on. Returns:
 *   - hasTarget(): boolean
 *   - getText(): selected text, or the full focused field's text if collapsed
 *   - replace(newText): replaces selection (or whole field) and flushes state
 */
function useImproveTarget() {
  const stateRef = useRef({ el: null, range: null, text: '' })

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      let node = range.startContainer
      if (node && node.nodeType === 3) node = node.parentElement
      const editable = node && node.closest && node.closest('[data-rbv2-editable]')
      if (!editable) return
      // Ignore the offscreen measurement layer
      if (editable.closest('.rbv2-measure-layer')) return
      stateRef.current = {
        el: editable,
        range: range.cloneRange(),
        text: sel.toString(),
      }
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  const hasTarget = () => !!stateRef.current.el && document.body.contains(stateRef.current.el)

  const getText = () => {
    const { el, text } = stateRef.current
    if (!el) return ''
    const sel = (text || '').trim()
    return sel.length > 0 ? text : (el.innerText || '')
  }

  const replace = (newText) => {
    const { el, range, text } = stateRef.current
    if (!el || !newText || !document.body.contains(el)) return false
    el.focus()
    const hasSelection = (text || '').trim().length > 0
    if (hasSelection && range) {
      try {
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
        const ok = document.execCommand && document.execCommand('insertText', false, newText)
        if (!ok) {
          // Fallback: manual range replace
          range.deleteContents()
          range.insertNode(document.createTextNode(newText))
        }
      } catch {
        el.innerText = newText
      }
    } else {
      el.innerText = newText
    }
    const cb = editableCallbacks.get(el)
    if (cb) cb(el.innerText)
    // Reset cached selection so the next click starts fresh
    stateRef.current = { el, range: null, text: '' }
    return true
  }

  return { hasTarget, getText, replace }
}

/* =========================================================
   Section renderers
========================================================= */

function ParagraphSection({ section, onUpdate }) {
  return (
    <Editable
      as="p"
      className={`rbv2-paragraph${section.variant === 'highlight' ? ' rbv2-summary' : ''}`}
      value={section.body}
      placeholder="Write a few sentences…"
      onChange={(v) => onUpdate({ ...section, body: v })}
    />
  )
}

function InlineSection({ section, onUpdate }) {
  return (
    <Editable
      as="p"
      className="rbv2-skills"
      value={section.body}
      placeholder="Comma- or dot-separated list"
      singleLine
      onChange={(v) => onUpdate({ ...section, body: v })}
    />
  )
}

function ListSection({ section, onUpdate, previewMode }) {
  const items = section.items || []
  const updateItem = (i, v) =>
    onUpdate({ ...section, items: items.map((it, ix) => (ix === i ? v : it)) })
  const addItem = () => onUpdate({ ...section, items: [...items, ''] })
  const removeItem = (i) => onUpdate({ ...section, items: items.filter((_, ix) => ix !== i) })

  return (
    <>
      <ul className="rbv2-list">
        {items.map((it, i) => (
          <li key={i}>
            <Editable
              as="span"
              value={it}
              singleLine
              onChange={(v) => updateItem(i, v)}
              placeholder="Add an item…"
            />
          </li>
        ))}
      </ul>
      {!previewMode && (
        <div className="rbv2-row-actions" style={{ opacity: 1 }}>
          <button type="button" className="rbv2-row-btn" onClick={addItem}>+ Item</button>
          {items.length > 0 && (
            <button type="button" className="rbv2-row-btn" onClick={() => removeItem(items.length - 1)}>− Item</button>
          )}
        </div>
      )}
    </>
  )
}

function EducationSection({ section, onUpdate, previewMode }) {
  const items = section.items || []
  const update = (i, patch) =>
    onUpdate({ ...section, items: items.map((it, ix) => (ix === i ? { ...it, ...patch } : it)) })
  const addItem = () =>
    onUpdate({ ...section, items: [...items, { degree: '', school: '', location: '', dates: '' }] })
  const removeItem = (i) => onUpdate({ ...section, items: items.filter((_, ix) => ix !== i) })

  return (
    <>
      {items.map((edu, i) => (
        <div key={i} className="rbv2-edu">
          <div className="rbv2-job-head">
            <Editable
              as="span"
              className="degree"
              value={edu.degree}
              onChange={(v) => update(i, { degree: v })}
              placeholder="Degree"
              singleLine
            />
            <Editable
              as="span"
              className="when"
              value={edu.dates}
              onChange={(v) => update(i, { dates: v })}
              placeholder="Year"
              singleLine
            />
          </div>
          <div className="rbv2-job-meta">
            <Editable
              as="span"
              className="school"
              value={edu.school}
              onChange={(v) => update(i, { school: v })}
              placeholder="School"
              singleLine
            />
            {(edu.location || !previewMode) && (
              <Editable
                as="span"
                className="loc"
                value={edu.location || ''}
                onChange={(v) => update(i, { location: v })}
                placeholder="Location"
                singleLine
              />
            )}
          </div>
          {!previewMode && (
            <div className="rbv2-row-actions">
              <button type="button" className="rbv2-row-btn danger" onClick={() => removeItem(i)}>Remove</button>
            </div>
          )}
        </div>
      ))}
      {!previewMode && (
        <div className="rbv2-row-actions" style={{ opacity: 1 }}>
          <button type="button" className="rbv2-row-btn" onClick={addItem}>+ Add education</button>
        </div>
      )}
    </>
  )
}

function AchievementsSection({ section, onUpdate, previewMode }) {
  const items = section.items || []
  const update = (i, patch) =>
    onUpdate({ ...section, items: items.map((it, ix) => (ix === i ? { ...it, ...patch } : it)) })
  const addItem = () =>
    onUpdate({ ...section, items: [...items, { icon: '⭐', title: '', description: '' }] })
  const removeItem = (i) => onUpdate({ ...section, items: items.filter((_, ix) => ix !== i) })

  return (
    <>
      {items.map((ach, i) => (
        <div key={i} className="rbv2-ach">
          <Editable
            as="span"
            className="rbv2-ach-icon"
            value={ach.icon || ''}
            onChange={(v) => update(i, { icon: v })}
            placeholder="🏆"
            singleLine
          />
          <div className="rbv2-ach-body">
            <Editable
              as="div"
              className="rbv2-ach-title"
              value={ach.title}
              onChange={(v) => update(i, { title: v })}
              placeholder="Achievement title"
              singleLine
            />
            <Editable
              as="div"
              className="rbv2-ach-desc"
              value={ach.description}
              onChange={(v) => update(i, { description: v })}
              placeholder="Add a brief, quantifiable description…"
            />
          </div>
          {!previewMode && (
            <button
              type="button"
              className="rbv2-row-btn danger"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => removeItem(i)}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {!previewMode && (
        <div className="rbv2-row-actions" style={{ opacity: 1 }}>
          <button type="button" className="rbv2-row-btn" onClick={addItem}>+ Achievement</button>
        </div>
      )}
    </>
  )
}

function ExperienceSection({ section, onUpdate, previewMode }) {
  const items = section.items || []
  const updateItem = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    onUpdate({ ...section, items: next })
  }
  const addItem = () =>
    onUpdate({
      ...section,
      items: [...items, { company: '', role: '', dates: '', location: '', bullets: [''] }],
    })
  const removeItem = (idx) => onUpdate({ ...section, items: items.filter((_, i) => i !== idx) })
  const addBullet = (idx) => updateItem(idx, { bullets: [...(items[idx].bullets || []), ''] })
  const removeBullet = (idx, bIdx) =>
    updateItem(idx, { bullets: (items[idx].bullets || []).filter((_, i) => i !== bIdx) })

  return (
    <>
      {items.map((exp, idx) => (
        <div key={idx} className="rbv2-job">
          <div className="rbv2-job-head">
            <Editable as="span" className="co" value={exp.company} onChange={(v) => updateItem(idx, { company: v })} placeholder="Company" singleLine />
            <Editable as="span" className="loc" value={exp.location} onChange={(v) => updateItem(idx, { location: v })} placeholder="Location" singleLine />
          </div>
          <div className="rbv2-job-meta">
            <Editable as="span" className="role" value={exp.role} onChange={(v) => updateItem(idx, { role: v })} placeholder="Role" singleLine />
            <Editable as="span" className="when" value={exp.dates} onChange={(v) => updateItem(idx, { dates: v })} placeholder="MM/YYYY – Present" singleLine />
          </div>

          <ul className="rbv2-bullets">
            {(exp.bullets || []).map((b, bIdx) => (
              <li key={bIdx}>
                <Editable
                  as="span"
                  value={b}
                  onChange={(v) => {
                    const nextBullets = [...(exp.bullets || [])]
                    nextBullets[bIdx] = v
                    updateItem(idx, { bullets: nextBullets })
                  }}
                  placeholder="Add an impact bullet…"
                />
              </li>
            ))}
          </ul>

          {!previewMode && (
            <div className="rbv2-row-actions">
              <button type="button" className="rbv2-row-btn" onClick={() => addBullet(idx)}>+ Bullet</button>
              {(exp.bullets || []).length > 1 && (
                <button type="button" className="rbv2-row-btn" onClick={() => removeBullet(idx, exp.bullets.length - 1)}>− Bullet</button>
              )}
              <button type="button" className="rbv2-row-btn danger" onClick={() => removeItem(idx)}>Remove role</button>
            </div>
          )}
        </div>
      ))}

      {!previewMode && (
        <div className="rbv2-row-actions" style={{ opacity: 1 }}>
          <button type="button" className="rbv2-row-btn" onClick={addItem}>+ Add experience</button>
        </div>
      )}
    </>
  )
}

const SECTION_RENDERERS = {
  [SECTION_TYPES.PARAGRAPH]: ParagraphSection,
  [SECTION_TYPES.INLINE]: InlineSection,
  [SECTION_TYPES.LIST]: ListSection,
  [SECTION_TYPES.EXPERIENCE]: ExperienceSection,
  [SECTION_TYPES.EDUCATION]: EducationSection,
  [SECTION_TYPES.ACHIEVEMENTS]: AchievementsSection,
}

/* =========================================================
   Generic section block (title + body) used on either
   side of the canvas (single or two-column).
========================================================= */

function SectionBlock({ section, onUpdate, previewMode, showTitle = true, isContinued = false }) {
  const Renderer = SECTION_RENDERERS[section.type]
  if (!Renderer) return null
  return (
    <section className={`rbv2-section${isContinued ? ' is-continued' : ''}`}>
      {showTitle && (
        <Editable
          as="h3"
          value={section.title || ''}
          onChange={(v) => onUpdate({ ...section, title: v })}
          placeholder="Section title"
          singleLine
        />
      )}
      <Renderer section={section} onUpdate={onUpdate} previewMode={previewMode} />
    </section>
  )
}

/* =========================================================
   Side panels
========================================================= */

function DesignPanel({ design, setDesign, onClose }) {
  const set = (k, v) => setDesign((d) => ({ ...d, [k]: v }))
  const margins = Number(design.margins ?? DEFAULT_DESIGN.margins)
  const spacing = Number(design.spacing ?? DEFAULT_DESIGN.spacing)

  return (
    <div className="rbv2-panel">
      <div className="rbv2-side-h">
        <h2>Design &amp; Font</h2>
        <button className="rbv2-close" onClick={onClose} title="Close" aria-label="Close design panel">✕</button>
      </div>

      <div className="rbv2-side-section">
        <div className="rbv2-side-label">Page margins: <span className="val">{margins.toFixed(1)}</span></div>
        <div className="rbv2-slider-row">
          <span className="rbv2-slider-end">−</span>
          <input className="rbv2-range" type="range" min="0.7" max="1.6" step="0.05" value={margins} onChange={(e) => set('margins', Number(e.target.value))} />
          <span className="rbv2-slider-end">+</span>
        </div>
        <div className="rbv2-slider-foot"><span>narrow</span><span>wide</span></div>
      </div>

      <div className="rbv2-side-section">
        <div className="rbv2-side-label">Section spacing: <span className="val">{spacing.toFixed(1)}</span></div>
        <div className="rbv2-slider-row">
          <span className="rbv2-slider-end">−</span>
          <input className="rbv2-range" type="range" min="0.7" max="1.6" step="0.05" value={spacing} onChange={(e) => set('spacing', Number(e.target.value))} />
          <span className="rbv2-slider-end">+</span>
        </div>
        <div className="rbv2-slider-foot"><span>compact</span><span>more space</span></div>
      </div>

      <div className="rbv2-side-section">
        <div className="rbv2-side-label">Accent</div>
        <div className="rbv2-swatches">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`rbv2-sw${design.accent === c ? ' is-active' : ''}`}
              style={{ background: c }}
              onClick={() => set('accent', c)}
              aria-label={`Use ${c} as accent color`}
            />
          ))}
        </div>
      </div>

      {(design.sidebarBackground !== undefined && design.sidebarBackground !== '') && (
        <div className="rbv2-side-section">
          <div className="rbv2-side-label">Sidebar</div>
          <div className="rbv2-swatches">
            {['#1e3a5f', '#0e8d8d', '#0a7a3b', '#374151', '#f4f6fa', '#fdf6ee', '#eaf6f7', '#f6fbf8'].map((c) => (
              <button
                key={c}
                type="button"
                className={`rbv2-sw${design.sidebarBackground === c ? ' is-active' : ''}`}
                style={{ background: c, boxShadow: '0 0 0 1px rgba(0,0,0,.12)' }}
                onClick={() => {
                  const dark = ['#1e3a5f', '#0e8d8d', '#0a7a3b', '#374151'].includes(c)
                  setDesign((d) => ({
                    ...d,
                    sidebarBackground: c,
                    sidebarText: dark ? '#ffffff' : '#1f2330',
                  }))
                }}
                aria-label={`Sidebar ${c}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="rbv2-side-section">
        <div className="rbv2-side-label">Font style</div>
        <select className="rbv2-select" value={design.fontFamily} onChange={(e) => set('fontFamily', e.target.value)}>
          {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div className="rbv2-side-section">
        <div className="rbv2-side-label">Font size: <span className="val" style={{ textTransform: 'capitalize' }}>{design.fontSize}</span></div>
        <div className="rbv2-slider-row">
          <span className="rbv2-slider-end">A</span>
          <input
            className="rbv2-range"
            type="range"
            min="0"
            max="3"
            step="1"
            value={Object.keys(FONT_SCALES).indexOf(design.fontSize)}
            onChange={(e) => set('fontSize', Object.keys(FONT_SCALES)[Number(e.target.value)] || 'medium')}
          />
          <span className="rbv2-slider-end" style={{ fontSize: 14 }}>A</span>
        </div>
      </div>

      <div className="rbv2-side-section">
        <div className="rbv2-side-label">Line height: <span className="val">{design.lineHeight.toFixed(2)}</span></div>
        <div className="rbv2-slider-row">
          <span className="rbv2-slider-end">−</span>
          <input className="rbv2-range" type="range" min="0.85" max="1.6" step="0.05" value={design.lineHeight} onChange={(e) => set('lineHeight', Number(e.target.value))} />
          <span className="rbv2-slider-end">+</span>
        </div>
        <div className="rbv2-slider-foot"><span>condensed</span><span>spacious</span></div>
      </div>

      <div className="rbv2-side-section">
        <div className="rbv2-side-label">Backgrounds</div>
        <div className="rbv2-bg-row">
          {['green', 'plain', 'dotted', 'lined'].map((bg) => (
            <button
              key={bg}
              type="button"
              className={`rbv2-bg-card ${bg}${design.background === bg ? ' is-active' : ''}`}
              onClick={() => set('background', bg)}
              aria-label={`${bg} background`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TemplatesPanel({ design, applyTemplate, setDocSize, onContinue, onClose }) {
  return (
    <div className="rbv2-panel">
      <div className="rbv2-side-h">
        <h2>Select a template</h2>
        <button className="rbv2-close" onClick={onClose} title="Close" aria-label="Close templates panel">✕</button>
      </div>

      <div className="rbv2-tpl-list" role="listbox" aria-label="Resume templates">
        {RESUME_TEMPLATES.map((t) => {
          const active = design.template === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={active}
              className={`rbv2-tpl-row${active ? ' is-active' : ''}`}
              onClick={() => applyTemplate(t.id)}
              title={`Use the “${t.name}” template`}
            >
              <div className={`rbv2-tpl-mini ${t.thumb || ''}`}>
                <span className="lines" />
                {t.layout === LAYOUTS.TWO_COLUMN && (
                  <span
                    className="mini-side"
                    data-side={t.sidebarSide || 'right'}
                    style={{ background: t.design?.sidebarBackground || '#dadfe6' }}
                  />
                )}
              </div>
              <div className="rbv2-tpl-info">
                <span className="rbv2-tpl-info-name">{t.name}</span>
                {t.meta && <span className="rbv2-tpl-info-meta">{t.meta}</span>}
              </div>
              {active && <span className="rbv2-tpl-check" aria-hidden>✓</span>}
            </button>
          )
        })}
      </div>

      <div className="rbv2-tpl-actions">
        <button type="button" className="rbv2-cta" onClick={onContinue}>Continue Editing</button>
        <div className="rbv2-doc-toggle">
          <span className="lbl">Document size</span>
          <div className="rbv2-seg">
            {['A4', 'Letter'].map((d) => (
              <button
                key={d}
                type="button"
                className={design.docSize === d ? 'is-active' : ''}
                onClick={() => setDocSize(d)}
              >
                {d === 'Letter' ? 'US Letter' : d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Editable canvas — walks the JSON
========================================================= */

/**
 * Paginated canvas: measures every section in an offscreen layer, then
 * splits them across as many fixed-size A4/Letter "sheets" as needed so
 * that no section is ever cut in half — both on screen and in the PDF.
 */
function ResumeCanvas({
  content,
  layout,
  sidebarSide,
  setContent,
  design,
  previewMode,
  exporting,
  pageRef,
  repaginateKey = 0,
}) {
  const updateHeader = (patch) =>
    setContent((c) => ({ ...c, header: { ...c.header, ...patch } }))

  const updateInList = (key) => (idx, next) =>
    setContent((c) => ({
      ...c,
      [key]: (c[key] || []).map((s, i) => (i === idx ? next : s)),
    }))

  const fontScale = FONT_SCALES[design.fontSize] || 1
  const styleVars = {
    '--rbv2-font': `'${design.fontFamily}'`,
    '--rbv2-fs': fontScale,
    '--rbv2-lh': design.lineHeight,
    '--rbv2-mar': design.margins ?? DEFAULT_DESIGN.margins,
    '--rbv2-sp': design.spacing ?? DEFAULT_DESIGN.spacing,
    '--rbv2-doc-accent': design.accent,
    '--rbv2-page-bg': design.pageBackground || '#ffffff',
    '--rbv2-side-bg': design.sidebarBackground || 'transparent',
    '--rbv2-side-text': design.sidebarText || '#1f2330',
  }

  const isTwo = layout === LAYOUTS.TWO_COLUMN
  const sideSide = sidebarSide || 'right'
  const PAGE = PAGE_PX[design.docSize] || PAGE_PX.A4
  const mar = Number(design.margins) || 1
  // Vertical paddings used by the .rbv2-page-head / .rbv2-page-body CSS
  const PAGE_VPAD = (44 + 56) * mar
  const usableBodyH = Math.max(200, PAGE.h - PAGE_VPAD)

  const renderHeader = () => (
    <header className="rbv2-canvas-header">
      <Editable as="h1" className="rbv2-name" value={content.header?.name || ''} onChange={(v) => updateHeader({ name: v })} placeholder="Your name" singleLine />
      <Editable as="p" className="rbv2-tagline" value={content.header?.headline || ''} onChange={(v) => updateHeader({ headline: v })} placeholder="Headline / role" singleLine />
      <Editable as="p" className="rbv2-contact" value={content.header?.contact || ''} onChange={(v) => updateHeader({ contact: v })} placeholder="Phone • email • links • location" singleLine />
    </header>
  )

  // ---------- Pagination state ----------
  const measureRef = useRef(null)
  const wrapRef = useRef(null)

  const sectionCountKey = `${isTwo}:${content.sections?.length || 0}:${content.main?.length || 0}:${content.sidebar?.length || 0}`

  const defaultPages = useMemo(
    () => buildDefaultPages(content, isTwo),
    [sectionCountKey, content, isTwo],
  )

  const [pages, setPages] = useState(defaultPages)
  const [measureTick, setMeasureTick] = useState(0)
  const contentRef = useRef(content)
  contentRef.current = content
  const prevSectionCountKey = useRef(sectionCountKey)

  // Reset pagination only when sections are added/removed — not on every keystroke.
  useEffect(() => {
    if (prevSectionCountKey.current === sectionCountKey) return
    prevSectionCountKey.current = sectionCountKey
    setPages(buildDefaultPages(content, isTwo))
  }, [sectionCountKey, content, isTwo])

  // Re-paginate after typing pauses (onInput updates content frequently).
  useEffect(() => {
    const t = setTimeout(() => setMeasureTick((n) => n + 1), 450)
    return () => clearTimeout(t)
  }, [content])

  useLayoutEffect(() => {
    let cancelled = false

    const runMeasure = () => {
      if (cancelled || !measureRef.current) return
      const root = measureRef.current
      const content = contentRef.current
      const headerEl = root.querySelector('[data-measure-header]')
      const headerH = headerEl ? headerEl.offsetHeight : 0

      const colList = isTwo ? (content.main || []) : (content.sections || [])
      const sideList = isTwo ? (content.sidebar || []) : []

      const mains = measureColumnBlocks(root, 'main', colList)
      const sides = isTwo ? measureColumnBlocks(root, 'sidebar', sideList) : []

      const colVPad = (isTwo ? 56 : 56) * mar
      const pageNumReserve = 28
      const safety = 16
      const firstBodyBudget = Math.max(120, PAGE.h - headerH - colVPad - pageNumReserve - safety)
      const regularBodyBudget = Math.max(120, PAGE.h - colVPad - pageNumReserve - safety)

      let next
      if (!isTwo) {
        const mainPages = distributeBlocks(mains, firstBodyBudget, regularBodyBudget)
        next = mainPages.map((blocks, i) => ({
          showHeader: i === 0,
          main: blocks,
          sidebar: [],
        }))
      } else {
        const mainPages = distributeBlocks(mains, firstBodyBudget, regularBodyBudget)
        const sidePages = distributeBlocks(sides, firstBodyBudget, regularBodyBudget)
        const total = Math.max(mainPages.length, sidePages.length, 1)
        next = []
        for (let i = 0; i < total; i++) {
          next.push({
            showHeader: i === 0,
            main: mainPages[i] || [],
            sidebar: sidePages[i] || [],
          })
        }
      }

      const clamped = clampPages(next, content, isTwo)
      setPages((prev) => (samePages(clamped, prev) ? prev : clamped))
    }

    const runLater = () => requestAnimationFrame(() => requestAnimationFrame(runMeasure))
    runLater()
    const retry = window.setTimeout(runLater, 120)
    return () => {
      cancelled = true
      window.clearTimeout(retry)
    }
  }, [
    isTwo,
    content.sections?.length,
    content.main?.length,
    content.sidebar?.length,
    design.docSize,
    design.margins,
    design.spacing,
    design.fontFamily,
    design.fontSize,
    design.lineHeight,
    usableBodyH,
    measureTick,
    repaginateKey,
    mar,
    PAGE.h,
  ])

  const safePages = useMemo(() => clampPages(pages, content, isTwo), [pages, content, isTwo])

  // ---------- Auto-fit pages stack when canvas is narrower than the sheet ----------
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const parent = wrap.parentElement
    if (!parent) return

    const apply = () => {
      const avail = parent.clientWidth - 24 // small breathing room
      const scale = avail >= PAGE.w ? 1 : Math.max(0.4, avail / PAGE.w)
      wrap.style.setProperty('--rbv2-pages-scale', String(scale))
      // When scaled, compensate height so the stacking doesn't leave a void.
      wrap.style.marginBottom = scale < 1 ? `${(scale - 1) * wrap.offsetHeight}px` : '0px'
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [PAGE.w, pages.length])

  const pageClasses = [
    'rbv2-page',
    `is-${design.docSize}`,
    `bg-${design.background}`,
    `tpl-${design.template}`,
    isTwo ? `is-two-col side-${sideSide}` : 'is-single',
    previewMode ? 'is-preview' : '',
    exporting ? 'is-exporting' : '',
  ].filter(Boolean).join(' ')

  const pageStyle = { ...styleVars, width: `${PAGE.w}px`, height: `${PAGE.h}px` }

  const measurePreview = previewMode

  const applyBlockUpdate = (srcKey, section, block, next) => {
    if (block.itemStart != null && Array.isArray(section.items)) {
      const items = [...section.items]
      if (block.bulletStart != null) {
        const jobIdx = block.itemStart
        const merged = next.items?.[0]
        if (merged) items[jobIdx] = { ...items[jobIdx], ...merged }
      } else {
        items.splice(block.itemStart, block.itemEnd - block.itemStart, ...(next.items || []))
      }
      updateInList(srcKey)(block.idx, { ...section, ...next, items })
      return
    }
    updateInList(srcKey)(block.idx, next)
  }

  const renderSections = (blocks, srcKey, allowEdit = true) =>
    blocks.map((block) => {
      const list = content[srcKey] || []
      const s = list[block.idx]
      if (!s) return null
      const sliced = sliceSectionForBlock(s, block)
      const showTitle = shouldShowSectionTitle(block)
      const isContinued = !showTitle
      const key = blockKey(block, s.id || srcKey)
      return (
        <SectionBlock
          key={key}
          section={sliced}
          showTitle={showTitle}
          isContinued={isContinued}
          previewMode={previewMode || !allowEdit}
          onUpdate={allowEdit ? (next) => applyBlockUpdate(srcKey, s, block, next) : () => {}}
        />
      )
    })

  return (
    <div className="rbv2-pages" ref={(el) => { wrapRef.current = el; if (pageRef) pageRef.current = el }}>
      {/* ------- Hidden measurement layer ------- */}
      <article
        ref={measureRef}
        className={`${pageClasses} rbv2-measure-layer`}
        style={{ ...styleVars, width: `${PAGE.w}px` }}
        aria-hidden="true"
      >
        <div className="rbv2-page-head" data-measure-header>{renderHeader()}</div>
        {!isTwo ? (
          <div className="rbv2-page-body">
            {(content.sections || []).map((s, i) => (
              <div key={s.id || i} data-col="main" data-section-idx={i}>
                <SectionBlock section={s} previewMode={measurePreview} onUpdate={() => {}} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rbv2-page-grid">
            <div className="rbv2-page-main">
              {(content.main || []).map((s, i) => (
                <div key={s.id || i} data-col="main" data-section-idx={i}>
                  <SectionBlock section={s} previewMode={measurePreview} onUpdate={() => {}} />
                </div>
              ))}
            </div>
            <aside className="rbv2-page-sidebar">
              {(content.sidebar || []).map((s, i) => (
                <div key={s.id || i} data-col="sidebar" data-section-idx={i}>
                  <SectionBlock section={s} previewMode={measurePreview} onUpdate={() => {}} />
                </div>
              ))}
            </aside>
          </div>
        )}
      </article>

      {/* ------- Visible paginated sheets ------- */}
      {safePages.map((p, pi) => (
        <article
          key={pi}
          className={pageClasses}
          style={pageStyle}
          data-page-index={pi}
        >
          <div className={`rbv2-page-head${p.showHeader ? '' : ' is-empty'}`}>
            {p.showHeader ? renderHeader() : null}
          </div>
          {!isTwo ? (
            <div className="rbv2-page-body">{renderSections(p.main, 'sections')}</div>
          ) : (
            <div className="rbv2-page-grid">
              <div className="rbv2-page-main">{renderSections(p.main, 'main')}</div>
              <aside className="rbv2-page-sidebar">{renderSections(p.sidebar, 'sidebar')}</aside>
            </div>
          )}
          {safePages.length > 1 && (
            <div className="rbv2-page-num">{pi + 1} / {safePages.length}</div>
          )}
        </article>
      ))}
    </div>
  )
}

function blockKey(b, prefix = '') {
  if (!b) return ''
  return `${prefix}:${b.idx}:${b.itemStart ?? ''}:${b.itemEnd ?? ''}:${b.bulletStart ?? ''}:${b.bulletEnd ?? ''}`
}

function shouldShowSectionTitle(block) {
  if (block.itemStart == null) return true
  if (block.itemStart !== 0) return false
  return block.bulletStart == null || block.bulletStart === 0
}

function sliceSectionForBlock(section, block) {
  if (block.itemStart == null) return section
  const items = (section.items || []).slice(block.itemStart, block.itemEnd)
  if (block.bulletStart != null && items.length) {
    const job = items[0]
    items[0] = {
      ...job,
      bullets: (job.bullets || []).slice(block.bulletStart, block.bulletEnd),
    }
  }
  return { ...section, items }
}

function sectionLeadHeight(el) {
  const sectionEl = el.querySelector('.rbv2-section') || el
  const titleEl = sectionEl.querySelector('h3')
  const titleH = titleEl ? measureElementHeight(titleEl) : 0
  const gap = parseFloat(window.getComputedStyle(sectionEl).marginTop) || 0
  return titleH + gap
}

function samePages(a, b) {
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].showHeader !== b[i].showHeader) return false
    if (a[i].main.length !== b[i].main.length) return false
    if (a[i].sidebar.length !== b[i].sidebar.length) return false
    for (let j = 0; j < a[i].main.length; j++) if (blockKey(a[i].main[j]) !== blockKey(b[i].main[j])) return false
    for (let j = 0; j < a[i].sidebar.length; j++) if (blockKey(a[i].sidebar[j]) !== blockKey(b[i].sidebar[j])) return false
  }
  return true
}

function sectionCounts(content, isTwo) {
  return {
    main: isTwo ? (content.main?.length || 0) : (content.sections?.length || 0),
    sidebar: isTwo ? (content.sidebar?.length || 0) : 0,
  }
}

function buildDefaultPages(content, isTwo) {
  const { main, sidebar } = sectionCounts(content, isTwo)
  return [{
    showHeader: true,
    main: Array.from({ length: main }, (_, i) => ({ idx: i })),
    sidebar: Array.from({ length: sidebar }, (_, i) => ({ idx: i })),
  }]
}

function clampPages(pages, content, isTwo) {
  const { main: mainCount, sidebar: sideCount } = sectionCounts(content, isTwo)
  const clamped = (pages || [])
    .map((p) => ({
      ...p,
      main: (p.main || []).filter((b) => b.idx >= 0 && b.idx < mainCount),
      sidebar: (p.sidebar || []).filter((b) => b.idx >= 0 && b.idx < sideCount),
    }))
    .filter((p) => (p.main || []).length > 0 || (p.sidebar || []).length > 0)
  return clamped.length > 0 ? clamped : buildDefaultPages(content, isTwo)
}

function measureElementHeight(el) {
  if (!el) return 80
  const style = window.getComputedStyle(el)
  const margin = parseFloat(style.marginTop) + parseFloat(style.marginBottom)
  return Math.max(el.scrollHeight, el.offsetHeight, 1) + margin
}

function measureColumnBlocks(root, col, sections) {
  const blocks = []
  sections.forEach((section, idx) => {
    const el = root.querySelector(`[data-col="${col}"][data-section-idx="${idx}"]`)
    if (!el) {
      blocks.push({ idx, h: 80 })
      return
    }

    const leadH = sectionLeadHeight(el)

    if (section.type === SECTION_TYPES.EXPERIENCE) {
      const jobs = el.querySelectorAll('.rbv2-job')
      if (jobs.length) {
        jobs.forEach((jobEl, jobIdx) => {
          const bullets = jobEl.querySelectorAll('.rbv2-bullets li')
          const headNodes = [jobEl.querySelector('.rbv2-job-head'), jobEl.querySelector('.rbv2-job-meta')].filter(Boolean)
          const headH = headNodes.reduce((sum, node) => sum + measureElementHeight(node), 0)

          if (bullets.length) {
            bullets.forEach((bulletEl, bIdx) => {
              let h = measureElementHeight(bulletEl)
              if (bIdx === 0) h += headH
              if (jobIdx === 0 && bIdx === 0) h += leadH
              blocks.push({
                idx,
                itemStart: jobIdx,
                itemEnd: jobIdx + 1,
                bulletStart: bIdx,
                bulletEnd: bIdx + 1,
                h,
              })
            })
          } else {
            let h = measureElementHeight(jobEl)
            if (jobIdx === 0) h += leadH
            blocks.push({ idx, itemStart: jobIdx, itemEnd: jobIdx + 1, h })
          }
        })
        return
      }
    }

    if (section.type === SECTION_TYPES.EDUCATION) {
      const items = el.querySelectorAll('.rbv2-edu')
      if (items.length) {
        items.forEach((itemEl, i) => {
          let h = measureElementHeight(itemEl)
          if (i === 0) h += leadH
          blocks.push({ idx, itemStart: i, itemEnd: i + 1, h })
        })
        return
      }
    }

    if (section.type === SECTION_TYPES.LIST) {
      const items = el.querySelectorAll('.rbv2-list li')
      if (items.length) {
        items.forEach((itemEl, i) => {
          let h = measureElementHeight(itemEl)
          if (i === 0) h += leadH
          blocks.push({ idx, itemStart: i, itemEnd: i + 1, h })
        })
        return
      }
    }

    if (section.type === SECTION_TYPES.ACHIEVEMENTS) {
      const items = el.querySelectorAll('.rbv2-ach')
      if (items.length) {
        items.forEach((itemEl, i) => {
          let h = measureElementHeight(itemEl)
          if (i === 0) h += leadH
          blocks.push({ idx, itemStart: i, itemEnd: i + 1, h })
        })
        return
      }
    }

    blocks.push({ idx, h: measureElementHeight(el) })
  })
  return blocks
}

function distributeBlocks(blocks, firstBudget, regularBudget) {
  if (!blocks.length) return [[]]
  const out = [[]]
  let used = 0
  let budget = Math.max(80, firstBudget)
  const regular = Math.max(80, regularBudget)

  for (const block of blocks) {
    const blockH = Math.max(block.h, 1)
    const page = out[out.length - 1]

    if (blockH > budget && page.length > 0) {
      out.push([])
      used = 0
      budget = regular
    }

    if (used + blockH > budget && out[out.length - 1].length > 0) {
      out.push([])
      used = 0
      budget = regular
    }

    const { h, ...rest } = block
    out[out.length - 1].push(rest)
    used += blockH
  }

  while (out.length > 1 && out[out.length - 1].length === 0) out.pop()
  return out
}

/* =========================================================
   Main section
========================================================= */

export default function ResumeSection() {
  const { user, addToast } = useAppStore()
  const pageRef = useRef(null)
  const [repaginateKey, setRepaginateKey] = useState(0)

  const [content, setContent] = useState(cloneTemplate(EMPTY_CONTENT))
  const [design, setDesign] = useState({ ...DEFAULT_DESIGN })
  const [layout, setLayout] = useState(LAYOUTS.SINGLE)
  const [sidebarSide, setSidebarSide] = useState('right')
  const [resumeName, setResumeName] = useState('My Resume')
  const [loaded, setLoaded] = useState(false)
  const [profileSynced, setProfileSynced] = useState(false)
  const [panel, setPanel] = useState('design')
  const [previewMode, setPreviewMode] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)

  const improveTarget = useImproveTarget()
  const [improveOpen, setImproveOpen] = useState(false)
  const [improveOriginal, setImproveOriginal] = useState('')

  const dirtyRef = useRef(false)
  const skipNextSaveRef = useRef(true)

  const applyTemplateState = useCallback((templateId) => {
    const tpl = getTemplateById(templateId)
    if (!tpl?.content) return false
    const next = applyTemplateContent(cloneTemplate(tpl))
    skipNextSaveRef.current = true
    setContent(next.content)
    setDesign(next.design)
    setLayout(next.layout)
    setSidebarSide(next.sidebarSide)
    setRepaginateKey((k) => k + 1)
    return true
  }, [])

  const seedFromTemplate = useCallback((templateId = 'ivy') => {
    if (!applyTemplateState(templateId)) return
    setResumeName('My Resume')
    setProfileSynced(false)
  }, [applyTemplateState])

  /* ---------- Initial load: single resume at users/{uid}/resumes/primary ---------- */
  useEffect(() => {
    if (!auth.currentUser) return
    let cancelled = false
    ;(async () => {
      try {
        await useProfileStore.getState().load({ force: false })
        const uid = auth.currentUser.uid
        let resumePayload = null
        const primarySnap = await getDoc(doc(db, 'users', uid, 'resumes', PRIMARY_RESUME_ID))
        if (primarySnap.exists()) {
          resumePayload = { id: PRIMARY_RESUME_ID, ...primarySnap.data() }
        } else {
          const legacy = await getDocs(collection(db, 'users', uid, 'resumes'))
          if (legacy.docs.length > 0) {
            const best = [...legacy.docs].sort(
              (a, b) => (b.data().updatedAt?.seconds || 0) - (a.data().updatedAt?.seconds || 0),
            )[0]
            resumePayload = { id: PRIMARY_RESUME_ID, ...best.data() }
          }
        }

        if (cancelled) return

        if (resumePayload?.syncedFromProfile && resumePayload.content) {
          openResume(resumePayload)
          setProfileSynced(true)
        } else {
          const tplId = resumePayload?.template || resumePayload?.design?.template || 'ivy'
          seedFromTemplate(tplId)
        }
        setLoaded(true)
      } catch (err) {
        console.error('Load resume:', err)
        if (!cancelled) {
          seedFromTemplate('ivy')
          setLoaded(true)
        }
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  /* ---------- Open / new / delete ---------- */
  const openResume = (r) => {
    const incomingLayout = r.layout || (r.content?.main?.length ? LAYOUTS.TWO_COLUMN : LAYOUTS.SINGLE)
    const next = normalizeContent(r.content || r.fields)
    skipNextSaveRef.current = true
    setContent(next)
    setLayout(incomingLayout)
    setSidebarSide(r.sidebarSide || 'right')
    setDesign({
      ...DEFAULT_DESIGN,
      ...(r.design || {}),
      template: r.template || r.design?.template || DEFAULT_DESIGN.template,
      accent: r.accent || r.design?.accent || DEFAULT_DESIGN.accent,
    })
    setResumeName(r.name || 'My Resume')
    setProfileSynced(!!r.syncedFromProfile)
    dirtyRef.current = false
    setRepaginateKey((k) => k + 1)
  }

  const applyTemplate = useCallback((templateId) => {
    const tpl = getTemplateById(templateId)
    if (!applyTemplateState(templateId)) {
      addToast('error', '⚠️ Template not found')
      return
    }
    setProfileSynced(false)
    addToast('info', `🎨 “${tpl.name}” sample loaded — click Sync profile to fill your details`)
  }, [applyTemplateState, addToast])

  const syncFromProfile = useCallback(async () => {
    try {
      await useProfileStore.getState().load({ force: true })
      const profile = useProfileStore.getState().profile
      const userDoc = useProfileStore.getState().user
      if (!profileHasResumeData(user, profile, userDoc)) {
        addToast('info', 'Add details in Profile first — then sync here')
        return
      }
      const tpl = getTemplateById(design.template)
      const synced = buildSyncedResumeContent(tpl, user, profile, userDoc)
      const hasBody = (synced.sections?.length || 0) + (synced.main?.length || 0) + (synced.sidebar?.length || 0) > 0
      if (!hasBody) {
        addToast('error', '⚠️ Profile has no resume sections to sync')
        return
      }
      skipNextSaveRef.current = true
      setLayout(tpl.layout || LAYOUTS.SINGLE)
      setSidebarSide(tpl.sidebarSide || 'right')
      setContent(normalizeContent(synced))
      setProfileSynced(true)
      setRepaginateKey((k) => k + 1)
      addToast('success', '✅ Resume filled from your profile')
    } catch (err) {
      console.error('Sync profile:', err)
      addToast('error', '⚠️ Failed to sync profile')
    }
  }, [user, design.template, addToast])

  /* ---------- Persistence (debounced auto-save) ---------- */
  const persist = useCallback(async () => {
    if (!auth.currentUser) return
    setSaving(true)
    try {
      const profile = useProfileStore.getState().profile
      const payload = createResumeFirestorePayload({
        user,
        profile,
        userDoc: useProfileStore.getState().user,
        content,
        design,
        layout,
        sidebarSide,
        name: resumeName,
        templateId: design.template,
      })
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'resumes', PRIMARY_RESUME_ID), {
        ...payload,
        syncedFromProfile: profileSynced,
        updatedAt: serverTimestamp(),
      })
      dirtyRef.current = false
      import('@/store/gamificationStore').then((m) => {
        m.default.getState().syncEligibleBadges({ resumeCount: 1 }).catch(() => {})
      }).catch(() => {})
    } catch (err) {
      console.error('Save resume:', err)
      addToast('error', '⚠️ Failed to save resume')
    }
    setSaving(false)
  }, [user, resumeName, layout, sidebarSide, content, design, profileSynced, addToast])

  useEffect(() => {
    if (!loaded) return undefined
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return undefined
    }
    dirtyRef.current = true
    const t = setTimeout(() => {
      if (dirtyRef.current && auth.currentUser) persist()
    }, 1200)
    return () => clearTimeout(t)
  }, [content, design, resumeName, layout, sidebarSide, persist, loaded])

  /* ---------- PDF export ---------- */
  const downloadPDF = useCallback(async () => {
    if (!pageRef.current) return
    setExporting(true)
    addToast('info', '📥 Generating PDF…')

    // Snapshot the current scale so the offscreen rasterization captures the
    // sheet at native resolution, regardless of any "fit-to-screen" zoom that
    // might be applied to the on-screen pages stack on small viewports.
    const stack = pageRef.current
    const prevScale = stack.style.getPropertyValue('--rbv2-pages-scale')
    stack.style.setProperty('--rbv2-pages-scale', '1')

    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')

      const pageEls = Array.from(
        stack.querySelectorAll('article.rbv2-page:not(.rbv2-measure-layer)')
      )
      if (!pageEls.length) {
        addToast('error', '⚠️ Nothing to export')
        return
      }

      const pdf = new jsPDF('p', 'mm', design.docSize === 'Letter' ? 'letter' : 'a4')
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: design.pageBackground || '#ffffff',
          windowWidth: pageEls[i].offsetWidth,
          windowHeight: pageEls[i].offsetHeight,
        })
        const imgData = canvas.toDataURL('image/png')
        if (i > 0) pdf.addPage()
        // Fill the PDF page edge-to-edge — sheet dimensions already match.
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH)
      }

      pdf.save(`${(content.header?.name || resumeName || 'Resume').trim()}.pdf`)
      trackToolUsage('resume.export')
      addToast('success', `✅ PDF downloaded (${pageEls.length} page${pageEls.length > 1 ? 's' : ''})`)
    } catch (err) {
      console.error('PDF export:', err)
      addToast('error', '⚠️ PDF export failed')
    } finally {
      // Restore the user's scale (or remove the inline override).
      if (prevScale) stack.style.setProperty('--rbv2-pages-scale', prevScale)
      else stack.style.removeProperty('--rbv2-pages-scale')
      setExporting(false)
    }
  }, [content.header?.name, resumeName, design.docSize, design.pageBackground, addToast])

  /* ---------- Share (copy text fallback) ---------- */
  const shareResume = async () => {
    try {
      const sectionsList =
        layout === LAYOUTS.SINGLE
          ? content.sections || []
          : [...(content.main || []), ...(content.sidebar || [])]

      const lines = [
        content.header?.name,
        content.header?.headline,
        content.header?.contact,
        '',
        ...sectionsList.flatMap((s) => {
          if (s.type === SECTION_TYPES.PARAGRAPH || s.type === SECTION_TYPES.INLINE)
            return [s.title?.toUpperCase(), s.body, '']
          if (s.type === SECTION_TYPES.LIST)
            return [s.title?.toUpperCase(), ...(s.items || []).map((i) => `• ${i}`), '']
          if (s.type === SECTION_TYPES.EDUCATION)
            return [
              s.title?.toUpperCase(),
              ...(s.items || []).flatMap((i) => [`${i.degree} — ${i.school} (${i.dates})`]),
              '',
            ]
          if (s.type === SECTION_TYPES.ACHIEVEMENTS)
            return [
              s.title?.toUpperCase(),
              ...(s.items || []).flatMap((i) => [`• ${i.title}: ${i.description}`]),
              '',
            ]
          if (s.type === SECTION_TYPES.EXPERIENCE)
            return [
              s.title?.toUpperCase(),
              ...(s.items || []).flatMap((it) => [
                `${it.company} — ${it.role} (${it.dates}) — ${it.location}`,
                ...(it.bullets || []).map((b) => `• ${b}`),
                '',
              ]),
            ]
          return []
        }),
      ]
      await navigator.clipboard.writeText(lines.filter(Boolean).join('\n'))
      addToast('success', '🔗 Resume copied to clipboard')
    } catch {
      addToast('error', '⚠️ Could not copy resume')
    }
  }

  /* ---------- UI helpers ---------- */
  const togglePanel = (next) => setPanel((cur) => (cur === next ? 'closed' : next))

  const onImproveClick = () => {
    if (!improveTarget.hasTarget()) {
      addToast('info', 'Click into a field (or select some text) first, then try Improve text.')
      return
    }
    const text = (improveTarget.getText() || '').trim()
    if (text.length < 3) {
      addToast('info', 'Add a few more words to the field before improving.')
      return
    }
    setImproveOriginal(text)
    setImproveOpen(true)
  }

  const onImproveAccept = (variant) => {
    const ok = improveTarget.replace(variant)
    setImproveOpen(false)
    if (ok) addToast('success', '✨ Text updated')
    else addToast('error', '⚠️ Could not apply rewrite')
  }

  if (!loaded) {
    return (
      <div className="rbv2 rbv2--loading">
        <Loader variant="section" label="Loading your resume…" />
      </div>
    )
  }

  return (
    <div className="rbv2">
      <header className="rbv2-topbar">
        <div className="rbv2-tb-left">
          <input
            className="rbv2-tb-name"
            value={resumeName}
            onChange={(e) => setResumeName(e.target.value)}
            placeholder="Resume name"
            aria-label="Resume name"
          />
          <button
            type="button"
            className={`rbv2-sync-btn${profileSynced ? ' is-synced' : ''}`}
            onClick={syncFromProfile}
            title={profileSynced ? 'Update resume with latest profile data' : 'Fill this resume from your profile'}
          >
            <span className="rbv2-sync-btn__icon" aria-hidden>{profileSynced ? '✓' : '↻'}</span>
            <span className="rbv2-sync-btn__label">{profileSynced ? 'Re-sync' : 'Sync profile'}</span>
          </button>
        </div>

        <div className="rbv2-tb-center">
          <button
            type="button"
            className="rbv2-tb-btn"
            onClick={onImproveClick}
            title="Improve the selected text (or the focused field) with AI"
          >
            <span className="ico">✦</span> <span className="label">Improve text</span>
          </button>
          <button className="rbv2-tb-btn" onClick={() => addToast('info', '🔍 Spell check coming soon')} title="Spell check">
            <span className="ico">🔤</span> <span className="label">Check</span>
          </button>
          <button
            className={`rbv2-tb-btn${panel === 'templates' ? ' is-active' : ''}`}
            onClick={() => togglePanel('templates')}
            title="Templates"
            aria-pressed={panel === 'templates'}
          >
            <span className="ico">▦</span> <span className="label">Templates</span>
          </button>
          <button
            className={`rbv2-tb-btn${panel === 'design' ? ' is-active' : ''}`}
            onClick={() => togglePanel('design')}
            title="Design & Font"
            aria-pressed={panel === 'design'}
          >
            <span className="ico">🎨</span> <span className="label">Design &amp; Font</span>
          </button>
        </div>

        <div className="rbv2-tb-right">
          {saving && <span className="rbv2-tb-saving">Saving…</span>}
          {!profileSynced && !saving && (
            <span className="rbv2-tb-pill">Sample preview</span>
          )}
        </div>
      </header>

      {/* ---------- 3-column shell ---------- */}
      <div className={`rbv2-shell${panel === 'closed' ? ' is-side-closed' : ''}`}>
        <aside className="rbv2-side" aria-hidden={panel === 'closed'}>
          {panel === 'design' && (
            <DesignPanel
              key="design"
              design={design}
              setDesign={setDesign}
              onClose={() => setPanel('closed')}
            />
          )}
          {panel === 'templates' && (
            <TemplatesPanel
              key="templates"
              design={design}
              applyTemplate={applyTemplate}
              setDocSize={(d) => setDesign((dz) => ({ ...dz, docSize: d }))}
              onContinue={() => setPanel('design')}
              onClose={() => setPanel('closed')}
            />
          )}
        </aside>

        {/* Mobile drawer scrim — only interactive at narrow widths via CSS */}
        <button
          type="button"
          className={`rbv2-scrim${panel !== 'closed' ? ' is-on' : ''}`}
          aria-label="Close panel"
          tabIndex={-1}
          onClick={() => setPanel('closed')}
        />

        <main className="rbv2-canvas">
          <ResumeCanvas
            content={content}
            layout={layout}
            sidebarSide={sidebarSide}
            setContent={setContent}
            design={design}
            previewMode={previewMode}
            exporting={exporting}
            pageRef={pageRef}
            repaginateKey={repaginateKey}
          />
        </main>

        <aside className="rbv2-rail">
          <button type="button" className={`rbv2-rail-btn${previewMode ? ' is-active' : ''}`} title={previewMode ? 'Exit preview' : 'Preview mode'} onClick={() => setPreviewMode((v) => !v)}>👁</button>
          <button type="button" className="rbv2-rail-btn" title="Download PDF" onClick={downloadPDF} disabled={exporting}>{exporting ? '⏳' : '⤓'}</button>
          <button type="button" className="rbv2-rail-btn" title="Copy resume text" onClick={shareResume}>🔗</button>
          <button type="button" className="rbv2-rail-btn is-active" title="AI suggestions (coming soon)" onClick={() => addToast('info', '✨ AI suggestions coming soon')}>★</button>
        </aside>
      </div>

      <ImproveTextModal
        open={improveOpen}
        originalText={improveOriginal}
        onAccept={onImproveAccept}
        onClose={() => setImproveOpen(false)}
      />
    </div>
  )
}
