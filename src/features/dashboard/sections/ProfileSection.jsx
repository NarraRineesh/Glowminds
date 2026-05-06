import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import useAppStore from '@/store/authStore'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '@/services/firebase'
import Loader from '@/components/Loader'
import '@/styles/dashboard.css'
import '@/styles/profile.css'
import '@/styles/cards.css'
import '@/styles/forms.css'
import '@/styles/modal.css'

const functions = getFunctions(app)
const profileReviewFn = httpsCallable(functions, 'profileReview')

const EMPTY_PROFILE = {
  personal: { phone: '', location: '', gender: '', dob: '', languages: '' },
  education: { degree: '', college: '', institute: '', board: '', year: '', cgpa: '', marks10: '', board10: '', marks12: '', board12: '' },
  skills: [],
  softSkills: [],
  isFresher: false,
  experience: [{ company: '', role: '', duration: '', bullets: '' }],
  internships: [{ company: '', role: '', duration: '', bullets: '' }],
  projects: [{ title: '', tech: '', desc: '', url: '' }],
  certifications: [{ name: '', issuer: '', year: '', url: '' }],
  preferences: { jobType: '', location: '', expectedCTC: '', noticePeriod: '', linkedIn: '', github: '' },
  summary: '',
}

export default function ProfileSection() {
  const { user, addToast, updatePhotoURL, updateDisplayName } = useAppStore()
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // 'education' | 'skills' | 'experience' | 'preferences' | 'summary'
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [softSkillInput, setSoftSkillInput] = useState('')
  const [aiReview, setAiReview] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameForm, setNameForm] = useState({ firstName: '', lastName: '' })
  const [lastUpdated, setLastUpdated] = useState(null)
  const photoRef = useRef(null)

  const name = user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (file.size > 5 * 1024 * 1024) { addToast('error', '⚠️ Image must be under 5MB'); return }
    setUploadingPhoto(true)
    try {
      await updatePhotoURL(file)
      addToast('success', '✅ Profile photo updated!')
    } catch (err) {
      console.error('Photo upload:', err)
      addToast('error', '⚠️ Failed to upload photo')
    }
    setUploadingPhoto(false)
  }

  const handleNameSave = async () => {
    if (!nameForm.firstName.trim()) { addToast('error', '⚠️ First name is required'); return }
    setSaving(true)
    try {
      await updateDisplayName(nameForm.firstName.trim(), nameForm.lastName.trim())
      setEditingName(false)
      addToast('success', '✅ Name updated!')
    } catch (err) {
      console.error('Name update:', err)
      addToast('error', '⚠️ Failed to update name')
    }
    setSaving(false)
  }

  const loadProfile = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) { setLoading(false); return }
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) {
        const d = snap.data()
        if (d.profile) setProfile({ ...EMPTY_PROFILE, ...d.profile })
        if (d.aiReview) setAiReview(d.aiReview)
        if (d.updatedAt?.toDate) setLastUpdated(d.updatedAt.toDate())
        else if (d.updatedAt) setLastUpdated(new Date(d.updatedAt))
      }
    } catch (e) { console.error('Load profile:', e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      loadProfile()
    })
    return () => cancelAnimationFrame(id)
  }, [loadProfile])

  const saveSection = async (section, data) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    setSaving(true)
    try {
      const updated = { ...profile, [section]: data }
      await setDoc(doc(db, 'users', uid), { profile: updated, updatedAt: serverTimestamp() }, { merge: true })
      setProfile(updated)
      setLastUpdated(new Date())
      setEditing(null)
      addToast('success', '✅ Profile updated!')
    } catch (e) {
      console.error('Save profile:', e)
      addToast('error', '⚠️ Failed to save')
    }
    setSaving(false)
  }

  const startEdit = (section) => {
    const map = {
      personal: profile.personal || EMPTY_PROFILE.personal,
      education: profile.education,
      preferences: profile.preferences,
      summary: { summary: profile.summary },
      experience: { isFresher: profile.isFresher || false, experience: Array.isArray(profile.experience) ? profile.experience : [] },
      internships: { internships: Array.isArray(profile.internships) ? profile.internships : [{ company: '', role: '', duration: '', bullets: '' }] },
      projects: { projects: Array.isArray(profile.projects) ? profile.projects : [{ title: '', tech: '', desc: '', url: '' }] },
      certifications: { certifications: Array.isArray(profile.certifications) ? profile.certifications : [{ name: '', issuer: '', year: '', url: '' }] },
    }
    setForm(JSON.parse(JSON.stringify(map[section] || {})))
    setEditing(section)
  }

  const { personal: pers, education: edu, skills, softSkills, experience: rawExps, internships: rawInterns, projects: rawProjects, certifications: rawCerts, preferences: prefs, summary, isFresher } = profile
  const personalInfo = pers || EMPTY_PROFILE.personal
  const exps = Array.isArray(rawExps) ? rawExps : []
  const interns = Array.isArray(rawInterns) ? rawInterns : []
  const projects = Array.isArray(rawProjects) ? rawProjects : []
  const certs = Array.isArray(rawCerts) ? rawCerts : []

  const checks = [
    !!name && name !== 'User',
    skills.length >= 3,
    !!edu.degree && !!edu.college,
    (exps?.some(e => e.company) || isFresher),
    !!prefs.expectedCTC,
    !!prefs.github || !!prefs.linkedIn,
    !!summary,
    !!user?.photoURL
  ]
  const profileScore = Math.round((checks.filter(Boolean).length / checks.length) * 100)
  const nextTip = !checks[0] ? 'Add your name' : !checks[1] ? 'Add at least 3 skills' : !checks[2] ? 'Add your education' : !checks[3] ? 'Add work experience' : !checks[4] ? 'Set salary expectations' : !checks[5] ? 'Add GitHub or LinkedIn URL' : !checks[6] ? 'Write a short summary' : 'Profile is complete!'

  const latestExp = exps.find(e => e.company) || null
  const currentRole = latestExp?.role || (isFresher ? 'Fresher' : '')
  const currentCompany = latestExp?.company || ''
  const currentDuration = latestExp?.duration || ''
  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  const quickLinks = [
    { id: 'profile-summary', label: 'Profile summary',  },
    { id: 'profile-skills', label: 'Key skills' },
    { id: 'profile-experience', label: 'Employment' },
    { id: 'profile-education', label: 'Education' },
    { id: 'profile-projects', label: 'Projects' },
    { id: 'profile-internships', label: 'Internships' },
    { id: 'profile-certifications', label: 'Certifications' },
    { id: 'profile-preferences', label: 'Career profile' },
    { id: 'profile-personal', label: 'Personal details' },
    { id: 'profile-ai-review', label: 'AI review' },
  ]

  if (loading) return <Loader variant="section" />

  return (
    <>
      {/* Naukri-style profile hero */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          {/* Avatar + completion ring + percent label below */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              className="relative cursor-pointer"
              style={{ width: 112, height: 112 }}
              onClick={() => photoRef.current?.click()}
              title="Change photo"
            >
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <svg width="112" height="112" viewBox="0 0 112 112" className="absolute inset-0">
                <circle cx="56" cy="56" r="50" fill="none" stroke="var(--color-bg3)" strokeWidth="5" />
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  fill="none"
                  stroke={profileScore >= 80 ? 'var(--color-grn)' : 'url(#pg1)'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="314.16"
                  strokeDashoffset={314.16 - (314.16 * profileScore) / 100}
                  transform="rotate(-90 56 56)"
                  style={{ transition: 'stroke-dashoffset .6s ease' }}
                />
                <defs>
                  <linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#388bfd" />
                    <stop offset="50%" stopColor="#3fb950" />
                    <stop offset="100%" stopColor="#bc8cff" />
                  </linearGradient>
                </defs>
              </svg>
              <div
                className="absolute flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--color-blu)] to-[var(--color-grn)] text-3xl font-black text-white"
                style={{ top: 10, left: 10, width: 92, height: 92 }}
              >
                {uploadingPhoto ? (
                  <span className="text-[.9rem]">⏳</span>
                ) : user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  name[0]?.toUpperCase()
                )}
              </div>
              <div
                className="absolute bottom-0 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--color-surf)] bg-[var(--color-blu)] text-xs"
                title="Upload photo"
              >
                📷
              </div>
            </div>
            <div
              className={`text-[0.78rem] font-extrabold tabular-nums ${
                profileScore >= 80 ? 'text-[var(--color-grn)]' : 'text-[var(--color-blu2)]'
              }`}
            >
              {profileScore}%
            </div>
          </div>

          {/* Name / role / company / last updated */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-[clamp(1.35rem,2.4vw,1.7rem)] font-black leading-tight tracking-[-0.01em] text-[var(--color-txt)]">
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setNameForm({
                        firstName: user?.firstName || name.split(' ')[0] || '',
                        lastName: user?.lastName || name.split(' ').slice(1).join(' ') || '',
                      })
                      setEditingName(true)
                    }}
                    className="rounded-md px-1.5 py-0.5 text-[0.78rem] text-[var(--color-blu2)] transition-colors hover:bg-[var(--color-blu3)]"
                    title="Edit name"
                    aria-label="Edit name"
                  >
                    ✏️
                  </button>
                </h1>
                {currentRole && (
                  <div className="mt-0.5 text-[0.92rem] font-semibold text-[var(--color-txt2)]">
                    {currentRole}
                  </div>
                )}
                {currentCompany && (
                  <div className="text-[0.82rem] text-[var(--color-muted)]">
                    at {currentCompany}
                  </div>
                )}
              </div>
              {lastUpdatedStr && (
                <div className="text-[0.74rem] text-[var(--color-muted)] sm:text-right">
                  Profile last updated · <span className="font-semibold text-[var(--color-txt2)]">{lastUpdatedStr}</span>
                </div>
              )}
            </div>

            {/* Two-column info grid (mirrors Naukri layout) */}
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-[var(--color-bdr)] pt-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt2)]">
                  <span aria-hidden>📍</span>
                  <span>{personalInfo.location || <span className="text-[var(--color-muted)]">Add location</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt2)]">
                  <span aria-hidden>💼</span>
                  <span>
                    {isFresher
                      ? 'Fresher'
                      : currentDuration || (exps.some(e => e.company)
                        ? `${exps.filter(e => e.company).length} role${exps.filter(e => e.company).length > 1 ? 's' : ''}`
                        : <span className="text-[var(--color-muted)]">Add experience</span>)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt2)]">
                  <span aria-hidden>💳</span>
                  <span className={prefs.expectedCTC ? 'font-semibold text-[var(--color-txt)]' : ''}>
                    {prefs.expectedCTC || <span className="text-[var(--color-muted)]">Add expected CTC</span>}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt2)]">
                  <span aria-hidden>📞</span>
                  <span>{personalInfo.phone || <span className="text-[var(--color-muted)]">Add phone</span>}</span>
                  {personalInfo.phone && <span className="text-[var(--color-grn)]" title="Verified" aria-label="Verified">✓</span>}
                </div>
                <div className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt2)]">
                  <span aria-hidden>✉️</span>
                  <span className="truncate">{user?.email || '—'}</span>
                  {user?.email && <span className="text-[var(--color-grn)]" title="Verified" aria-label="Verified">✓</span>}
                </div>
                <div className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt2)]">
                  <span aria-hidden>📅</span>
                  <span>{prefs.noticePeriod ? `${prefs.noticePeriod} notice period` : <span className="text-[var(--color-muted)]">Add notice period</span>}</span>
                </div>
              </div>
            </div>

            {profileScore < 100 && (
              <div className="mt-3 rounded-xl border border-dashed border-[var(--color-bdr)] bg-[var(--color-bg3)] px-3 py-2 text-[0.78rem] text-[var(--color-txt2)]">
                💡 Next: <span className="font-semibold text-[var(--color-txt)]">{nextTip}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two-column body — Quick links aside (desktop only) + section cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div
            className="sticky rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-4"
            style={{ top: 80 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-[var(--color-txt)]">
                Quick links
              </h3>
            </div>
            <ul className="flex flex-col gap-0.5">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[0.84rem] text-[var(--color-txt2)] transition-colors hover:bg-[var(--color-bg3)] hover:text-[var(--color-txt)]"
                  >
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex flex-col gap-4 min-w-0">

      {/* Personal Info Card */}
      <div id="profile-personal" className="card scroll-mt-20">
        <div className="ch"><h3>🪪 Personal Information</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('personal')}>Edit</button></div>
        <div className="cb">
          {!personalInfo.phone && !personalInfo.location && !personalInfo.gender && !personalInfo.languages ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📋</div>
              <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your personal details — phone, location, gender, languages</div>
              <button className="btn btn-p btn-xs" onClick={() => startEdit('personal')}>+ Add Details</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
              <div className="ir"><span className="ik">Phone</span><span className="iv">{personalInfo.phone || '—'}</span></div>
              <div className="ir"><span className="ik">Location</span><span className="iv">{personalInfo.location || '—'}</span></div>
              <div className="ir"><span className="ik">Gender</span><span className="iv">{personalInfo.gender || '—'}</span></div>
              <div className="ir"><span className="ik">Date of Birth</span><span className="iv">{personalInfo.dob || '—'}</span></div>
              <div className="ir" style={{ gridColumn: '1/-1' }}><span className="ik">Languages</span><span className="iv">{personalInfo.languages || '—'}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Education */}
        <div id="profile-education" className="card scroll-mt-20">
          <div className="ch"><h3>📚 Education</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('education')}>Edit</button></div>
          <div className="cb">
            {!edu.degree && !edu.college ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🎓</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your education details</div>
                <button className="btn btn-p btn-xs" onClick={() => startEdit('education')}>+ Add Education</button>
              </div>
            ) : (
              <>
                <div className="ir"><span className="ik">Degree</span><span className="iv">{edu.degree || '—'}</span></div>
                <div className="ir"><span className="ik">College / University</span><span className="iv">{edu.college || '—'}</span></div>
                {edu.institute && <div className="ir"><span className="ik">Institute Type</span><span className="iv">{edu.institute}</span></div>}
                {edu.board && <div className="ir"><span className="ik">Board / University</span><span className="iv">{edu.board}</span></div>}
                <div className="ir"><span className="ik">Year</span><span className="iv">{edu.year ? `Class of ${edu.year}` : '—'}</span></div>
                <div className="ir"><span className="ik">CGPA / %</span><span className="iv">{edu.cgpa || '—'}</span></div>
                {(edu.marks12 || edu.board12) && <div className="ir"><span className="ik">12th</span><span className="iv">{[edu.marks12, edu.board12].filter(Boolean).join(' · ')}</span></div>}
                {(edu.marks10 || edu.board10) && <div className="ir"><span className="ik">10th</span><span className="iv">{[edu.marks10, edu.board10].filter(Boolean).join(' · ')}</span></div>}
              </>
            )}
          </div>
        </div>

        {/* Skills */}
        <div id="profile-skills" className="card scroll-mt-20">
          <div className="ch"><h3>🛠️ Skills</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('skills')}>Edit</button></div>
          <div className="cb">
            {skills.length === 0 && softSkills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🎯</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your technical & soft skills</div>
                <button className="btn btn-p btn-xs" onClick={() => startEdit('skills')}>+ Add Skills</button>
              </div>
            ) : (
              <>
                {skills.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Technical</div>
                    <div className="flex flex-wrap gap-[6px]">{skills.map(s => <span key={s} className="tag tb">{s}</span>)}</div>
                  </div>
                )}
                {softSkills.length > 0 && (
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Soft Skills</div>
                    <div className="flex flex-wrap gap-[6px]">{softSkills.map(s => <span key={s} className="tag tg">{s}</span>)}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Experience */}
        <div id="profile-experience" className="card scroll-mt-20">
          <div className="ch"><h3>💼 Experience</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('experience')}>Edit</button></div>
          <div className="cb">
            {isFresher ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🌱</div>
                <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--color-grn)', marginBottom: 4 }}>Fresher</div>
                <div style={{ fontSize: '.76rem', color: 'var(--color-muted)' }}>No prior full-time experience</div>
              </div>
            ) : !exps.some(e => e.company) ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>💼</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add jobs or work experience</div>
                <button className="btn btn-p btn-xs" onClick={() => startEdit('experience')}>+ Add Experience</button>
              </div>
            ) : (
              exps.filter(e => e.company).map((e, i) => (
                <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < exps.filter(x => x.company).length - 1 ? '1px solid var(--color-bdr)' : 'none' }}>
                  <div style={{ fontSize: '.84rem', fontWeight: 800 }}>{e.company}</div>
                  <div style={{ fontSize: '.76rem', color: 'var(--color-blu2)' }}>{e.role}{e.duration ? ` · ${e.duration}` : ''}</div>
                  {e.bullets && <div style={{ fontSize: '.76rem', color: 'var(--color-txt2)', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginTop: 6 }}>{e.bullets}</div>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Job Preferences & Salary */}
        <div id="profile-preferences" className="card scroll-mt-20">
          <div className="ch"><h3>⚙️ Preferences & Salary</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('preferences')}>Edit</button></div>
          <div className="cb">
            {!prefs.jobType && !prefs.location && !prefs.expectedCTC ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>💰</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Set your job type, location & salary expectations</div>
                <button className="btn btn-p btn-xs" onClick={() => startEdit('preferences')}>+ Set Preferences</button>
              </div>
            ) : (
              <>
                <div className="ir"><span className="ik">Job Type</span><span className="iv">{prefs.jobType || '—'}</span></div>
                <div className="ir"><span className="ik">Location</span><span className="iv">{prefs.location || '—'}</span></div>
                <div className="ir"><span className="ik">Expected CTC</span><span className="iv" style={{ color: 'var(--color-grn)', fontWeight: 800 }}>{prefs.expectedCTC || '—'}</span></div>
                <div className="ir"><span className="ik">Notice Period</span><span className="iv">{prefs.noticePeriod || '—'}</span></div>
                <div className="ir"><span className="ik">LinkedIn</span><span className="iv">{prefs.linkedIn ? <a href={prefs.linkedIn} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-blu2)' }}>🔗 View</a> : '—'}</span></div>
                <div className="ir"><span className="ik">GitHub</span><span className="iv">{prefs.github ? <a href={prefs.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-blu2)' }}>🔗 View</a> : '—'}</span></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div id="profile-projects" className="card scroll-mt-20">
        <div className="ch"><h3>🚀 Projects</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('projects')}>Edit</button></div>
        <div className="cb">
          {!projects.some(p => p.title) ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🚀</div>
              <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your key projects — crucial for freshers</div>
              <button className="btn btn-p btn-xs" onClick={() => startEdit('projects')}>+ Add Project</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {projects.filter(p => p.title).map((p, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-bdr)', background: 'var(--color-bg3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '.84rem', fontWeight: 800 }}>{p.title}</span>
                    {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.68rem', color: 'var(--color-blu2)' }}>🔗</a>}
                  </div>
                  {p.tech && <div style={{ fontSize: '.72rem', color: 'var(--color-blu2)', fontWeight: 600, marginBottom: 4 }}>{p.tech}</div>}
                  {p.desc && <div style={{ fontSize: '.74rem', color: 'var(--color-txt2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.desc}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Internships + Certifications */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Internships */}
        <div id="profile-internships" className="card scroll-mt-20">
          <div className="ch"><h3>🎓 Internships</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('internships')}>Edit</button></div>
          <div className="cb">
            {!interns.some(i => i.company) ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🏢</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your internship experiences</div>
                <button className="btn btn-p btn-xs" onClick={() => startEdit('internships')}>+ Add Internship</button>
              </div>
            ) : (
              interns.filter(i => i.company).map((i, idx) => (
                <div key={idx} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: idx < interns.filter(x => x.company).length - 1 ? '1px solid var(--color-bdr)' : 'none' }}>
                  <div style={{ fontSize: '.84rem', fontWeight: 800 }}>{i.company}</div>
                  <div style={{ fontSize: '.76rem', color: 'var(--color-prp)' }}>{i.role}{i.duration ? ` · ${i.duration}` : ''}</div>
                  {i.bullets && <div style={{ fontSize: '.76rem', color: 'var(--color-txt2)', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginTop: 4 }}>{i.bullets}</div>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Certifications */}
        <div id="profile-certifications" className="card scroll-mt-20">
          <div className="ch"><h3>🏆 Certifications</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('certifications')}>Edit</button></div>
          <div className="cb">
            {!certs.some(c => c.name) ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📜</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your certifications & courses</div>
                <button className="btn btn-p btn-xs" onClick={() => startEdit('certifications')}>+ Add Certification</button>
              </div>
            ) : (
              certs.filter(c => c.name).map((c, idx) => (
                <div key={idx} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: idx < certs.filter(x => x.name).length - 1 ? '1px solid var(--color-bdr)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '.84rem', fontWeight: 800 }}>{c.name}</span>
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.68rem', color: 'var(--color-blu2)' }}>🔗</a>}
                  </div>
                  <div style={{ fontSize: '.76rem', color: 'var(--color-gold)' }}>{c.issuer}{c.year ? ` · ${c.year}` : ''}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div id="profile-summary" className="card scroll-mt-20">
        <div className="ch"><h3>📝 Professional Summary</h3><button className="btn btn-gh btn-xs" onClick={() => startEdit('summary')}>Edit</button></div>
        <div className="cb">
          {!summary ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>✍️</div>
              <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Write a 2–3 line summary for recruiters</div>
              <button className="btn btn-p btn-xs" onClick={() => startEdit('summary')}>+ Add Summary</button>
            </div>
          ) : (
            <p style={{ fontSize: '.84rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>{summary}</p>
          )}
        </div>
      </div>

      {/* AI Profile Review */}
      <div id="profile-ai-review" className="card scroll-mt-20" style={{ overflow: 'visible' }}>
        <div className="ch">
          <h3>🤖 AI Profile Review</h3>
          <button className="btn btn-p btn-xs" disabled={reviewLoading} onClick={async () => {
            setReviewLoading(true)
            try {
              const { data } = await profileReviewFn({ profile })
              setAiReview(data)
              const uid = auth.currentUser?.uid
              if (uid) await setDoc(doc(db, 'users', uid), { aiReview: { ...data, updatedAt: new Date().toISOString() } }, { merge: true })
            } catch (err) {
              console.error('Profile review error:', err)
              addToast('error', '⚠️ Failed to get AI review')
            }
            setReviewLoading(false)
          }}>
            {reviewLoading ? '⏳ Analyzing…' : aiReview ? '🔄 Re-analyze' : '✨ Get AI Review'}
          </button>
        </div>
        <div className="cb">
          {!aiReview && !reviewLoading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>🤖</div>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--color-txt2)', marginBottom: 4 }}>Get AI-powered profile feedback</div>
              <div style={{ fontSize: '.74rem', color: 'var(--color-muted)', maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>
                Glowminds AI will analyze your profile and suggest skills to learn, areas to improve, and provide a polished summary you can copy.
              </div>
            </div>
          )}

          {reviewLoading && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>🧠</div>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--color-txt2)' }}>Analyzing your profile…</div>
              <div style={{ fontSize: '.72rem', color: 'var(--color-muted)', marginTop: 2 }}>This takes a few seconds</div>
            </div>
          )}

          {aiReview && !reviewLoading && (
            <div>
              {/* Score + Verdict */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0,
                  border: '3px solid', borderColor: aiReview.overallScore >= 70 ? 'var(--color-grn)' : aiReview.overallScore >= 50 ? 'var(--color-blu2)' : 'var(--color-gold)',
                  color: aiReview.overallScore >= 70 ? 'var(--color-grn)' : aiReview.overallScore >= 50 ? 'var(--color-blu2)' : 'var(--color-gold)',
                  background: aiReview.overallScore >= 70 ? 'rgba(46,160,67,.06)' : aiReview.overallScore >= 50 ? 'rgba(56,139,253,.06)' : 'rgba(210,168,67,.06)',
                }}>{aiReview.overallScore}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.92rem', fontWeight: 800 }}>{aiReview.verdict}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--color-muted)' }}>AI Profile Score</div>
                  {aiReview.updatedAt && <div style={{ fontSize: '.64rem', color: 'var(--color-muted)', marginTop: 2 }}>Last analyzed: {new Date(aiReview.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {aiReview.strengths?.length > 0 && (
                  <div style={{ background: 'rgba(46,160,67,.05)', border: '1px solid rgba(46,160,67,.15)', borderRadius: 9, padding: 11 }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--color-grn)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>✅ Strengths</div>
                    {aiReview.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: '.74rem', color: 'var(--color-txt2)', padding: '2px 0', lineHeight: 1.5 }}>• {s}</div>
                    ))}
                  </div>
                )}
                {aiReview.weaknesses?.length > 0 && (
                  <div style={{ background: 'rgba(210,168,67,.05)', border: '1px solid rgba(210,168,67,.15)', borderRadius: 9, padding: 11 }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>⚠️ Areas to Improve</div>
                    {aiReview.weaknesses.map((w, i) => (
                      <div key={i} style={{ fontSize: '.74rem', color: 'var(--color-txt2)', padding: '2px 0', lineHeight: 1.5 }}>• {w}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skill Suggestions */}
              {aiReview.skillSuggestions?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>💡 Recommended Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {aiReview.skillSuggestions.map((s, i) => (
                      <div key={i} style={{ padding: '5px 10px', borderRadius: 7, fontSize: '.72rem', fontWeight: 600,
                        background: s.priority === 'high' ? 'rgba(56,139,253,.1)' : 'rgba(139,148,158,.08)',
                        border: `1px solid ${s.priority === 'high' ? 'rgba(56,139,253,.25)' : 'var(--color-bdr)'}`,
                        color: s.priority === 'high' ? 'var(--color-blu2)' : 'var(--color-txt2)',
                      }} title={s.reason}>
                        {s.skill}
                        {s.priority === 'high' && <span style={{ marginLeft: 4, fontSize: '.6rem' }}>🔥</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Tips */}
              {aiReview.tips?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--color-prp)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>🎯 Action Items</div>
                  {aiReview.tips.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < aiReview.tips.length - 1 ? '1px solid var(--color-bdr)' : 'none' }}>
                      <span style={{ fontSize: '.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, flexShrink: 0, marginTop: 1,
                        background: t.impact === 'high' ? 'rgba(56,139,253,.12)' : t.impact === 'medium' ? 'rgba(210,168,67,.12)' : 'rgba(139,148,158,.1)',
                        color: t.impact === 'high' ? 'var(--color-blu2)' : t.impact === 'medium' ? 'var(--color-gold)' : 'var(--color-muted)',
                      }}>{t.category}</span>
                      <span style={{ fontSize: '.76rem', color: 'var(--color-txt2)', lineHeight: 1.5 }}>{t.tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Draft */}
              {aiReview.summaryDraft && (
                <div style={{ background: 'var(--color-bg3)', border: '1px solid var(--color-bdr)', borderRadius: 9, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--color-grn)', textTransform: 'uppercase', letterSpacing: '.6px' }}>✍️ Suggested Summary</div>
                    <button className="btn btn-gh btn-xs" onClick={() => { navigator.clipboard.writeText(aiReview.summaryDraft); addToast('success', '📋 Summary copied!') }}>Copy</button>
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--color-txt2)', lineHeight: 1.7, fontStyle: 'italic' }}>"{aiReview.summaryDraft}"</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

        </div>
      </div>

      {/* ===== EDIT MODALS (rendered via portal so position:fixed escapes any ancestor with transform) ===== */}
      {createPortal(
        <>
      {editing === 'personal' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo">
            <div className="mh"><h2>🪪 Personal Information</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-3">
              <div className="fg2">
                <div className="fg"><label className="fl">Phone</label><input className="fi" placeholder="+91 98765 43210" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="fg"><label className="fl">Location</label><input className="fi" placeholder="Bangalore, India" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              </div>
              <div className="fg2">
                <div className="fg"><label className="fl">Gender</label>
                  <select className="fsl" value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select…</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                  </select>
                </div>
                <div className="fg"><label className="fl">Date of Birth</label><input className="fi" type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
              </div>
              <div className="fg"><label className="fl">Languages (comma-separated)</label><input className="fi" placeholder="English, Hindi, Telugu…" value={form.languages || ''} onChange={e => setForm({ ...form, languages: e.target.value })} /></div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection('personal', form)}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Education Edit */}
      {editing === 'education' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo mo-lg">
            <div className="mh"><h2>📚 Edit Education</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-3" style={{ maxHeight: 450, overflow: 'auto' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Higher Education</div>
              <div className="fg"><label className="fl">Degree & Branch *</label><input className="fi" placeholder="B.Tech Computer Science" value={form.degree || ''} onChange={e => setForm({ ...form, degree: e.target.value })} /></div>
              <div className="fg"><label className="fl">College / University *</label><input className="fi" placeholder="IIT Delhi" value={form.college || ''} onChange={e => setForm({ ...form, college: e.target.value })} /></div>
              <div className="fg2">
                <div className="fg"><label className="fl">Institute Type</label>
                  <select className="fsl" value={form.institute || ''} onChange={e => setForm({ ...form, institute: e.target.value })}>
                    <option value="">Select…</option><option>IIT</option><option>NIT</option><option>IIIT</option><option>Central University</option><option>State University</option><option>Deemed University</option><option>Private University</option><option>Autonomous College</option><option>Other</option>
                  </select>
                </div>
                <div className="fg"><label className="fl">Board / Affiliating University</label><input className="fi" placeholder="VTU, Anna University, AKTU…" value={form.board || ''} onChange={e => setForm({ ...form, board: e.target.value })} /></div>
              </div>
              <div className="fg2">
                <div className="fg"><label className="fl">Graduation Year</label><input className="fi" placeholder="2024" value={form.year || ''} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
                <div className="fg"><label className="fl">CGPA / Percentage</label><input className="fi" placeholder="8.5 or 85%" value={form.cgpa || ''} onChange={e => setForm({ ...form, cgpa: e.target.value })} /></div>
              </div>
              <div style={{ borderTop: '1px solid var(--color-bdr)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Class 12th</div>
                <div className="fg2">
                  <div className="fg"><label className="fl">Marks / Percentage</label><input className="fi" placeholder="92% or 460/500" value={form.marks12 || ''} onChange={e => setForm({ ...form, marks12: e.target.value })} /></div>
                  <div className="fg"><label className="fl">Board</label><input className="fi" placeholder="CBSE, ICSE, State Board…" value={form.board12 || ''} onChange={e => setForm({ ...form, board12: e.target.value })} /></div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--color-bdr)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Class 10th</div>
                <div className="fg2">
                  <div className="fg"><label className="fl">Marks / Percentage</label><input className="fi" placeholder="95% or 475/500" value={form.marks10 || ''} onChange={e => setForm({ ...form, marks10: e.target.value })} /></div>
                  <div className="fg"><label className="fl">Board</label><input className="fi" placeholder="CBSE, ICSE, State Board…" value={form.board10 || ''} onChange={e => setForm({ ...form, board10: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection('education', form)}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Skills Edit */}
      {editing === 'skills' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo">
            <div className="mh"><h2>🛠️ Edit Skills</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-3">
              <div className="fg">
                <label className="fl">Technical Skills</label>
                <div className="flex flex-wrap gap-[6px] mb-2">
                  {skills.map(s => (
                    <span key={s} className="tag tb" style={{ cursor: 'pointer' }} onClick={() => { const n = skills.filter(x => x !== s); setProfile(p => ({ ...p, skills: n })) }}>
                      {s} ✕
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="fi" placeholder="e.g. React, Python, AWS…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) { e.preventDefault(); setProfile(p => ({ ...p, skills: [...p.skills, skillInput.trim()] })); setSkillInput('') } }} />
                  <button className="btn btn-p btn-sm" type="button" onClick={() => { if (skillInput.trim()) { setProfile(p => ({ ...p, skills: [...p.skills, skillInput.trim()] })); setSkillInput('') } }}>Add</button>
                </div>
              </div>
              <div className="fg">
                <label className="fl">Soft Skills</label>
                <div className="flex flex-wrap gap-[6px] mb-2">
                  {softSkills.map(s => (
                    <span key={s} className="tag tg" style={{ cursor: 'pointer' }} onClick={() => { const n = softSkills.filter(x => x !== s); setProfile(p => ({ ...p, softSkills: n })) }}>
                      {s} ✕
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="fi" placeholder="e.g. Leadership, Communication…" value={softSkillInput} onChange={e => setSoftSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && softSkillInput.trim()) { e.preventDefault(); setProfile(p => ({ ...p, softSkills: [...p.softSkills, softSkillInput.trim()] })); setSoftSkillInput('') } }} />
                  <button className="btn btn-p btn-sm" type="button" onClick={() => { if (softSkillInput.trim()) { setProfile(p => ({ ...p, softSkills: [...p.softSkills, softSkillInput.trim()] })); setSoftSkillInput('') } }}>Add</button>
                </div>
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => { saveSection('skills', skills); saveSection('softSkills', softSkills) }}>{saving ? 'Saving…' : 'Save Skills'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Experience Edit */}
      {editing === 'experience' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo mo-lg">
            <div className="mh"><h2>💼 Edit Experience</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-4" style={{ maxHeight: 450, overflow: 'auto' }}>
              {/* Fresher checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-bdr)', background: form.isFresher ? 'rgba(63,185,80,.08)' : 'var(--color-bg3)', cursor: 'pointer' }}
                onClick={() => setForm(f => ({ ...f, isFresher: !f.isFresher }))}>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem',
                  borderColor: form.isFresher ? 'var(--color-grn)' : 'var(--color-bdr)',
                  background: form.isFresher ? 'var(--color-grn)' : 'transparent',
                  color: '#fff' }}>{form.isFresher ? '✓' : ''}</div>
                <div>
                  <div style={{ fontSize: '.82rem', fontWeight: 700 }}>I'm a fresher / recent graduate</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--color-muted)' }}>No prior full-time work experience</div>
                </div>
              </label>

              {!form.isFresher && (
                <>
                  {(form.experience || [{ company: '', role: '', duration: '', bullets: '' }]).map((exp, i) => (
                    <div key={i} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--color-bdr)', background: 'var(--color-bg3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '.76rem', fontWeight: 700 }}>Experience {i + 1}</span>
                        {(form.experience || []).length > 1 && (
                          <button style={{ fontSize: '.7rem', color: 'var(--color-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
                            onClick={() => setForm(f => ({ ...f, experience: f.experience.filter((_, j) => j !== i) }))}>Remove</button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <div className="fg"><label className="fl">Company *</label><input className="fi" placeholder="Google, TCS, Startup…" value={exp.company} onChange={e => { const u = [...form.experience]; u[i] = { ...u[i], company: e.target.value }; setForm({ ...form, experience: u }) }} /></div>
                        <div className="fg2">
                          <div className="fg"><label className="fl">Role *</label><input className="fi" placeholder="Software Engineer" value={exp.role} onChange={e => { const u = [...form.experience]; u[i] = { ...u[i], role: e.target.value }; setForm({ ...form, experience: u }) }} /></div>
                          <div className="fg"><label className="fl">Duration</label><input className="fi" placeholder="Jan 2023 – Present" value={exp.duration} onChange={e => { const u = [...form.experience]; u[i] = { ...u[i], duration: e.target.value }; setForm({ ...form, experience: u }) }} /></div>
                        </div>
                        <div className="fg"><label className="fl">Key Achievements</label><textarea className="fta min-h-[60px]" placeholder="• Built REST APIs&#10;• Improved performance by 30%" value={exp.bullets} onChange={e => { const u = [...form.experience]; u[i] = { ...u[i], bullets: e.target.value }; setForm({ ...form, experience: u }) }} /></div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-o btn-sm" onClick={() => setForm(f => ({ ...f, experience: [...(f.experience || []), { company: '', role: '', duration: '', bullets: '' }] }))}>+ Add Another</button>
                </>
              )}

              {form.isFresher && (
                <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '.82rem', color: 'var(--color-muted)' }}>
                  No worries! Add your internships, projects, and certifications in the other sections.
                </div>
              )}
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={async () => { await saveSection('isFresher', form.isFresher); if (!form.isFresher) await saveSection('experience', form.experience) }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Internships Edit */}
      {editing === 'internships' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo mo-lg">
            <div className="mh"><h2>🎓 Edit Internships</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-4" style={{ maxHeight: 400, overflow: 'auto' }}>
              {(form.internships || [{ company: '', role: '', duration: '', bullets: '' }]).map((intern, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--color-bdr)', background: 'var(--color-bg3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '.76rem', fontWeight: 700 }}>Internship {i + 1}</span>
                    {(form.internships || []).length > 1 && (
                      <button style={{ fontSize: '.7rem', color: 'var(--color-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
                        onClick={() => setForm(f => ({ ...f, internships: f.internships.filter((_, j) => j !== i) }))}>Remove</button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="fg"><label className="fl">Company *</label><input className="fi" placeholder="Google, Microsoft, Startup…" value={intern.company} onChange={e => { const u = [...form.internships]; u[i] = { ...u[i], company: e.target.value }; setForm({ ...form, internships: u }) }} /></div>
                    <div className="fg2">
                      <div className="fg"><label className="fl">Role *</label><input className="fi" placeholder="Software Intern" value={intern.role} onChange={e => { const u = [...form.internships]; u[i] = { ...u[i], role: e.target.value }; setForm({ ...form, internships: u }) }} /></div>
                      <div className="fg"><label className="fl">Duration</label><input className="fi" placeholder="Jun–Aug 2024" value={intern.duration} onChange={e => { const u = [...form.internships]; u[i] = { ...u[i], duration: e.target.value }; setForm({ ...form, internships: u }) }} /></div>
                    </div>
                    <div className="fg"><label className="fl">Key Work</label><textarea className="fta min-h-[60px]" placeholder="• Built feature X&#10;• Collaborated with team Y" value={intern.bullets} onChange={e => { const u = [...form.internships]; u[i] = { ...u[i], bullets: e.target.value }; setForm({ ...form, internships: u }) }} /></div>
                  </div>
                </div>
              ))}
              <button className="btn btn-o btn-sm" onClick={() => setForm(f => ({ ...f, internships: [...(f.internships || []), { company: '', role: '', duration: '', bullets: '' }] }))}>+ Add Another Internship</button>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection('internships', form.internships)}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Certifications Edit */}
      {editing === 'certifications' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo mo-lg">
            <div className="mh"><h2>🏆 Edit Certifications</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-4" style={{ maxHeight: 400, overflow: 'auto' }}>
              {(form.certifications || [{ name: '', issuer: '', year: '', url: '' }]).map((cert, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--color-bdr)', background: 'var(--color-bg3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '.76rem', fontWeight: 700 }}>Certification {i + 1}</span>
                    {(form.certifications || []).length > 1 && (
                      <button style={{ fontSize: '.7rem', color: 'var(--color-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
                        onClick={() => setForm(f => ({ ...f, certifications: f.certifications.filter((_, j) => j !== i) }))}>Remove</button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="fg"><label className="fl">Certification Name *</label><input className="fi" placeholder="AWS Cloud Practitioner" value={cert.name} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], name: e.target.value }; setForm({ ...form, certifications: u }) }} /></div>
                    <div className="fg2">
                      <div className="fg"><label className="fl">Issuer *</label><input className="fi" placeholder="Amazon, Google, Coursera…" value={cert.issuer} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], issuer: e.target.value }; setForm({ ...form, certifications: u }) }} /></div>
                      <div className="fg"><label className="fl">Year</label><input className="fi" placeholder="2024" value={cert.year} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], year: e.target.value }; setForm({ ...form, certifications: u }) }} /></div>
                    </div>
                    <div className="fg"><label className="fl">Certificate URL (optional)</label><input className="fi" placeholder="https://credential.net/…" value={cert.url} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], url: e.target.value }; setForm({ ...form, certifications: u }) }} /></div>
                  </div>
                </div>
              ))}
              <button className="btn btn-o btn-sm" onClick={() => setForm(f => ({ ...f, certifications: [...(f.certifications || []), { name: '', issuer: '', year: '', url: '' }] }))}>+ Add Another Certification</button>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection('certifications', form.certifications)}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Edit */}
      {editing === 'projects' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo mo-lg">
            <div className="mh"><h2>🚀 Edit Projects</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-4" style={{ maxHeight: 400, overflow: 'auto' }}>
              {(form.projects || [{ title: '', tech: '', desc: '', url: '' }]).map((proj, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--color-bdr)', background: 'var(--color-bg3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '.76rem', fontWeight: 700 }}>Project {i + 1}</span>
                    {(form.projects || []).length > 1 && (
                      <button style={{ fontSize: '.7rem', color: 'var(--color-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
                        onClick={() => setForm(f => ({ ...f, projects: f.projects.filter((_, j) => j !== i) }))}>Remove</button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="fg"><label className="fl">Project Title *</label><input className="fi" placeholder="E-Commerce Platform" value={proj.title} onChange={e => { const u = [...form.projects]; u[i] = { ...u[i], title: e.target.value }; setForm({ ...form, projects: u }) }} /></div>
                    <div className="fg2">
                      <div className="fg"><label className="fl">Tech Stack</label><input className="fi" placeholder="React, Node.js, MongoDB" value={proj.tech} onChange={e => { const u = [...form.projects]; u[i] = { ...u[i], tech: e.target.value }; setForm({ ...form, projects: u }) }} /></div>
                      <div className="fg"><label className="fl">Live URL / GitHub</label><input className="fi" placeholder="https://github.com/…" value={proj.url} onChange={e => { const u = [...form.projects]; u[i] = { ...u[i], url: e.target.value }; setForm({ ...form, projects: u }) }} /></div>
                    </div>
                    <div className="fg"><label className="fl">Description</label><textarea className="fta min-h-[60px]" placeholder={"• Built REST APIs with 150+ endpoints\n• Deployed on AWS with CI/CD"} value={proj.desc} onChange={e => { const u = [...form.projects]; u[i] = { ...u[i], desc: e.target.value }; setForm({ ...form, projects: u }) }} /></div>
                  </div>
                </div>
              ))}
              <button className="btn btn-o btn-sm" onClick={() => setForm(f => ({ ...f, projects: [...(f.projects || []), { title: '', tech: '', desc: '', url: '' }] }))}>+ Add Another Project</button>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection('projects', form.projects)}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Edit */}
      {editing === 'preferences' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo">
            <div className="mh"><h2>⚙️ Preferences & Salary</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-3">
              <div className="fg"><label className="fl">Job Type *</label>
                <select className="fsl" value={form.jobType || ''} onChange={e => setForm({ ...form, jobType: e.target.value })}>
                  <option value="">Select…</option><option>Full-time</option><option>Internship</option><option>Full-time / Internship</option><option>Contract</option><option>Part-time</option><option>Freelance</option>
                </select>
              </div>
              <div className="fg"><label className="fl">Preferred Location *</label><input className="fi" placeholder="Bangalore, Remote, Hyderabad…" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div className="fg"><label className="fl">Expected CTC / Salary *</label><input className="fi" placeholder="6–12 LPA or $80K–$120K" value={form.expectedCTC || ''} onChange={e => setForm({ ...form, expectedCTC: e.target.value })} /></div>
              <div className="fg"><label className="fl">Notice Period</label>
                <select className="fsl" value={form.noticePeriod || ''} onChange={e => setForm({ ...form, noticePeriod: e.target.value })}>
                  <option value="">Select…</option><option>Immediate</option><option>15 days</option><option>30 days</option><option>60 days</option><option>90 days</option>
                </select>
              </div>
              <div className="fg"><label className="fl">LinkedIn URL</label><input className="fi" placeholder="https://linkedin.com/in/yourname" value={form.linkedIn || ''} onChange={e => setForm({ ...form, linkedIn: e.target.value })} /></div>
              <div className="fg"><label className="fl">GitHub URL</label><input className="fi" placeholder="https://github.com/yourname" value={form.github || ''} onChange={e => setForm({ ...form, github: e.target.value })} /></div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection('preferences', form)}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Edit */}
      {editing === 'summary' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo">
            <div className="mh"><h2>📝 Professional Summary</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2">
              <div className="fg"><label className="fl">Summary (2–3 lines for recruiters)</label>
                <textarea className="fta min-h-[100px]" placeholder="Motivated B.Tech graduate with strong skills in Python, React and cloud. Built 3 full-stack projects deployed to production. Seeking software engineering roles." value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} />
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection('summary', form.summary)}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Name Edit Modal */}
      {editingName && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditingName(false)}>
          <div className="mo">
            <div className="mh"><h2>✏️ Edit Name</h2><div className="mx" onClick={() => setEditingName(false)}>✕</div></div>
            <div className="mb2">
              <div className="fg2">
                <div className="fg"><label className="fl">First Name *</label><input className="fi" value={nameForm.firstName} onChange={e => setNameForm({ ...nameForm, firstName: e.target.value })} placeholder="John" /></div>
                <div className="fg"><label className="fl">Last Name</label><input className="fi" value={nameForm.lastName} onChange={e => setNameForm({ ...nameForm, lastName: e.target.value })} placeholder="Doe" /></div>
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditingName(false)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={handleNameSave}>{saving ? 'Saving…' : 'Save Name'}</button>
            </div>
          </div>
        </div>
      )}
        </>,
        document.body
      )}
    </>
  )
}
