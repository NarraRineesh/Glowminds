import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import { auth } from '@/services/firebase'
import { apiFetch } from '@/services/apiClient'
import Loader from '@/components/Loader'
import { createDefaultProfile, normalizeProfile, normalizeSkills, stampAiReview } from '@/constants/schema'
import { formatDateRange, formatYearOrMonthDisplay, toMonthInputValue } from '@/utils/profileDates'
import EducationModal from '@/features/dashboard/sections/profile/EducationModal'
import ExperienceModal from '@/features/dashboard/sections/profile/ExperienceModal'
import ExperienceDetailModal from '@/features/dashboard/sections/profile/ExperienceDetailModal'
import InternshipModal from '@/features/dashboard/sections/profile/InternshipModal'
import InternshipDetailModal from '@/features/dashboard/sections/profile/InternshipDetailModal'
import ProjectModal from '@/features/dashboard/sections/profile/ProjectModal'
import ProjectDetailModal from '@/features/dashboard/sections/profile/ProjectDetailModal'
import {
  normalizeEducationList,
  sortEducationEntries,
  getPrimaryEducationEntry,
  educationEntryTitle,
  educationEntrySubtitle,
  profileHasEducation,
  entryHasContent as educationEntryHasContent,
} from '@/utils/educationEntries'
import {
  normalizeExperienceList,
  sortExperienceEntries,
  experienceEntrySubtitle,
  experienceEntryPreview,
  experienceHasDetails,
  finalizeExperienceEntry,
  entryHasContent as experienceEntryHasContent,
  profileHasExperience,
} from '@/utils/experienceEntries'
import {
  normalizeInternshipList,
  sortInternshipEntries,
  internshipEntrySubtitle,
  internshipEntryPreview,
  internshipHasDetails,
  finalizeInternshipEntry,
  internshipHasContent,
} from '@/utils/internshipEntries'
import {
  normalizeProjectList,
  sortProjectEntries,
  projectEntrySubtitle,
  projectEntryPreview,
  projectHasDetails,
  finalizeProjectEntry,
  projectHasContent,
} from '@/utils/projectEntries'
import '@/styles/dashboard.css'
import '@/styles/profile.css'
import '@/styles/cards.css'
import '@/styles/forms.css'
import '@/styles/modal.css'

const EMPTY_PROFILE = createDefaultProfile()

// ----- helpers to bridge UI input (strings) <-> v2 (arrays) -----

function toCsv(arr) {
  return Array.isArray(arr) ? arr.join(', ') : (arr || '')
}
function fromCsv(csv) {
  return String(csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export default function ProfileSection() {
  const { user, addToast, updatePhotoURL, removePhotoURL } = useAppStore()
  const profileFromStore = useProfileStore((s) => s.profile)
  const loadStore = useProfileStore((s) => s.load)
  const replaceProfile = useProfileStore((s) => s.replaceProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)

  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [softSkillInput, setSoftSkillInput] = useState('')
  const [skillsDraft, setSkillsDraft] = useState({ technical: [], soft: [] })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [educationModalOpen, setEducationModalOpen] = useState(false)
  const [educationModalEntry, setEducationModalEntry] = useState(null)
  const [experienceModalOpen, setExperienceModalOpen] = useState(false)
  const [experienceModalEntry, setExperienceModalEntry] = useState(null)
  const [experienceDetailOpen, setExperienceDetailOpen] = useState(false)
  const [experienceDetailEntry, setExperienceDetailEntry] = useState(null)
  const [internshipModalOpen, setInternshipModalOpen] = useState(false)
  const [internshipModalEntry, setInternshipModalEntry] = useState(null)
  const [internshipDetailOpen, setInternshipDetailOpen] = useState(false)
  const [internshipDetailEntry, setInternshipDetailEntry] = useState(null)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectModalEntry, setProjectModalEntry] = useState(null)
  const [projectDetailOpen, setProjectDetailOpen] = useState(false)
  const [projectDetailEntry, setProjectDetailEntry] = useState(null)
  const photoRef = useRef(null)
  const profileRef = useRef(EMPTY_PROFILE)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  const isProfileBusy =
    !!editing
    || educationModalOpen
    || experienceModalOpen
    || experienceDetailOpen
    || internshipModalOpen
    || internshipDetailOpen
    || projectModalOpen
    || projectDetailOpen

  const name = user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'

  const mergeProfilePatch = useCallback((patch) => {
    const current = normalizeProfile(profileRef.current)
    const partial = typeof patch === 'function' ? patch(current) : patch
    const updated = { ...current, ...partial }
    if (partial.personal) updated.personal = { ...current.personal, ...partial.personal }
    if (partial.skills) updated.skills = normalizeSkills(partial.skills)
    if (partial.links) updated.links = { ...current.links, ...partial.links }
    if (partial.preferences) updated.preferences = { ...current.preferences, ...partial.preferences }
    return updated
  }, [])

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

  const handlePhotoDelete = async (e) => {
    e?.stopPropagation?.()
    if (!user?.photoURL) return
    if (!window.confirm('Remove your profile photo? We’ll fall back to your initials.')) return
    setUploadingPhoto(true)
    try {
      await removePhotoURL()
      addToast('success', '🗑️ Profile photo removed')
    } catch (err) {
      console.error('Photo delete:', err)
      addToast('error', '⚠️ Failed to remove photo')
    }
    setUploadingPhoto(false)
  }

  const loadProfile = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) { setLoading(false); return }
    try {
      const data = await loadStore({ force: true })
      const p = normalizeProfile(useProfileStore.getState().profile)
      setProfile(p)
      if (data?.updatedAt?.toDate) setLastUpdated(data.updatedAt.toDate())
      else if (data?.updatedAt) setLastUpdated(new Date(data.updatedAt))
    } catch (e) { console.error('Load profile:', e) }
    setLoading(false)
  }, [loadStore])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      loadProfile()
    })
    return () => cancelAnimationFrame(id)
  }, [loadProfile])

  // Sync from store when idle (avoids wiping in-progress modal / inline edits).
  useEffect(() => {
    if (profileFromStore && !loading && !isProfileBusy) {
      setProfile(normalizeProfile(profileFromStore))
    }
  }, [profileFromStore, loading, isProfileBusy])

  const openSkillsEdit = () => {
    const s = normalizeSkills(profile.skills)
    setSkillsDraft({ technical: [...s.technical], soft: [...s.soft] })
    setSkillInput('')
    setSoftSkillInput('')
    setEditing('skills')
  }

  const saveSkills = async () => {
    const skills = normalizeSkills(skillsDraft)
    setSaving(true)
    try {
      await updateProfile({ skills })
      setProfile((p) => ({ ...p, skills }))
      setLastUpdated(new Date())
      setEditing(null)
      addToast('success', '✅ Skills saved!')
    } catch (e) {
      console.error('Save skills:', e)
      addToast('error', '⚠️ Failed to save skills')
    }
    setSaving(false)
  }

  // Save a single top-level profile field merged into Firestore + store.
  const saveSection = async (patch) => {
    setSaving(true)
    try {
      const updated = mergeProfilePatch(patch)
      setProfile(updated)
      await replaceProfile(updated)
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
    const p = profile
    const map = {
      personal: {
        phone: p.personal?.phone || '',
        location: p.personal?.location || '',
        gender: p.personal?.gender || '',
        dob: p.personal?.dob || '',
        languages: toCsv(p.personal?.languages),
      },
      preferences: {
        jobType: p.preferences?.jobType || '',
        location: toCsv(p.preferences?.preferredLocations),
        expectedCTC: p.preferences?.expectedCTC || '',
        noticePeriod: p.preferences?.noticePeriod || '',
        linkedin: p.links?.linkedin || '',
        github: p.links?.github || '',
        portfolio: p.links?.portfolio || '',
      },
      summary: { headline: p.headline || '', summary: p.summary || '' },
      certifications: {
        certifications: Array.isArray(p.certifications) && p.certifications.length
          ? p.certifications.map((e) => ({ id: e.id || uid(), ...e }))
          : [{ id: uid(), name: '', issuer: '', year: '', url: '' }],
      },
    }
    setForm(JSON.parse(JSON.stringify(map[section] || {})))
    setEditing(section)
  }

  // ----- derived view-model -----
  const personal = profile.personal || EMPTY_PROFILE.personal
  const educationList = sortEducationEntries(normalizeEducationList(profile))
  const primaryEdu = getPrimaryEducationEntry(educationList)
  const { technical: skillsTechnical, soft: skillsSoft } = normalizeSkills(profile.skills)
  const experienceList = sortExperienceEntries(normalizeExperienceList(profile))
  const internshipList = sortInternshipEntries(normalizeInternshipList(profile))
  const projectList = sortProjectEntries(normalizeProjectList(profile))
  const certs = Array.isArray(profile.certifications) ? profile.certifications : []
  const prefs = profile.preferences || EMPTY_PROFILE.preferences
  const links = profile.links || EMPTY_PROFILE.links
  const summary = profile.summary || ''
  const headline = profile.headline || ''
  const isFresher = !!profile.isFresher
  const aiReview = profile.aiReview || null

  const checks = [
    !!name && name !== 'User',
    skillsTechnical.length >= 3,
    profileHasEducation(profile),
    profileHasExperience(profile),
    !!prefs.expectedCTC,
    !!links.github || !!links.linkedin,
    !!summary,
    !!user?.photoURL,
  ]
  const profileScore = Math.round((checks.filter(Boolean).length / checks.length) * 100)
  const nextTip = !checks[0] ? 'Add your name'
    : !checks[1] ? 'Add at least 3 skills'
    : !checks[2] ? 'Add your education'
    : !checks[3] ? 'Add work experience'
    : !checks[4] ? 'Set salary expectations'
    : !checks[5] ? 'Add GitHub or LinkedIn URL'
    : !checks[6] ? 'Write a short summary'
    : 'Profile is complete!'

  const latestExp = experienceList.find(experienceEntryHasContent) || null
  const currentRole = latestExp?.role || (isFresher ? 'Fresher' : '')
  const currentCompany = latestExp?.company || ''
  const currentDuration = formatDateRange(latestExp?.startDate, latestExp?.endDate, latestExp?.duration || '')
  const collegeName = primaryEdu?.college || ''
  const degreeLine = primaryEdu ? educationEntryTitle(primaryEdu) : ''
  const eduYearDisplay = primaryEdu?.educationEnd
    ? String(primaryEdu.educationEnd).slice(0, 4)
    : ''

  const openAddEducation = () => {
    setEducationModalEntry(null)
    setEducationModalOpen(true)
  }

  const openEditEducation = (entry) => {
    setEducationModalEntry(entry)
    setEducationModalOpen(true)
  }

  const saveEducationEntry = async (entry) => {
    const current = normalizeProfile(profileRef.current)
    const baseList = sortEducationEntries(normalizeEducationList(current))
    let next = [...baseList]
    const idx = next.findIndex((e) => e.id === entry.id)
    if (idx >= 0) next[idx] = entry
    else next.push(entry)

    if (entry.primaryGraduation) {
      next = next.map((e) => ({
        ...e,
        primaryGraduation: e.id === entry.id,
      }))
    }

    setSaving(true)
    try {
      const updated = { ...current, educationList: next }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      setEducationModalOpen(false)
      setEducationModalEntry(null)
      addToast('success', '✅ Education saved!')
    } catch (e) {
      console.error('Save education:', e)
      addToast('error', '⚠️ Failed to save education')
    }
    setSaving(false)
  }

  const deleteEducationEntry = async (id) => {
    if (!window.confirm('Remove this education entry?')) return
    const current = normalizeProfile(profileRef.current)
    const next = sortEducationEntries(normalizeEducationList(current)).filter((e) => e.id !== id)
    setSaving(true)
    try {
      const updated = { ...current, educationList: next }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      addToast('success', '✅ Education removed')
    } catch (e) {
      console.error('Delete education:', e)
      addToast('error', '⚠️ Failed to remove education')
    }
    setSaving(false)
  }

  const openAddExperience = () => {
    if (isFresher) {
      addToast('info', 'Turn off “Fresher” below to add work experience')
      return
    }
    setExperienceModalEntry(null)
    setExperienceModalOpen(true)
  }

  const openEditExperience = (entry) => {
    setExperienceModalEntry(entry)
    setExperienceModalOpen(true)
  }

  const openViewExperience = (entry) => {
    setExperienceDetailEntry(entry)
    setExperienceDetailOpen(true)
  }

  const saveExperienceEntry = async (entry) => {
    const finalized = finalizeExperienceEntry(entry)
    const current = normalizeProfile(profileRef.current)
    const baseList = sortExperienceEntries(normalizeExperienceList(current))
    let next = [...baseList]
    const idx = next.findIndex((e) => e.id === finalized.id)
    if (idx >= 0) next[idx] = finalized
    else next.push(finalized)

    setSaving(true)
    try {
      const updated = { ...current, experience: next, isFresher: false }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      setExperienceModalOpen(false)
      setExperienceModalEntry(null)
      addToast('success', '✅ Experience saved!')
    } catch (e) {
      console.error('Save experience:', e)
      addToast('error', '⚠️ Failed to save experience')
    }
    setSaving(false)
  }

  const deleteExperienceEntry = async (id) => {
    if (!window.confirm('Remove this work experience?')) return
    const current = normalizeProfile(profileRef.current)
    const next = sortExperienceEntries(normalizeExperienceList(current)).filter((e) => e.id !== id)
    setSaving(true)
    try {
      const updated = { ...current, experience: next }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      addToast('success', '✅ Experience removed')
    } catch (e) {
      console.error('Delete experience:', e)
      addToast('error', '⚠️ Failed to remove experience')
    }
    setSaving(false)
  }

  const openAddInternship = () => {
    setInternshipModalEntry(null)
    setInternshipModalOpen(true)
  }

  const openEditInternship = (entry) => {
    setInternshipModalEntry(entry)
    setInternshipModalOpen(true)
  }

  const openViewInternship = (entry) => {
    setInternshipDetailEntry(entry)
    setInternshipDetailOpen(true)
  }

  const saveInternshipEntry = async (entry) => {
    const finalized = finalizeInternshipEntry(entry)
    const current = normalizeProfile(profileRef.current)
    const baseList = sortInternshipEntries(normalizeInternshipList(current))
    let next = [...baseList]
    const idx = next.findIndex((e) => e.id === finalized.id)
    if (idx >= 0) next[idx] = finalized
    else next.push(finalized)

    setSaving(true)
    try {
      const updated = { ...current, internships: next }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      setInternshipModalOpen(false)
      setInternshipModalEntry(null)
      addToast('success', '✅ Internship saved!')
    } catch (e) {
      console.error('Save internship:', e)
      addToast('error', '⚠️ Failed to save internship')
    }
    setSaving(false)
  }

  const deleteInternshipEntry = async (id) => {
    if (!window.confirm('Remove this internship?')) return
    const current = normalizeProfile(profileRef.current)
    const next = sortInternshipEntries(normalizeInternshipList(current)).filter((e) => e.id !== id)
    setSaving(true)
    try {
      const updated = { ...current, internships: next }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      addToast('success', '✅ Internship removed')
    } catch (e) {
      console.error('Delete internship:', e)
      addToast('error', '⚠️ Failed to remove internship')
    }
    setSaving(false)
  }

  const openAddProject = () => {
    setProjectModalEntry(null)
    setProjectModalOpen(true)
  }

  const openEditProject = (entry) => {
    setProjectModalEntry(entry)
    setProjectModalOpen(true)
  }

  const openViewProject = (entry) => {
    setProjectDetailEntry(entry)
    setProjectDetailOpen(true)
  }

  const saveProjectEntry = async (entry) => {
    const finalized = finalizeProjectEntry(entry)
    const current = normalizeProfile(profileRef.current)
    const baseList = sortProjectEntries(normalizeProjectList(current))
    let next = [...baseList]
    const idx = next.findIndex((e) => e.id === finalized.id)
    if (idx >= 0) next[idx] = finalized
    else next.push(finalized)

    setSaving(true)
    try {
      const updated = { ...current, projects: next }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      setProjectModalOpen(false)
      setProjectModalEntry(null)
      addToast('success', '✅ Project saved!')
    } catch (e) {
      console.error('Save project:', e)
      addToast('error', '⚠️ Failed to save project')
    }
    setSaving(false)
  }

  const deleteProjectEntry = async (id) => {
    if (!window.confirm('Remove this project?')) return
    const current = normalizeProfile(profileRef.current)
    const next = sortProjectEntries(normalizeProjectList(current)).filter((e) => e.id !== id)
    setSaving(true)
    try {
      const updated = { ...current, projects: next }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      addToast('success', '✅ Project removed')
    } catch (e) {
      console.error('Delete project:', e)
      addToast('error', '⚠️ Failed to remove project')
    }
    setSaving(false)
  }

  const setFresherStatus = async (nextFresher) => {
    const current = normalizeProfile(profileRef.current)
    const currentExperience = sortExperienceEntries(normalizeExperienceList(current))
    if (nextFresher && currentExperience.some(experienceEntryHasContent)) {
      if (!window.confirm('Mark as fresher? This will remove your listed work experience from the profile.')) return
    }
    setSaving(true)
    try {
      const updated = {
        ...current,
        isFresher: nextFresher,
        experience: nextFresher ? [] : currentExperience,
      }
      setProfile(updated)
      await replaceProfile(updated)
      setLastUpdated(new Date())
      addToast('success', nextFresher ? '🌱 Marked as fresher' : '✅ Ready to add experience')
    } catch (e) {
      console.error('Set fresher:', e)
      addToast('error', '⚠️ Failed to update')
    }
    setSaving(false)
  }

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  const quickLinks = [
    { id: 'profile-summary', label: 'Profile summary' },
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

  const personalLanguagesDisplay = Array.isArray(personal.languages)
    ? personal.languages.join(', ')
    : (personal.languages || '')

  const personalEmpty = !personal.phone && !personal.location && !personal.gender && !personalLanguagesDisplay
  const educationEmpty = !educationList.some(educationEntryHasContent)
  const skillsEmpty = skillsTechnical.length === 0 && skillsSoft.length === 0
  const experienceEmpty = !isFresher && !experienceList.some(experienceEntryHasContent)
  const preferencesEmpty = !prefs.jobType && !(prefs.preferredLocations || []).length && !prefs.expectedCTC
  const projectsEmpty = !projectList.some(projectHasContent)
  const internshipsEmpty = !internshipList.some(internshipHasContent)
  const certsEmpty = !certs.some((c) => c.name)
  const summaryEmpty = !summary && !headline

  if (loading) return <Loader variant="section" />

  return (
    <>
      {/* Naukri-style profile hero */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row">
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
              {user?.photoURL && (
                <button
                  type="button"
                  onClick={handlePhotoDelete}
                  disabled={uploadingPhoto}
                  className="absolute top-0 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--color-surf)] bg-[var(--color-red)] text-xs text-white transition-transform hover:scale-110 disabled:opacity-50"
                  title="Remove photo"
                  aria-label="Remove profile photo"
                >
                  ✕
                </button>
              )}
            </div>
            <div
              className={`text-[0.78rem] font-extrabold tabular-nums ${
                profileScore >= 80 ? 'text-[var(--color-grn)]' : 'text-[var(--color-blu2)]'
              }`}
            >
              {profileScore}%
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1
                  className="flex flex-wrap items-center gap-2 text-[clamp(1.35rem,2.4vw,1.7rem)] font-black leading-tight tracking-[-0.01em] text-[var(--color-txt)]"
                  title="Name is set during onboarding and can’t be changed"
                >
                  <span>{name}</span>
                  <span
                    aria-hidden
                    className="inline-flex items-center rounded-md border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]"
                  >
                    🔒 locked
                  </span>
                </h1>
                {headline && (
                  <div className="mt-0.5 text-[0.95rem] font-bold text-[var(--color-txt)]">
                    {headline}
                  </div>
                )}
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
                {collegeName && (
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[0.78rem] text-[var(--color-txt2)]">
                    <span aria-hidden>🎓</span>
                    <span className="font-semibold">{degreeLine ? `${degreeLine} · ` : ''}{collegeName}{eduYearDisplay ? ` · Class of ${eduYearDisplay}` : ''}</span>
                  </div>
                )}
              </div>
              {lastUpdatedStr && (
                <div className="text-[0.74rem] text-[var(--color-muted)] sm:text-right">
                  Profile last updated · <span className="font-semibold text-[var(--color-txt2)]">{lastUpdatedStr}</span>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-[var(--color-bdr)] pt-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt2)]">
                  <span aria-hidden>📍</span>
                  <span>{personal.location || <span className="text-[var(--color-muted)]">Add location</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt2)]">
                  <span aria-hidden>💼</span>
                  <span>
                    {isFresher
                      ? 'Fresher'
                      : currentDuration || (experienceList.some(experienceEntryHasContent)
                        ? `${experienceList.filter(experienceEntryHasContent).length} role${experienceList.filter(experienceEntryHasContent).length > 1 ? 's' : ''}`
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
                  <span>{personal.phone || <span className="text-[var(--color-muted)]">Add phone</span>}</span>
                  {personal.phone && <span className="text-[var(--color-grn)]" title="Verified" aria-label="Verified">✓</span>}
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
        <div className="ch">
          <h3>🪪 Personal Information</h3>
          {!personalEmpty && (
            <button type="button" className="btn btn-gh btn-xs" onClick={() => startEdit('personal')}>Edit</button>
          )}
        </div>
        <div className="cb">
          {personalEmpty ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📋</div>
              <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your personal details — phone, location, gender, languages</div>
              <button className="btn btn-p btn-xs" onClick={() => startEdit('personal')}>+ Add Details</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
              <div className="ir"><span className="ik">Phone</span><span className="iv">{personal.phone || '—'}</span></div>
              <div className="ir"><span className="ik">Location</span><span className="iv">{personal.location || '—'}</span></div>
              <div className="ir"><span className="ik">Gender</span><span className="iv">{personal.gender || '—'}</span></div>
              <div className="ir"><span className="ik">Date of Birth</span><span className="iv">{personal.dob || '—'}</span></div>
              <div className="ir" style={{ gridColumn: '1/-1' }}><span className="ik">Languages</span><span className="iv">{personalLanguagesDisplay || '—'}</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Education */}
        <div id="profile-education" className="card scroll-mt-20">
          <div className="ch">
            <h3>📚 Education</h3>
            {!educationEmpty && (
              <button type="button" className="btn btn-p btn-xs" onClick={openAddEducation}>+ Add</button>
            )}
          </div>
          <div className="cb">
            {educationEmpty ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🎓</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>
                  Add 10th, 12th, degree, masters — one qualification at a time
                </div>
                <button type="button" className="btn btn-p btn-xs" onClick={openAddEducation}>+ Add Education</button>
              </div>
            ) : (
              educationList.filter(educationEntryHasContent).map((entry, i, arr) => (
                <div
                  key={entry.id}
                  style={{
                    paddingBottom: 12,
                    marginBottom: 12,
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-bdr)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.84rem', fontWeight: 800 }}>{educationEntryTitle(entry)}</div>
                      {educationEntrySubtitle(entry) && (
                        <div style={{ fontSize: '.76rem', color: 'var(--color-blu2)', marginTop: 2 }}>{educationEntrySubtitle(entry)}</div>
                      )}
                      {formatDateRange(entry.educationStart, entry.educationEnd, '') && (
                        <div style={{ fontSize: '.72rem', color: 'var(--color-muted)', marginTop: 2 }}>
                          {formatDateRange(entry.educationStart, entry.educationEnd, '')}
                        </div>
                      )}
                      {entry.marks && (
                        <div style={{ fontSize: '.72rem', color: 'var(--color-txt2)', marginTop: 4 }}>
                          {entry.gradingSystem ? `${entry.gradingSystem}: ` : ''}{entry.marks}
                        </div>
                      )}
                      {entry.primaryGraduation && (
                        <span className="tag tb" style={{ marginTop: 6, fontSize: '.65rem' }}>Primary graduation</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button type="button" className="btn btn-gh btn-xs" onClick={() => openEditEducation(entry)}>Edit</button>
                      <button type="button" className="btn btn-gh btn-xs" onClick={() => deleteEducationEntry(entry.id)} disabled={saving}>✕</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Skills */}
        <div id="profile-skills" className="card scroll-mt-20">
          <div className="ch">
            <h3>🛠️ Skills</h3>
            {!skillsEmpty && (
              <button type="button" className="btn btn-gh btn-xs" onClick={openSkillsEdit}>Edit</button>
            )}
          </div>
          <div className="cb">
            {skillsEmpty ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🎯</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your technical & soft skills</div>
                <button className="btn btn-p btn-xs" onClick={openSkillsEdit}>+ Add Skills</button>
              </div>
            ) : (
              <>
                {skillsTechnical.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Technical</div>
                    <div className="flex flex-wrap gap-[6px]">{skillsTechnical.map(s => <span key={s} className="tag tb">{s}</span>)}</div>
                  </div>
                )}
                {skillsSoft.length > 0 && (
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Soft Skills</div>
                    <div className="flex flex-wrap gap-[6px]">{skillsSoft.map(s => <span key={s} className="tag tg">{s}</span>)}</div>
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
          <div className="ch">
            <h3>💼 Experience</h3>
            {!isFresher && !experienceEmpty && (
              <button type="button" className="btn btn-p btn-xs" onClick={openAddExperience}>+ Add</button>
            )}
          </div>
          <div className="cb">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                marginBottom: 12,
                borderRadius: 10,
                border: '1px solid var(--color-bdr)',
                background: isFresher ? 'rgba(63,185,80,.08)' : 'var(--color-bg3)',
                cursor: saving ? 'wait' : 'pointer',
              }}
              onClick={() => !saving && setFresherStatus(!isFresher)}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4, border: '2px solid', flexShrink: 0,
                borderColor: isFresher ? 'var(--color-grn)' : 'var(--color-bdr)',
                background: isFresher ? 'var(--color-grn)' : 'transparent',
                color: '#fff', fontSize: '.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{isFresher ? '✓' : ''}</div>
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 700 }}>I&apos;m a fresher / recent graduate</div>
                <div style={{ fontSize: '.7rem', color: 'var(--color-muted)' }}>No full-time work experience yet</div>
              </div>
            </label>

            {isFresher ? (
              <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: '.76rem', color: 'var(--color-muted)' }}>
                Add internships and projects in the sections below.
              </div>
            ) : experienceEmpty ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>💼</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>
                  Add each job one at a time — company, role, and dates
                </div>
                <button type="button" className="btn btn-p btn-xs" onClick={openAddExperience}>+ Add Experience</button>
              </div>
            ) : (
              experienceList.filter(experienceEntryHasContent).map((entry, i, arr) => {
                const preview = experienceEntryPreview(entry)
                const hasDetails = experienceHasDetails(entry)
                return (
                  <div
                    key={entry.id}
                    style={{
                      paddingBottom: 8,
                      marginBottom: 8,
                      borderBottom: i < arr.length - 1 ? '1px solid var(--color-bdr)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.84rem', fontWeight: 800, lineHeight: 1.3 }}>{entry.company}</div>
                        <div style={{ fontSize: '.74rem', color: 'var(--color-blu2)', marginTop: 2, lineHeight: 1.35 }}>
                          {experienceEntrySubtitle(entry)}
                        </div>
                        {preview && (
                          <div
                            style={{
                              fontSize: '.72rem',
                              color: 'var(--color-muted)',
                              marginTop: 4,
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {preview}
                          </div>
                        )}
                        {hasDetails && (
                          <button
                            type="button"
                            className="btn btn-gh btn-xs"
                            style={{ marginTop: 6, padding: '2px 8px', fontSize: '.68rem' }}
                            onClick={() => openViewExperience(entry)}
                          >
                            View details
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'flex-start' }}>
                        <button type="button" className="btn btn-gh btn-xs" onClick={() => openEditExperience(entry)}>Edit</button>
                        <button type="button" className="btn btn-gh btn-xs" onClick={() => deleteExperienceEntry(entry.id)} disabled={saving}>✕</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Job Preferences & Salary */}
        <div id="profile-preferences" className="card scroll-mt-20">
          <div className="ch">
            <h3>⚙️ Preferences & Salary</h3>
            {!preferencesEmpty && (
              <button type="button" className="btn btn-gh btn-xs" onClick={() => startEdit('preferences')}>Edit</button>
            )}
          </div>
          <div className="cb">
            {preferencesEmpty ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>💰</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Set your job type, location & salary expectations</div>
                <button className="btn btn-p btn-xs" onClick={() => startEdit('preferences')}>+ Set Preferences</button>
              </div>
            ) : (
              <>
                <div className="ir"><span className="ik">Job Type</span><span className="iv">{prefs.jobType || '—'}</span></div>
                <div className="ir"><span className="ik">Location</span><span className="iv">{(prefs.preferredLocations || []).join(', ') || '—'}</span></div>
                <div className="ir"><span className="ik">Expected CTC</span><span className="iv" style={{ color: 'var(--color-grn)', fontWeight: 800 }}>{prefs.expectedCTC || '—'}</span></div>
                <div className="ir"><span className="ik">Notice Period</span><span className="iv">{prefs.noticePeriod || '—'}</span></div>
                <div className="ir"><span className="ik">LinkedIn</span><span className="iv">{links.linkedin ? <a href={links.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-blu2)' }}>🔗 View</a> : '—'}</span></div>
                <div className="ir"><span className="ik">GitHub</span><span className="iv">{links.github ? <a href={links.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-blu2)' }}>🔗 View</a> : '—'}</span></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div id="profile-projects" className="card scroll-mt-20">
        <div className="ch">
          <h3>🚀 Projects</h3>
          {!projectsEmpty && (
            <button type="button" className="btn btn-p btn-xs" onClick={openAddProject}>+ Add</button>
          )}
        </div>
        <div className="cb">
          {projectsEmpty ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🚀</div>
              <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your key projects — crucial for freshers</div>
              <button type="button" className="btn btn-p btn-xs" onClick={openAddProject}>+ Add Project</button>
            </div>
          ) : (
            projectList.filter(projectHasContent).map((entry, i, arr) => {
              const preview = projectEntryPreview(entry)
              const hasDetails = projectHasDetails(entry)
              const subtitle = projectEntrySubtitle(entry)
              return (
                <div
                  key={entry.id}
                  style={{
                    paddingBottom: 8,
                    marginBottom: 8,
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-bdr)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '.84rem', fontWeight: 800, lineHeight: 1.3 }}>{entry.title}</span>
                        {entry.url?.trim() && (
                          <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.68rem', color: 'var(--color-blu2)' }}>🔗</a>
                        )}
                      </div>
                      {subtitle && (
                        <div style={{ fontSize: '.74rem', color: 'var(--color-blu2)', marginTop: 2, lineHeight: 1.35 }}>{subtitle}</div>
                      )}
                      {preview && (
                        <div
                          style={{
                            fontSize: '.72rem',
                            color: 'var(--color-muted)',
                            marginTop: 4,
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {preview}
                        </div>
                      )}
                      {hasDetails && (
                        <button
                          type="button"
                          className="btn btn-gh btn-xs"
                          style={{ marginTop: 6, padding: '2px 8px', fontSize: '.68rem' }}
                          onClick={() => openViewProject(entry)}
                        >
                          View details
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'flex-start' }}>
                      <button type="button" className="btn btn-gh btn-xs" onClick={() => openEditProject(entry)}>Edit</button>
                      <button type="button" className="btn btn-gh btn-xs" onClick={() => deleteProjectEntry(entry.id)} disabled={saving}>✕</button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Internships + Certifications */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div id="profile-internships" className="card scroll-mt-20">
          <div className="ch">
            <h3>🎓 Internships</h3>
            {!internshipsEmpty && (
              <button type="button" className="btn btn-p btn-xs" onClick={openAddInternship}>+ Add</button>
            )}
          </div>
          <div className="cb">
            {internshipsEmpty ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🏢</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your internship experiences</div>
                <button type="button" className="btn btn-p btn-xs" onClick={openAddInternship}>+ Add Internship</button>
              </div>
            ) : (
              internshipList.filter(internshipHasContent).map((entry, i, arr) => {
                const preview = internshipEntryPreview(entry)
                const hasDetails = internshipHasDetails(entry)
                return (
                  <div
                    key={entry.id}
                    style={{
                      paddingBottom: 8,
                      marginBottom: 8,
                      borderBottom: i < arr.length - 1 ? '1px solid var(--color-bdr)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.84rem', fontWeight: 800, lineHeight: 1.3 }}>{entry.company}</div>
                        <div style={{ fontSize: '.74rem', color: 'var(--color-blu2)', marginTop: 2, lineHeight: 1.35 }}>
                          {internshipEntrySubtitle(entry)}
                        </div>
                        {preview && (
                          <div
                            style={{
                              fontSize: '.72rem',
                              color: 'var(--color-muted)',
                              marginTop: 4,
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {preview}
                          </div>
                        )}
                        {hasDetails && (
                          <button
                            type="button"
                            className="btn btn-gh btn-xs"
                            style={{ marginTop: 6, padding: '2px 8px', fontSize: '.68rem' }}
                            onClick={() => openViewInternship(entry)}
                          >
                            View details
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'flex-start' }}>
                        <button type="button" className="btn btn-gh btn-xs" onClick={() => openEditInternship(entry)}>Edit</button>
                        <button type="button" className="btn btn-gh btn-xs" onClick={() => deleteInternshipEntry(entry.id)} disabled={saving}>✕</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div id="profile-certifications" className="card scroll-mt-20">
          <div className="ch">
            <h3>🏆 Certifications</h3>
            {!certsEmpty && (
              <button type="button" className="btn btn-gh btn-xs" onClick={() => startEdit('certifications')}>Edit</button>
            )}
          </div>
          <div className="cb">
            {certsEmpty ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📜</div>
                <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add your certifications & courses</div>
                <button className="btn btn-p btn-xs" onClick={() => startEdit('certifications')}>+ Add Certification</button>
              </div>
            ) : (
              certs.filter(c => c.name).map((c, idx) => (
                <div key={c.id || idx} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: idx < certs.filter(x => x.name).length - 1 ? '1px solid var(--color-bdr)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '.84rem', fontWeight: 800 }}>{c.name}</span>
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.68rem', color: 'var(--color-blu2)' }}>🔗</a>}
                  </div>
                  <div style={{ fontSize: '.76rem', color: 'var(--color-gold)' }}>{c.issuer}{c.year ? ` · ${formatYearOrMonthDisplay(c.year)}` : ''}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div id="profile-summary" className="card scroll-mt-20">
        <div className="ch">
          <h3>📝 Professional Summary</h3>
          {!summaryEmpty && (
            <button type="button" className="btn btn-gh btn-xs" onClick={() => startEdit('summary')}>Edit</button>
          )}
        </div>
        <div className="cb">
          {summaryEmpty ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>✍️</div>
              <div style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginBottom: 10 }}>Add a headline + 2–3 line summary for recruiters</div>
              <button className="btn btn-p btn-xs" onClick={() => startEdit('summary')}>+ Add Summary</button>
            </div>
          ) : (
            <>
              {headline && <p style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--color-txt)', marginBottom: 6 }}>{headline}</p>}
              {summary && <p style={{ fontSize: '.84rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>{summary}</p>}
            </>
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
              const data = await apiFetch('/ai/profile-review', {
                body: { profile: profileRef.current },
              })
              const stamped = stampAiReview(data)
              const updated = { ...normalizeProfile(profileRef.current), aiReview: stamped }
              setProfile(updated)
              await replaceProfile(updated)
              setLastUpdated(new Date())
              addToast('success', '✅ AI review ready!')
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
                  {aiReview.lastReviewedAt && (
                    <div style={{ fontSize: '.64rem', color: 'var(--color-muted)', marginTop: 2 }}>
                      Last reviewed: {new Date(aiReview.lastReviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

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

      {/* ===== EDIT MODALS (rendered via portal) ===== */}
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
                    <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div className="fg"><label className="fl">Date of Birth</label><input className="fi" type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
              </div>
              <div className="fg"><label className="fl">Languages (comma-separated)</label><input className="fi" placeholder="English, Hindi, Telugu…" value={form.languages || ''} onChange={e => setForm({ ...form, languages: e.target.value })} /></div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection({
                personal: {
                  phone: form.phone || '', location: form.location || '', gender: form.gender || '', dob: form.dob || '',
                  languages: fromCsv(form.languages),
                },
              })}>{saving ? 'Saving…' : 'Save'}</button>
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
                  {skillsDraft.technical.map((s) => (
                    <span key={s} className="tag tb" style={{ cursor: 'pointer' }} onClick={() => {
                      setSkillsDraft((d) => ({ ...d, technical: d.technical.filter((x) => x !== s) }))
                    }}>
                      {s} ✕
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="fi" placeholder="e.g. React, Python, AWS…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) { e.preventDefault(); const v = skillInput.trim(); setSkillsDraft((d) => ({ ...d, technical: d.technical.includes(v) ? d.technical : [...d.technical, v] })); setSkillInput('') } }} />
                  <button className="btn btn-p btn-sm" type="button" onClick={() => { if (skillInput.trim()) { const v = skillInput.trim(); setSkillsDraft((d) => ({ ...d, technical: d.technical.includes(v) ? d.technical : [...d.technical, v] })); setSkillInput('') } }}>Add</button>
                </div>
              </div>
              <div className="fg">
                <label className="fl">Soft Skills</label>
                <div className="flex flex-wrap gap-[6px] mb-2">
                  {skillsDraft.soft.map((s) => (
                    <span key={s} className="tag tg" style={{ cursor: 'pointer' }} onClick={() => {
                      setSkillsDraft((d) => ({ ...d, soft: d.soft.filter((x) => x !== s) }))
                    }}>
                      {s} ✕
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="fi" placeholder="e.g. Leadership, Communication…" value={softSkillInput} onChange={e => setSoftSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && softSkillInput.trim()) { e.preventDefault(); const v = softSkillInput.trim(); setSkillsDraft((d) => ({ ...d, soft: d.soft.includes(v) ? d.soft : [...d.soft, v] })); setSoftSkillInput('') } }} />
                  <button className="btn btn-p btn-sm" type="button" onClick={() => { if (softSkillInput.trim()) { const v = softSkillInput.trim(); setSkillsDraft((d) => ({ ...d, soft: d.soft.includes(v) ? d.soft : [...d.soft, v] })); setSoftSkillInput('') } }}>Add</button>
                </div>
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={saveSkills}>{saving ? 'Saving…' : 'Save Skills'}</button>
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
              {(form.certifications || []).map((cert, i) => (
                <div key={cert.id || i} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--color-bdr)', background: 'var(--color-bg3)' }}>
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
                      <div className="fg"><label className="fl">Month / Year</label><input className="fi" type="month" value={toMonthInputValue(cert.year)} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], year: e.target.value ? e.target.value.slice(0, 7) : '' }; setForm({ ...form, certifications: u }) }} /></div>
                    </div>
                    <div className="fg"><label className="fl">Certificate URL (optional)</label><input className="fi" placeholder="https://credential.net/…" value={cert.url} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], url: e.target.value }; setForm({ ...form, certifications: u }) }} /></div>
                  </div>
                </div>
              ))}
              <button className="btn btn-o btn-sm" onClick={() => setForm(f => ({ ...f, certifications: [...(f.certifications || []), { id: uid(), name: '', issuer: '', year: '', url: '' }] }))}>+ Add Another Certification</button>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection({
                certifications: (form.certifications || []).filter(c => c.name).map(c => ({ id: c.id || uid(), name: c.name || '', issuer: c.issuer || '', year: c.year || '', url: c.url || '' })),
              })}>{saving ? 'Saving…' : 'Save'}</button>
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
              <div className="fg"><label className="fl">Preferred Locations (comma-separated) *</label><input className="fi" placeholder="Bangalore, Remote, Hyderabad…" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div className="fg"><label className="fl">Expected CTC / Salary *</label><input className="fi" placeholder="6–12 LPA or $80K–$120K" value={form.expectedCTC || ''} onChange={e => setForm({ ...form, expectedCTC: e.target.value })} /></div>
              <div className="fg"><label className="fl">Notice Period</label>
                <select className="fsl" value={form.noticePeriod || ''} onChange={e => setForm({ ...form, noticePeriod: e.target.value })}>
                  <option value="">Select…</option><option>Immediate</option><option>15 days</option><option>30 days</option><option>60 days</option><option>90 days</option>
                </select>
              </div>
              <div className="fg"><label className="fl">LinkedIn URL</label><input className="fi" placeholder="https://linkedin.com/in/yourname" value={form.linkedin || ''} onChange={e => setForm({ ...form, linkedin: e.target.value })} /></div>
              <div className="fg"><label className="fl">GitHub URL</label><input className="fi" placeholder="https://github.com/yourname" value={form.github || ''} onChange={e => setForm({ ...form, github: e.target.value })} /></div>
              <div className="fg"><label className="fl">Portfolio URL</label><input className="fi" placeholder="https://yourname.dev" value={form.portfolio || ''} onChange={e => setForm({ ...form, portfolio: e.target.value })} /></div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection({
                preferences: {
                  jobType: form.jobType || '',
                  preferredLocations: fromCsv(form.location),
                  expectedCTC: form.expectedCTC || '',
                  noticePeriod: form.noticePeriod || '',
                },
                links: {
                  ...(profile.links || {}),
                  linkedin: form.linkedin || '',
                  github: form.github || '',
                  portfolio: form.portfolio || '',
                },
              })}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Edit */}
      {editing === 'summary' && (
        <div className="mb on" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="mo">
            <div className="mh"><h2>📝 Professional Summary</h2><div className="mx" onClick={() => setEditing(null)}>✕</div></div>
            <div className="mb2 flex flex-col gap-3">
              <div className="fg"><label className="fl">Headline (1 line)</label>
                <input className="fi" placeholder="B.Tech CS, aspiring SDE" value={form.headline || ''} onChange={e => setForm({ ...form, headline: e.target.value })} />
              </div>
              <div className="fg"><label className="fl">Summary (2–3 lines for recruiters)</label>
                <textarea className="fta min-h-[100px]" placeholder="Motivated B.Tech graduate with strong skills in Python, React and cloud. Built 3 full-stack projects deployed to production. Seeking software engineering roles." value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} />
              </div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" disabled={saving} onClick={() => saveSection({ headline: form.headline || '', summary: form.summary || '' })}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}


      <InternshipDetailModal
        open={internshipDetailOpen}
        entry={internshipDetailEntry}
        onClose={() => { setInternshipDetailOpen(false); setInternshipDetailEntry(null) }}
        onEdit={(e) => openEditInternship(e)}
      />

      <InternshipModal
        open={internshipModalOpen}
        entry={internshipModalEntry}
        saving={saving}
        onClose={() => { setInternshipModalOpen(false); setInternshipModalEntry(null) }}
        onSave={saveInternshipEntry}
      />

      <ProjectDetailModal
        open={projectDetailOpen}
        entry={projectDetailEntry}
        onClose={() => { setProjectDetailOpen(false); setProjectDetailEntry(null) }}
        onEdit={(e) => openEditProject(e)}
      />

      <ProjectModal
        open={projectModalOpen}
        entry={projectModalEntry}
        saving={saving}
        onClose={() => { setProjectModalOpen(false); setProjectModalEntry(null) }}
        onSave={saveProjectEntry}
      />

      <ExperienceDetailModal
        open={experienceDetailOpen}
        entry={experienceDetailEntry}
        onClose={() => { setExperienceDetailOpen(false); setExperienceDetailEntry(null) }}
        onEdit={(e) => openEditExperience(e)}
      />

      <ExperienceModal
        open={experienceModalOpen}
        entry={experienceModalEntry}
        saving={saving}
        onClose={() => { setExperienceModalOpen(false); setExperienceModalEntry(null) }}
        onSave={saveExperienceEntry}
      />

      <EducationModal
        open={educationModalOpen}
        entry={educationModalEntry}
        saving={saving}
        onClose={() => { setEducationModalOpen(false); setEducationModalEntry(null) }}
        onSave={saveEducationEntry}
      />

        </>,
        document.body
      )}
    </>
  )
}
