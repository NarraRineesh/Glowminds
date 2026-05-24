import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  EDUCATION_LEVELS,
  coursesForLevel,
  specializationsForCourse,
} from '@/constants/educationCatalog'
import { INDIAN_COLLEGES } from '@/constants/indianColleges'
import {
  createEmptyEducationEntry,
  finalizeEducationEntry,
  isSchoolLevel,
} from '@/utils/educationEntries'

const STREAM_12_OPTIONS = ['Science', 'Commerce', 'Arts', 'Vocational', 'Other']

const GRADING_SYSTEM_OPTIONS = [
  ['', 'Select…'],
  ['% Marks of 100 Maximum', '% Marks of 100 Maximum'],
  ['CGPA on scale of 10', 'CGPA on scale of 10'],
  ['CGPA on scale of 4', 'CGPA on scale of 4'],
  ['Grade (O-A-F)', 'Grade (O-A-F)'],
  ['Other', 'Other'],
]

const COURSE_TYPE_OPTIONS = [
  ['', 'Select…'],
  ['Full time', 'Full time'],
  ['Part time', 'Part time'],
  ['Correspondence / Distance', 'Correspondence / Distance learning'],
]

export default function EducationModal({
  open,
  entry,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(createEmptyEducationEntry())

  useEffect(() => {
    if (!open) return
    setForm(entry ? { ...createEmptyEducationEntry(), ...entry } : createEmptyEducationEntry())
  }, [open, entry])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const isEdit = !!(entry?.educationLevel)
  const school = isSchoolLevel(form.educationLevel)
  const is12 = form.educationLevel === 'class12'

  const handleLevelChange = (educationLevel) => {
    const autoCourse = educationLevel === 'class12'
      ? 'Higher Secondary (12th)'
      : educationLevel === 'class10'
        ? 'Secondary (10th)'
        : ''
    setForm({
      ...createEmptyEducationEntry(),
      id: form.id,
      educationLevel,
      course: autoCourse,
      primaryGraduation: false,
    })
  }

  const validate = () => {
    if (!form.educationLevel) return 'Please select education level'
    if (school) {
      if (!form.college?.trim()) return 'Please enter school name'
      return null
    }
    if (!form.course?.trim()) return 'Please select course'
    if (!form.college?.trim()) return 'Please enter college / university'
    if (!form.specialization?.trim() && form.course !== 'Other') return 'Please select specialization'
    return null
  }

  const handleSave = () => {
    const err = validate()
    if (err) {
      window.alert(err)
      return
    }
    onSave?.(finalizeEducationEntry(form))
  }

  return createPortal(
    <div className="mb on" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="mo mo-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <h2>📚 {isEdit ? 'Edit Education' : 'Add Education'}</h2>
          <div className="mx" onClick={() => onClose?.()} role="button" tabIndex={0}>✕</div>
        </div>

        <div className="mb2 flex flex-col gap-3" style={{ maxHeight: 'min(70vh, 560px)', overflow: 'auto' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Qualification
          </div>

          <div className="fg">
            <label className="fl">Education *</label>
            <select
              className="fsl"
              value={form.educationLevel || ''}
              onChange={(e) => handleLevelChange(e.target.value)}
            >
              <option value="">Select education…</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>

          {form.educationLevel && !school && (
            <>
              <div className="fg">
                <label className="fl">Course *</label>
                <select
                  className="fsl"
                  value={form.course || ''}
                  onChange={(e) => setForm({
                    ...form,
                    course: e.target.value,
                    specialization: '',
                    specializationOther: '',
                  })}
                >
                  <option value="">Select course…</option>
                  {coursesForLevel(form.educationLevel).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {form.course === 'Other' && (
                <div className="fg">
                  <label className="fl">Course name</label>
                  <input
                    className="fi"
                    placeholder="Specify course"
                    value={form.courseOther || ''}
                    onChange={(e) => setForm({ ...form, courseOther: e.target.value })}
                  />
                </div>
              )}
              <div className="fg">
                <label className="fl">College / University *</label>
                <input
                  className="fi"
                  list="education-modal-colleges"
                  placeholder="Search or type institution name"
                  value={form.college || ''}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                />
                <datalist id="education-modal-colleges">
                  {INDIAN_COLLEGES.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="fg">
                <label className="fl">Specialization *</label>
                <select
                  className="fsl"
                  value={form.specialization || ''}
                  disabled={!form.course}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value, specializationOther: '' })}
                >
                  <option value="">{form.course ? 'Select specialization…' : 'Select course first'}</option>
                  {specializationsForCourse(
                    form.course === 'Other' ? (form.courseOther || '').trim() : form.course,
                  ).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {form.specialization === 'Other' && (
                <div className="fg">
                  <label className="fl">Specialization name</label>
                  <input
                    className="fi"
                    placeholder="Specify specialization"
                    value={form.specializationOther || ''}
                    onChange={(e) => setForm({ ...form, specializationOther: e.target.value })}
                  />
                </div>
              )}
              <div className="fg">
                <label className="fl">Course type</label>
                <select className="fsl" value={form.courseType || ''} onChange={(e) => setForm({ ...form, courseType: e.target.value })}>
                  {COURSE_TYPE_OPTIONS.map(([val, label]) => (
                    <option key={val || '_'} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {school && (
            <>
              <div className="fg">
                <label className="fl">School name *</label>
                <input
                  className="fi"
                  placeholder="School / junior college"
                  value={form.college || ''}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                />
              </div>
              <div className="fg2">
                <div className="fg">
                  <label className="fl">Board</label>
                  <input
                    className="fi"
                    placeholder="CBSE, ICSE, State Board…"
                    value={form.board || ''}
                    onChange={(e) => setForm({ ...form, board: e.target.value })}
                  />
                </div>
                {is12 && (
                  <div className="fg">
                    <label className="fl">Stream</label>
                    <select className="fsl" value={form.stream || ''} onChange={(e) => setForm({ ...form, stream: e.target.value })}>
                      <option value="">Select…</option>
                      {STREAM_12_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="fg2">
                <div className="fg">
                  <label className="fl">Course type</label>
                  <select className="fsl" value={form.courseType || ''} onChange={(e) => setForm({ ...form, courseType: e.target.value })}>
                    {COURSE_TYPE_OPTIONS.map(([val, label]) => (
                      <option key={`s-${val || '_'}`} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Grading system</label>
                  <select className="fsl" value={form.gradingSystem || ''} onChange={(e) => setForm({ ...form, gradingSystem: e.target.value })}>
                    {GRADING_SYSTEM_OPTIONS.map(([val, label]) => (
                      <option key={`sg-${val || '_'}`} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {form.educationLevel && (
            <>
              <div className="fg2">
                <div className="fg">
                  <label className="fl">Start date</label>
                  <input className="fi" type="date" value={form.educationStart || ''} onChange={(e) => setForm({ ...form, educationStart: e.target.value })} />
                </div>
                <div className="fg">
                  <label className="fl">End date</label>
                  <input className="fi" type="date" value={form.educationEnd || ''} onChange={(e) => setForm({ ...form, educationEnd: e.target.value })} />
                </div>
              </div>

              {!school && (
                <div className="fg">
                  <label className="fl flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.primaryGraduation}
                      onChange={(e) => setForm({ ...form, primaryGraduation: e.target.checked })}
                    />
                    <span>Make this my primary graduation / diploma</span>
                  </label>
                </div>
              )}

              <div className="fg2">
                {!school && (
                  <div className="fg">
                    <label className="fl">Grading system</label>
                    <select className="fsl" value={form.gradingSystem || ''} onChange={(e) => setForm({ ...form, gradingSystem: e.target.value })}>
                      {GRADING_SYSTEM_OPTIONS.map(([val, label]) => (
                        <option key={val || '_'} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="fg">
                  <label className="fl">Marks / CGPA</label>
                  <input className="fi" placeholder="8.5 or 85%" value={form.marks || ''} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mf">
          <button type="button" className="btn btn-gh" onClick={() => onClose?.()}>Cancel</button>
          <button type="button" className="btn btn-p" disabled={saving || !form.educationLevel} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
