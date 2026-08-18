import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useIsPro from '@/hooks/useIsPro'
import useUpgradePro from '@/hooks/useUpgradePro'
import { auth } from '@/services/firebase'
import { apiFetch } from '@/services/apiClient'
import Loader from '@/components/Loader'
import useIsLg from '@/hooks/useIsLg'
import AppIcon from '@/components/icons/AppIcon'
import {
  AppDialog,
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  FormField,
  FormRow,
  Input,
  Label,
  ProfileCard,
  Progress,
  Select,
  Textarea,
} from '@/components/ui'
import {
  AiScoreBadge,
  FresherToggle,
  ProfileAvatarBlock,
  ProfileEmptyState,
  ProfileEntryBlock,
  ProfileFieldRow,
  ProfilePreviewText,
  ProfileSectionGrid,
  SkillGroup,
} from '@/features/dashboard/sections/profile/profileSectionUi'
import { createDefaultProfile, normalizeProfile, normalizeSkills, stampAiReview } from '@/constants/schema'
import { formatDateRange, formatYearOrMonthDisplay, toMonthInputValue } from '@/utils/profileDates'
import { computeProfileScore, profileCompletionChecks } from '@/utils/profileScore'
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
  const isLg = useIsLg()
  const isPro = useIsPro()
  const navigate = useNavigate()
  const { startUpgrade, loading: upgradeLoading } = useUpgradePro()

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
    if (file.size > 5 * 1024 * 1024) { addToast('error', 'Image must be under 5MB'); return }
    setUploadingPhoto(true)
    try {
      await updatePhotoURL(file)
      addToast('success', 'Profile photo updated!')
    } catch (err) {
      console.error('Photo upload:', err)
      addToast('error', 'Failed to upload photo')
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
      addToast('success', 'Profile photo removed')
    } catch (err) {
      console.error('Photo delete:', err)
      addToast('error', 'Failed to remove photo')
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
      addToast('success', 'Skills saved!')
    } catch (e) {
      console.error('Save skills:', e)
      addToast('error', 'Failed to save skills')
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
      addToast('success', 'Profile updated!')
    } catch (e) {
      console.error('Save profile:', e)
      addToast('error', 'Failed to save')
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

  const checks = profileCompletionChecks({ profile, user }).map(([done]) => done)
  const profileScore = computeProfileScore({ profile, user })
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
      addToast('success', 'Education saved!')
    } catch (e) {
      console.error('Save education:', e)
      addToast('error', 'Failed to save education')
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
      addToast('success', 'Education removed')
    } catch (e) {
      console.error('Delete education:', e)
      addToast('error', 'Failed to remove education')
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
      addToast('success', 'Experience saved!')
    } catch (e) {
      console.error('Save experience:', e)
      addToast('error', 'Failed to save experience')
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
      addToast('success', 'Experience removed')
    } catch (e) {
      console.error('Delete experience:', e)
      addToast('error', 'Failed to remove experience')
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
      addToast('success', 'Internship saved!')
    } catch (e) {
      console.error('Save internship:', e)
      addToast('error', 'Failed to save internship')
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
      addToast('success', 'Internship removed')
    } catch (e) {
      console.error('Delete internship:', e)
      addToast('error', 'Failed to remove internship')
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
      addToast('success', 'Project saved!')
    } catch (e) {
      console.error('Save project:', e)
      addToast('error', 'Failed to save project')
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
      addToast('success', 'Project removed')
    } catch (e) {
      console.error('Delete project:', e)
      addToast('error', 'Failed to remove project')
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
      addToast('success', nextFresher ? 'Marked as fresher' : 'Ready to add experience')
    } catch (e) {
      console.error('Set fresher:', e)
      addToast('error', 'Failed to update')
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

  if (loading) return <Loader variant="section" label="Loading profile…" />

  return (
    <>
      <div className="min-w-0 space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-500/5 py-0">
        <CardContent className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <ProfileAvatarBlock
            name={name}
            photoURL={user?.photoURL}
            profileScore={profileScore}
            uploadingPhoto={uploadingPhoto}
            photoRef={photoRef}
            onPickPhoto={() => photoRef.current?.click()}
            onRemovePhoto={handlePhotoDelete}
            onPhotoChange={handlePhotoUpload}
          />

          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1
                  className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                  title="Name is set during onboarding and can’t be changed"
                >
                  <span>{name}</span>
                  <Badge variant="outline" className="text-[0.65rem] font-semibold uppercase tracking-wide">
                    <AppIcon name="lock" className="size-3" /> locked
                  </Badge>
                </h1>
                {headline && <p className="mt-1 text-base font-semibold text-foreground">{headline}</p>}
                {currentRole && <p className="text-sm font-medium text-muted-foreground">{currentRole}</p>}
                {currentCompany && <p className="text-sm text-muted-foreground">at {currentCompany}</p>}
                {collegeName && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <AppIcon name="graduation" className="size-3.5 shrink-0" />
                    <span className="font-medium">{degreeLine ? `${degreeLine} · ` : ''}{collegeName}{eduYearDisplay ? ` · Class of ${eduYearDisplay}` : ''}</span>
                  </p>
                )}
              </div>
              {lastUpdatedStr && (
                <p className="text-xs text-muted-foreground sm:text-right">
                  Profile last updated · <span className="font-semibold">{lastUpdatedStr}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profile completion</span>
                <span className={cn('font-bold tabular-nums', profileScore >= 80 ? 'text-emerald-500' : 'text-primary')}>{profileScore}%</span>
              </div>
              <Progress value={profileScore} className="gap-0 [&_[data-slot=progress-track]]:h-2" />
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-border pt-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AppIcon name="map-pin" className="size-3.5 shrink-0" />
                  <span>{personal.location || 'Add location'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AppIcon name="jobs" className="size-3.5 shrink-0" />
                  <span>
                    {isFresher
                      ? 'Fresher'
                      : currentDuration || (experienceList.some(experienceEntryHasContent)
                        ? `${experienceList.filter(experienceEntryHasContent).length} role${experienceList.filter(experienceEntryHasContent).length > 1 ? 's' : ''}`
                        : 'Add experience')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AppIcon name="credit-card" className="size-3.5 shrink-0" />
                  <span className={prefs.expectedCTC ? 'font-semibold text-foreground' : ''}>{prefs.expectedCTC || 'Add expected CTC'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AppIcon name="phone" className="size-3.5 shrink-0" />
                  <span>{personal.phone || 'Add phone'}</span>
                  {personal.phone && <span className="text-emerald-500" title="Verified">✓</span>}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AppIcon name="envelope" className="size-3.5 shrink-0" />
                  <span className="truncate">{user?.email || '—'}</span>
                  {user?.email && <span className="text-emerald-500" title="Verified">✓</span>}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AppIcon name="calendar" className="size-3.5 shrink-0" />
                  <span>{prefs.noticePeriod ? `${prefs.noticePeriod} notice period` : 'Add notice period'}</span>
                </div>
              </div>
            </div>

            {profileScore < 100 && (
              <div className="rounded-xl border border-dashed border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <AppIcon name="lightbulb" className="inline size-3.5" /> Next: <span className="font-semibold text-foreground">{nextTip}</span>
              </div>
            )}
          </div>
        </div>
        </CardContent>
      </Card>

      <div className={cn('grid gap-6', isLg ? 'grid-cols-[220px_minmax(0,1fr)]' : 'grid-cols-1')}>
        {isLg && (
        <aside>
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Quick links</h3>
            <ul className="flex flex-col gap-0.5">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    className="flex items-center rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        )}

        <div className="flex min-w-0 flex-col gap-4">
      <ProfileCard id="profile-personal" className="scroll-mt-20"
        title="Personal Information" titleIcon="id-card"
        action={!personalEmpty ? <Button variant="ghost" size="sm" onClick={() => startEdit('personal')}>Edit</Button> : null}
      >
          {personalEmpty ? (
            <ProfileEmptyState
              icon="applications"
              message="Add your personal details — phone, location, gender, languages"
              actionLabel="+ Add details"
              onAction={() => startEdit('personal')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <ProfileFieldRow label="Phone">{personal.phone || '—'}</ProfileFieldRow>
              <ProfileFieldRow label="Location">{personal.location || '—'}</ProfileFieldRow>
              <ProfileFieldRow label="Gender">{personal.gender || '—'}</ProfileFieldRow>
              <ProfileFieldRow label="Date of Birth">{personal.dob || '—'}</ProfileFieldRow>
              <ProfileFieldRow label="Languages" className="sm:col-span-2">{personalLanguagesDisplay || '—'}</ProfileFieldRow>
            </div>
          )}
      </ProfileCard>

      <ProfileSectionGrid isWide={isLg}>
        {/* Education */}
        <ProfileCard id="profile-education" className="scroll-mt-20"
        title="Education" titleIcon="interview"
        action={!educationEmpty ? <Button size="sm" onClick={openAddEducation}>+ Add</Button> : null}
      >
            {educationEmpty ? (
              <ProfileEmptyState
                icon="graduation"
                message="Add 10th, 12th, degree, masters — one qualification at a time"
                actionLabel="+ Add education"
                onAction={openAddEducation}
              />
            ) : (
              educationList.filter(educationEntryHasContent).map((entry, i, arr) => (
                <ProfileEntryBlock
                  key={entry.id}
                  isLast={i >= arr.length - 1}
                  actions={(
                    <>
                      <Button variant="ghost" size="sm" onClick={() => openEditEducation(entry)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteEducationEntry(entry.id)} disabled={saving} aria-label="Remove"><AppIcon name="x" className="size-3.5" /></Button>
                    </>
                  )}
                >
                  <p className="text-sm font-bold">{educationEntryTitle(entry)}</p>
                  {educationEntrySubtitle(entry) && <p className="mt-0.5 text-xs text-primary">{educationEntrySubtitle(entry)}</p>}
                  {formatDateRange(entry.educationStart, entry.educationEnd, '') && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateRange(entry.educationStart, entry.educationEnd, '')}</p>
                  )}
                  {entry.marks && (
                    <p className="mt-1 text-xs text-foreground">{entry.gradingSystem ? `${entry.gradingSystem}: ` : ''}{entry.marks}</p>
                  )}
                  {entry.primaryGraduation && (
                    <Badge variant="outline" className="mt-1.5 rounded-full border-primary/20 bg-primary/10 text-[0.65rem] text-primary">Primary graduation</Badge>
                  )}
                </ProfileEntryBlock>
              ))
            )}
      </ProfileCard>

        <ProfileCard id="profile-skills" className="scroll-mt-20"
        title="Skills" titleIcon="wrench"
        action={!skillsEmpty ? <Button variant="ghost" size="sm" onClick={openSkillsEdit}>Edit</Button> : null}
      >
            {skillsEmpty ? (
              <ProfileEmptyState icon="target" message="Add your technical & soft skills" actionLabel="+ Add skills" onAction={openSkillsEdit} />
            ) : (
              <div className="space-y-4">
                {skillsTechnical.length > 0 && (
                  <SkillGroup label="Technical">
                    {skillsTechnical.map(s => (
                      <Badge key={s} variant="outline" className="rounded-full border-primary/20 bg-primary/10 font-semibold text-primary">{s}</Badge>
                    ))}
                  </SkillGroup>
                )}
                {skillsSoft.length > 0 && (
                  <SkillGroup label="Soft skills" tone="emerald">
                    {skillsSoft.map(s => (
                      <Badge key={s} variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400">{s}</Badge>
                    ))}
                  </SkillGroup>
                )}
              </div>
            )}
      </ProfileCard>
      </ProfileSectionGrid>

      <ProfileSectionGrid isWide={isLg}>
        {/* Experience */}
        <ProfileCard id="profile-experience" className="scroll-mt-20"
        title="Experience" titleIcon="jobs"
        action={!isFresher && !experienceEmpty ? <Button size="sm" onClick={openAddExperience}>+ Add</Button> : null}
      >
            <FresherToggle isFresher={isFresher} saving={saving} onToggle={setFresherStatus} />

            {isFresher ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Add internships and projects in the sections below.</p>
            ) : experienceEmpty ? (
              <ProfileEmptyState icon="jobs" message="Add each job one at a time — company, role, and dates" actionLabel="+ Add experience" onAction={openAddExperience} />
            ) : (
              experienceList.filter(experienceEntryHasContent).map((entry, i, arr) => {
                const preview = experienceEntryPreview(entry)
                const hasDetails = experienceHasDetails(entry)
                return (
                  <ProfileEntryBlock
                    key={entry.id}
                    isLast={i >= arr.length - 1}
                    actions={(
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEditExperience(entry)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteExperienceEntry(entry.id)} disabled={saving} aria-label="Remove"><AppIcon name="x" className="size-3.5" /></Button>
                      </>
                    )}
                  >
                    <p className="text-sm font-bold leading-snug">{entry.company}</p>
                    <p className="mt-0.5 text-xs text-primary">{experienceEntrySubtitle(entry)}</p>
                    {preview && <ProfilePreviewText>{preview}</ProfilePreviewText>}
                    {hasDetails && (
                      <Button variant="ghost" size="sm" className="mt-2 h-auto px-2 py-0.5 text-xs" onClick={() => openViewExperience(entry)}>View details</Button>
                    )}
                  </ProfileEntryBlock>
                )
              })
            )}
      </ProfileCard>

        <ProfileCard id="profile-preferences" className="scroll-mt-20"
        title="Preferences & Salary" titleIcon="settings"
        action={!preferencesEmpty ? <Button variant="ghost" size="sm" onClick={() => startEdit('preferences')}>Edit</Button> : null}
      >
            {preferencesEmpty ? (
              <ProfileEmptyState icon="salary" message="Set your job type, location & salary expectations" actionLabel="+ Set preferences" onAction={() => startEdit('preferences')} />
            ) : (
              <div className="space-y-0">
                <ProfileFieldRow label="Job Type">{prefs.jobType || '—'}</ProfileFieldRow>
                <ProfileFieldRow label="Location">{(prefs.preferredLocations || []).join(', ') || '—'}</ProfileFieldRow>
                <ProfileFieldRow label="Expected CTC"><span className="font-bold text-emerald-500">{prefs.expectedCTC || '—'}</span></ProfileFieldRow>
                <ProfileFieldRow label="Notice Period">{prefs.noticePeriod || '—'}</ProfileFieldRow>
                <ProfileFieldRow label="LinkedIn">{links.linkedin ? <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary"><AppIcon name="link" className="inline size-3" /> View</a> : '—'}</ProfileFieldRow>
                <ProfileFieldRow label="GitHub">{links.github ? <a href={links.github} target="_blank" rel="noopener noreferrer" className="text-primary"><AppIcon name="link" className="inline size-3" /> View</a> : '—'}</ProfileFieldRow>
              </div>
            )}
      </ProfileCard>
      </ProfileSectionGrid>

      <ProfileCard id="profile-projects" className="scroll-mt-20"
        title="Projects" titleIcon="rocket"
        action={!projectsEmpty ? <Button size="sm" onClick={openAddProject}>+ Add</Button> : null}
      >
          {projectsEmpty ? (
            <ProfileEmptyState icon="rocket" message="Add your key projects — crucial for freshers" actionLabel="+ Add project" onAction={openAddProject} />
          ) : (
            projectList.filter(projectHasContent).map((entry, i, arr) => {
              const preview = projectEntryPreview(entry)
              const hasDetails = projectHasDetails(entry)
              const subtitle = projectEntrySubtitle(entry)
              return (
                <ProfileEntryBlock
                  key={entry.id}
                  isLast={i >= arr.length - 1}
                  actions={(
                    <>
                      <Button variant="ghost" size="sm" onClick={() => openEditProject(entry)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteProjectEntry(entry.id)} disabled={saving} aria-label="Remove"><AppIcon name="x" className="size-3.5" /></Button>
                    </>
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold leading-snug">{entry.title}</p>
                    {entry.url?.trim() && (
                      <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-primary"><AppIcon name="link" className="size-3" /></a>
                    )}
                  </div>
                  {subtitle && <p className="mt-0.5 text-xs text-primary">{subtitle}</p>}
                  {preview && <ProfilePreviewText>{preview}</ProfilePreviewText>}
                  {hasDetails && (
                    <Button variant="ghost" size="sm" className="mt-2 h-auto px-2 py-0.5 text-xs" onClick={() => openViewProject(entry)}>View details</Button>
                  )}
                </ProfileEntryBlock>
              )
            })
          )}
      </ProfileCard>

      <ProfileSectionGrid isWide={isLg}>
        <ProfileCard id="profile-internships" className="scroll-mt-20"
        title="Internships" titleIcon="graduation"
        action={!internshipsEmpty ? <Button size="sm" onClick={openAddInternship}>+ Add</Button> : null}
      >
            {internshipsEmpty ? (
              <ProfileEmptyState icon="buildings" message="Add your internship experiences" actionLabel="+ Add internship" onAction={openAddInternship} />
            ) : (
              internshipList.filter(internshipHasContent).map((entry, i, arr) => {
                const preview = internshipEntryPreview(entry)
                const hasDetails = internshipHasDetails(entry)
                return (
                  <ProfileEntryBlock
                    key={entry.id}
                    isLast={i >= arr.length - 1}
                    actions={(
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEditInternship(entry)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteInternshipEntry(entry.id)} disabled={saving} aria-label="Remove"><AppIcon name="x" className="size-3.5" /></Button>
                      </>
                    )}
                  >
                    <p className="text-sm font-bold leading-snug">{entry.company}</p>
                    <p className="mt-0.5 text-xs text-primary">{internshipEntrySubtitle(entry)}</p>
                    {preview && <ProfilePreviewText>{preview}</ProfilePreviewText>}
                    {hasDetails && (
                      <Button variant="ghost" size="sm" className="mt-2 h-auto px-2 py-0.5 text-xs" onClick={() => openViewInternship(entry)}>View details</Button>
                    )}
                  </ProfileEntryBlock>
                )
              })
            )}
      </ProfileCard>

        <ProfileCard id="profile-certifications" className="scroll-mt-20"
        title="Certifications" titleIcon="trophy"
        action={!certsEmpty ? <Button variant="ghost" size="sm" onClick={() => startEdit('certifications')}>Edit</Button> : null}
      >
            {certsEmpty ? (
              <ProfileEmptyState icon="scroll" message="Add your certifications & courses" actionLabel="+ Add certification" onAction={() => startEdit('certifications')} />
            ) : (
              certs.filter(c => c.name).map((c, idx, arr) => (
                <ProfileEntryBlock key={c.id || idx} isLast={idx >= arr.length - 1}>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold">{c.name}</p>
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary"><AppIcon name="link" className="size-3" /></a>}
                  </div>
                  <p className="mt-0.5 text-xs text-amber-500">{c.issuer}{c.year ? ` · ${formatYearOrMonthDisplay(c.year)}` : ''}</p>
                </ProfileEntryBlock>
              ))
            )}
      </ProfileCard>
      </ProfileSectionGrid>

      <ProfileCard id="profile-summary" className="scroll-mt-20"
        title="Professional Summary" titleIcon="pencil"
        action={!summaryEmpty ? <Button variant="ghost" size="sm" onClick={() => startEdit('summary')}>Edit</Button> : null}
      >
          {summaryEmpty ? (
            <ProfileEmptyState icon="grammar-check" message="Add a headline + 2–3 line summary for recruiters" actionLabel="+ Add summary" onAction={() => startEdit('summary')} />
          ) : (
            <>
              {headline && <p className="text-base font-semibold text-foreground">{headline}</p>}
              {summary && <p className="mt-2 text-sm leading-relaxed text-foreground">{summary}</p>}
            </>
          )}
      </ProfileCard>

      <ProfileCard id="profile-ai-review" className="scroll-mt-20 overflow-visible"
        title="AI Profile Review" titleIcon="robot"
        action={(
          isPro ? (
          <Button size="sm" disabled={reviewLoading} onClick={async () => {
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
              addToast('success', 'AI review ready!')
            } catch (err) {
              console.error('Profile review error:', err)
              addToast('error', 'Failed to get AI review')
            }
            setReviewLoading(false)
          }}>
            {reviewLoading ? 'Analyzing…' : aiReview ? 'Re-analyze' : 'Get AI Review'}
          </Button>
          ) : (
          <Button size="sm" variant="outline" disabled={upgradeLoading} onClick={() => void startUpgrade({ plan: 'yearly' })}>
            <AppIcon name="lock" className="size-3.5" />
            {upgradeLoading ? 'Opening…' : 'Upgrade for AI Review'}
          </Button>
          )
        )}
      >
          {!aiReview && !reviewLoading && !isPro && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <AppIcon name="lock" className="size-10 text-primary/70" />
              <p className="text-sm font-semibold text-foreground">AI Profile Review is a Pro feature</p>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Upgrade to Glowminds Pro for AI-powered feedback on skills, gaps, and your summary.
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>View pricing</Button>
            </div>
          )}

          {!aiReview && !reviewLoading && isPro && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <AppIcon name="robot" className="size-10 text-muted-foreground/60" />
              <p className="text-sm font-semibold text-foreground">Get AI-powered profile feedback</p>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Glowminds AI will analyze your profile and suggest skills to learn, areas to improve, and provide a polished summary you can copy.
              </p>
            </div>
          )}

          {reviewLoading && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AppIcon name="brain" className="size-10 text-muted-foreground/60" />
              <p className="text-sm font-semibold text-foreground">Analyzing your profile…</p>
              <p className="text-xs text-muted-foreground">This takes a few seconds</p>
            </div>
          )}

          {aiReview && !reviewLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <AiScoreBadge score={aiReview.overallScore} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground">{aiReview.verdict}</p>
                  <p className="text-sm text-muted-foreground">AI Profile Score</p>
                  {aiReview.lastReviewedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last reviewed: {new Date(aiReview.lastReviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {aiReview.strengths?.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-500"><AppIcon name="check-circle" className="inline size-3" /> Strengths</p>
                    {aiReview.strengths.map((s, i) => (
                      <p key={i} className="py-0.5 text-sm leading-relaxed text-foreground">• {s}</p>
                    ))}
                  </div>
                )}
                {aiReview.weaknesses?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-500"><AppIcon name="warning" className="inline size-3" /> Areas to improve</p>
                    {aiReview.weaknesses.map((w, i) => (
                      <p key={i} className="py-0.5 text-sm leading-relaxed text-foreground">• {w}</p>
                    ))}
                  </div>
                )}
              </div>

              {aiReview.skillSuggestions?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary"><AppIcon name="lightbulb" className="inline size-3" /> Recommended skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiReview.skillSuggestions.map((s, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={cn(
                          'rounded-lg text-xs font-semibold',
                          s.priority === 'high'
                            ? 'border-primary/25 bg-primary/10 text-primary'
                            : 'border-border bg-muted/50 text-muted-foreground',
                        )}
                        title={s.reason}
                      >
                        {s.skill}
                        {s.priority === 'high' && <AppIcon name="fire" className="ms-1 inline size-3" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {aiReview.tips?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-500"><AppIcon name="target" className="inline size-3" /> Action items</p>
                  <div className="divide-y divide-border rounded-xl border border-border">
                    {aiReview.tips.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2">
                        <Badge variant="outline" className={cn(
                          'shrink-0 text-[0.65rem] uppercase',
                          t.impact === 'high' ? 'border-primary/25 bg-primary/10 text-primary' : t.impact === 'medium' ? 'border-amber-500/25 bg-amber-500/10 text-amber-500' : 'text-muted-foreground',
                        )}>{t.category}</Badge>
                        <span className="text-sm leading-relaxed text-foreground">{t.tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiReview.summaryDraft && (
                <div className="rounded-xl border border-border bg-muted/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-500"><AppIcon name="grammar-check" className="inline size-3" /> Suggested summary</p>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(aiReview.summaryDraft); addToast('success', 'Summary copied!') }}>Copy</Button>
                  </div>
                  <p className="text-sm italic leading-relaxed text-foreground">&ldquo;{aiReview.summaryDraft}&rdquo;</p>
                </div>
              )}
            </div>
          )}
      </ProfileCard>

        </div>
      </div>
      </div>

      <AppDialog
        open={editing === 'personal'}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Personal Information" titleIcon="id-card"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button  disabled={saving} onClick={() => saveSection({
              personal: {
                phone: form.phone || '', location: form.location || '', gender: form.gender || '', dob: form.dob || '',
                languages: fromCsv(form.languages),
              },
            })}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <FormRow>
          <FormField label="Phone">
            <Input placeholder="Phone (optional)" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="Location">
            <Input placeholder="Bangalore, India" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField label="Gender">
            <Select value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option>
            </Select>
          </FormField>
          <FormField label="Date of Birth">
            <Input type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} />
          </FormField>
        </FormRow>
        <FormField label="Languages (comma-separated)">
          <Input placeholder="English, Hindi, Telugu…" value={form.languages || ''} onChange={e => setForm({ ...form, languages: e.target.value })} />
        </FormField>
      </AppDialog>

      <AppDialog
        open={editing === 'skills'}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit Skills" titleIcon="wrench"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button  disabled={saving} onClick={saveSkills}>{saving ? 'Saving…' : 'Save Skills'}</Button>
          </>
        }
      >
        <FormField label="Technical Skills">
          <div className="flex flex-wrap gap-[6px] mb-2">
            {skillsDraft.technical.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="cursor-pointer rounded-full font-semibold border-primary/20 bg-primary/10 text-primary"
                onClick={() => setSkillsDraft((d) => ({ ...d, technical: d.technical.filter((x) => x !== s) }))}
              >
                {s} ✕
              </Badge>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Input
              placeholder="e.g. React, Python, AWS…"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) { e.preventDefault(); const v = skillInput.trim(); setSkillsDraft((d) => ({ ...d, technical: d.technical.includes(v) ? d.technical : [...d.technical, v] })); setSkillInput('') } }}
            />
            <Button size="sm" type="button" onClick={() => { if (skillInput.trim()) { const v = skillInput.trim(); setSkillsDraft((d) => ({ ...d, technical: d.technical.includes(v) ? d.technical : [...d.technical, v] })); setSkillInput('') } }}>Add</Button>
          </div>
        </FormField>
        <FormField label="Soft Skills">
          <div className="flex flex-wrap gap-[6px] mb-2">
            {skillsDraft.soft.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="cursor-pointer rounded-full font-semibold border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                onClick={() => setSkillsDraft((d) => ({ ...d, soft: d.soft.filter((x) => x !== s) }))}
              >
                {s} ✕
              </Badge>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Input
              placeholder="e.g. Leadership, Communication…"
              value={softSkillInput}
              onChange={e => setSoftSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && softSkillInput.trim()) { e.preventDefault(); const v = softSkillInput.trim(); setSkillsDraft((d) => ({ ...d, soft: d.soft.includes(v) ? d.soft : [...d.soft, v] })); setSoftSkillInput('') } }}
            />
            <Button size="sm" type="button" onClick={() => { if (softSkillInput.trim()) { const v = softSkillInput.trim(); setSkillsDraft((d) => ({ ...d, soft: d.soft.includes(v) ? d.soft : [...d.soft, v] })); setSoftSkillInput('') } }}>Add</Button>
          </div>
        </FormField>
      </AppDialog>

      <AppDialog
        open={editing === 'certifications'}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit Certifications" titleIcon="trophy"
        size="lg"
        contentClassName="max-h-[400px] gap-4 overflow-auto"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button  disabled={saving} onClick={() => saveSection({
              certifications: (form.certifications || []).filter(c => c.name).map(c => ({ id: c.id || uid(), name: c.name || '', issuer: c.issuer || '', year: c.year || '', url: c.url || '' })),
            })}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        {(form.certifications || []).map((cert, i) => (
          <div key={cert.id || i} className="rounded-xl border border-border bg-muted p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Certification {i + 1}</span>
              {(form.certifications || []).length > 1 && (
                <Button variant="ghost" size="sm" className="h-auto px-0 text-xs"
                  onClick={() => setForm(f => ({ ...f, certifications: f.certifications.filter((_, j) => j !== i) }))}>Remove</Button>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              <FormField label="Certification Name *">
                <Input placeholder="AWS Cloud Practitioner" value={cert.name} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], name: e.target.value }; setForm({ ...form, certifications: u }) }} />
              </FormField>
              <FormRow>
                <FormField label="Issuer *">
                  <Input placeholder="Amazon, Google, Coursera…" value={cert.issuer} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], issuer: e.target.value }; setForm({ ...form, certifications: u }) }} />
                </FormField>
                <FormField label="Month / Year">
                  <Input type="month" value={toMonthInputValue(cert.year)} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], year: e.target.value ? e.target.value.slice(0, 7) : '' }; setForm({ ...form, certifications: u }) }} />
                </FormField>
              </FormRow>
              <FormField label="Certificate URL (optional)">
                <Input placeholder="https://credential.net/…" value={cert.url} onChange={e => { const u = [...form.certifications]; u[i] = { ...u[i], url: e.target.value }; setForm({ ...form, certifications: u }) }} />
              </FormField>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, certifications: [...(f.certifications || []), { id: uid(), name: '', issuer: '', year: '', url: '' }] }))}>+ Add Another Certification</Button>
      </AppDialog>

      <AppDialog
        open={editing === 'preferences'}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Preferences & Salary" titleIcon="settings"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button  disabled={saving} onClick={() => saveSection({
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
            })}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <FormField label="Job Type *">
          <Select value={form.jobType || ''} onChange={e => setForm({ ...form, jobType: e.target.value })}>
            <option value="">Select…</option><option>Full-time</option><option>Internship</option><option>Full-time / Internship</option><option>Contract</option><option>Part-time</option><option>Freelance</option>
          </Select>
        </FormField>
        <FormField label="Preferred Locations (comma-separated) *">
          <Input placeholder="Bangalore, Remote, Hyderabad…" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
        </FormField>
        <FormField label="Expected CTC / Salary *">
          <Input placeholder="6–12 LPA or $80K–$120K" value={form.expectedCTC || ''} onChange={e => setForm({ ...form, expectedCTC: e.target.value })} />
        </FormField>
        <FormField label="Notice Period">
          <Select value={form.noticePeriod || ''} onChange={e => setForm({ ...form, noticePeriod: e.target.value })}>
            <option value="">Select…</option><option>Immediate</option><option>15 days</option><option>30 days</option><option>60 days</option><option>90 days</option>
          </Select>
        </FormField>
        <FormField label="LinkedIn URL">
          <Input placeholder="https://linkedin.com/in/yourname" value={form.linkedin || ''} onChange={e => setForm({ ...form, linkedin: e.target.value })} />
        </FormField>
        <FormField label="GitHub URL">
          <Input placeholder="https://github.com/yourname" value={form.github || ''} onChange={e => setForm({ ...form, github: e.target.value })} />
        </FormField>
        <FormField label="Portfolio URL">
          <Input placeholder="https://yourname.dev" value={form.portfolio || ''} onChange={e => setForm({ ...form, portfolio: e.target.value })} />
        </FormField>
      </AppDialog>

      <AppDialog
        open={editing === 'summary'}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Professional Summary" titleIcon="pencil"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button  disabled={saving} onClick={() => saveSection({ headline: form.headline || '', summary: form.summary || '' })}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <FormField label="Headline (1 line)">
          <Input placeholder="B.Tech CS, aspiring SDE" value={form.headline || ''} onChange={e => setForm({ ...form, headline: e.target.value })} />
        </FormField>
        <FormField label="Summary (2–3 lines for recruiters)">
          <Textarea className="min-h-[100px]" placeholder="Motivated B.Tech graduate with strong skills in Python, React and cloud. Built 3 full-stack projects deployed to production. Seeking software engineering roles." value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} />
        </FormField>
      </AppDialog>

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

    </>
  )
}
