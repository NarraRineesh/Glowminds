import { useEffect, useState } from 'react'
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
import {
  AppDialog,
  Button,
  FormField,
  FormRow,
  Input,
  Select,
  Label,
} from '@/components/ui'

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

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => !v && onClose?.()}
      title={`${isEdit ? 'Edit Education' : 'Add Education'}`}
      size="lg"
      contentClassName="max-h-[min(70vh,560px)] overflow-auto"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose?.()}>Cancel</Button>
          <Button disabled={saving || !form.educationLevel} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        Qualification
      </div>

      <FormField label="Education *">
        <Select
          value={form.educationLevel || ''}
          onChange={(e) => handleLevelChange(e.target.value)}
        >
          <option value="">Select education…</option>
          {EDUCATION_LEVELS.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </Select>
      </FormField>

      {form.educationLevel && !school && (
        <>
          <FormField label="Course *">
            <Select
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
            </Select>
          </FormField>
          {form.course === 'Other' && (
            <FormField label="Course name">
              <Input
                placeholder="Specify course"
                value={form.courseOther || ''}
                onChange={(e) => setForm({ ...form, courseOther: e.target.value })}
              />
            </FormField>
          )}
          <FormField label="College / University *">
            <Input
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
          </FormField>
          <FormField label="Specialization *">
            <Select
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
            </Select>
          </FormField>
          {form.specialization === 'Other' && (
            <FormField label="Specialization name">
              <Input
                placeholder="Specify specialization"
                value={form.specializationOther || ''}
                onChange={(e) => setForm({ ...form, specializationOther: e.target.value })}
              />
            </FormField>
          )}
          <FormField label="Course type">
            <Select value={form.courseType || ''} onChange={(e) => setForm({ ...form, courseType: e.target.value })}>
              {COURSE_TYPE_OPTIONS.map(([val, label]) => (
                <option key={val || '_'} value={val}>{label}</option>
              ))}
            </Select>
          </FormField>
        </>
      )}

      {school && (
        <>
          <FormField label="School name *">
            <Input
              placeholder="School / junior college"
              value={form.college || ''}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
            />
          </FormField>
          <FormRow>
            <FormField label="Board">
              <Input
                placeholder="CBSE, ICSE, State Board…"
                value={form.board || ''}
                onChange={(e) => setForm({ ...form, board: e.target.value })}
              />
            </FormField>
            {is12 && (
              <FormField label="Stream">
                <Select value={form.stream || ''} onChange={(e) => setForm({ ...form, stream: e.target.value })}>
                  <option value="">Select…</option>
                  {STREAM_12_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
            )}
          </FormRow>
          <FormRow>
            <FormField label="Course type">
              <Select value={form.courseType || ''} onChange={(e) => setForm({ ...form, courseType: e.target.value })}>
                {COURSE_TYPE_OPTIONS.map(([val, label]) => (
                  <option key={`s-${val || '_'}`} value={val}>{label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Grading system">
              <Select value={form.gradingSystem || ''} onChange={(e) => setForm({ ...form, gradingSystem: e.target.value })}>
                {GRADING_SYSTEM_OPTIONS.map(([val, label]) => (
                  <option key={`sg-${val || '_'}`} value={val}>{label}</option>
                ))}
              </Select>
            </FormField>
          </FormRow>
        </>
      )}

      {form.educationLevel && (
        <>
          <FormRow>
            <FormField label="Start date">
              <Input type="date" value={form.educationStart || ''} onChange={(e) => setForm({ ...form, educationStart: e.target.value })} />
            </FormField>
            <FormField label="End date">
              <Input type="date" value={form.educationEnd || ''} onChange={(e) => setForm({ ...form, educationEnd: e.target.value })} />
            </FormField>
          </FormRow>

          {!school && (
            <FormField>
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.primaryGraduation}
                  onChange={(e) => setForm({ ...form, primaryGraduation: e.target.checked })}
                />
                <span>Make this my primary graduation / diploma</span>
              </Label>
            </FormField>
          )}

          <FormRow>
            {!school && (
              <FormField label="Grading system">
                <Select value={form.gradingSystem || ''} onChange={(e) => setForm({ ...form, gradingSystem: e.target.value })}>
                  {GRADING_SYSTEM_OPTIONS.map(([val, label]) => (
                    <option key={val || '_'} value={val}>{label}</option>
                  ))}
                </Select>
              </FormField>
            )}
            <FormField label="Marks / CGPA">
              <Input placeholder="8.5 or 85%" value={form.marks || ''} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
            </FormField>
          </FormRow>
        </>
      )}
    </AppDialog>
  )
}
