import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, setDoc, deleteDoc, collection, getDocs, getDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import useIsPro from '@/hooks/useIsPro'
import { parseResumeWithAI } from '@/services/resumeParser'
import '@/styles/forms.css'
import '@/styles/resume-preview.css'

const ease = [0.16, 1, 0.3, 1]

const SECTIONS = [
  { id: 'personal', label: 'Personal Info', icon: '👤', fields: ['name','title','email','phone','loc','li','gh'] },
  { id: 'summary', label: 'Summary', icon: '📝', fields: ['summary'] },
  { id: 'education', label: 'Education', icon: '🎓', fields: ['deg','col','yr','cgpa'] },
  { id: 'experience', label: 'Experience', icon: '💼', fields: ['exp'] },
  { id: 'projects', label: 'Projects', icon: '🚀', fields: ['projects'] },
  { id: 'skills', label: 'Skills', icon: '🛠️', fields: ['skills'] },
  { id: 'achievements', label: 'Achievements', icon: '🏆', fields: ['ach'] },
]

const TEMPLATES = [
  { id: 'classic', label: 'Classic', accent: '#1d4ed8', desc: 'Bold colored header, centered' },
  { id: 'modern', label: 'Modern', accent: '#059669', desc: 'Clean with accent border' },
  { id: 'minimal', label: 'Minimal', accent: '#334155', desc: 'Light & understated' },
  { id: 'professional', label: 'Professional', accent: '#1e40af', desc: 'Sidebar accent strip' },
  { id: 'creative', label: 'Creative', accent: '#7c3aed', desc: 'Gradient header, rounded' },
  { id: 'executive', label: 'Executive', accent: '#92400e', desc: 'Two-tone split, elegant' },
]

const COLORS = ['#1d4ed8','#059669','#dc2626','#7c3aed','#d97706','#0891b2','#be185d','#334155']

const EMPTY_FIELDS = { name:'', title:'', email:'', phone:'', loc:'', li:'', gh:'', summary:'', deg:'', col:'', yr:'', cgpa:'', exp:'', projects:'', skills:'', ach:'' }

export default function ResumeSection() {
  const { user, addToast } = useAppStore()
  const isPro = useIsPro()
  const previewRef = useRef(null)
  const fileRef = useRef(null)
  const [step, setStep] = useState('personal')
  const [tpl, setTpl] = useState('classic')
  const [accent, setAccent] = useState('#1d4ed8')
  const [exporting, setExporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savedList, setSavedList] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [resumeName, setResumeName] = useState('My Resume')

  const [f, setF] = useState({ ...EMPTY_FIELDS })

  const autoPopulateFromProfile = useCallback(async () => {
    if (!auth.currentUser) return
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (!snap.exists()) return
      const p = snap.data()
      setF(prev => ({
        ...prev,
        name: p.displayName || prev.name,
        email: p.email || prev.email,
        phone: p.phone || prev.phone,
        loc: p.location || prev.loc,
        li: p.linkedin || prev.li,
        gh: p.github || prev.gh,
        deg: p.education?.degree || prev.deg,
        col: p.education?.college || prev.col,
        yr: p.education?.year || prev.yr,
        cgpa: p.education?.cgpa || prev.cgpa,
        skills: p.skills?.join(', ') || prev.skills,
      }))
    } catch { /* ignore */ }
  }, [])

  // Load saved resumes on mount
  useEffect(() => {
    if (!auth.currentUser) return
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'resumes'))
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
        setSavedList(list)
        if (list.length > 0) {
          const latest = list[0]
          setF(latest.fields || { ...EMPTY_FIELDS })
          setTpl(latest.template || 'classic')
          setAccent(latest.accent || '#1d4ed8')
          setResumeName(latest.name || 'My Resume')
          setActiveId(latest.id)
        } else {
          await autoPopulateFromProfile()
        }
      } catch (e) {
        console.error('Load resumes:', e)
      }
    }
    load()
  }, [user, autoPopulateFromProfile])

  const saveResume = async () => {
    if (!auth.currentUser) return
    setSaving(true)
    try {
      const id = activeId || `resume_${Date.now()}`
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'resumes', id), {
        name: resumeName,
        fields: f,
        template: tpl,
        accent,
        updatedAt: serverTimestamp(),
      })
      setActiveId(id)
      // refresh list
      const snap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'resumes'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
      setSavedList(list)
      addToast('success', '✅ Resume saved!')
    } catch (e) {
      console.error('Save resume:', e)
      addToast('error', '⚠️ Failed to save resume')
    }
    setSaving(false)
  }

  const loadResume = (r) => {
    setF(r.fields || { ...EMPTY_FIELDS })
    setTpl(r.template || 'classic')
    setAccent(r.accent || '#1d4ed8')
    setResumeName(r.name || 'My Resume')
    setActiveId(r.id)
    setStep('personal')
    addToast('info', `📄 Loaded: ${r.name || 'Resume'}`)
  }

  const deleteResume = async (id) => {
    if (!auth.currentUser) return
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'resumes', id))
      setSavedList(prev => prev.filter(r => r.id !== id))
      if (activeId === id) {
        setF({ ...EMPTY_FIELDS })
        setActiveId(null)
        setResumeName('My Resume')
      }
      addToast('info', '🗑️ Resume deleted')
    } catch (e) {
      console.error('Delete resume:', e)
      addToast('error', '⚠️ Failed to delete')
    }
  }

  const newResume = () => {
    setF({ ...EMPTY_FIELDS })
    setActiveId(null)
    setResumeName('New Resume')
    setStep('personal')
    setTpl('classic')
    setAccent('#1d4ed8')
    addToast('info', '📝 New resume started')
  }

  const g = (k) => f[k] || ''
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const sks = g('skills').split(',').map(s => s.trim()).filter(Boolean)
  const secIdx = SECTIONS.findIndex(s => s.id === step)

  const isSectionDone = (sec) => sec.fields.some(fld => !!g(fld))
  const filled = SECTIONS.filter(isSectionDone).length
  const score = Math.min(100, Math.round(filled / SECTIONS.length * 100))

  const goNext = () => { if (secIdx < SECTIONS.length - 1) setStep(SECTIONS[secIdx + 1].id) }
  const goPrev = () => { if (secIdx > 0) setStep(SECTIONS[secIdx - 1].id) }

  const downloadPDF = useCallback(async () => {
    if (!previewRef.current) return
    setExporting(true)
    addToast('info', '📥 Generating PDF…')
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')
      const el = previewRef.current
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pW = pdf.internal.pageSize.getWidth()
      const pH = pdf.internal.pageSize.getHeight()
      const imgW = pW - 16
      const imgH = (canvas.height * imgW) / canvas.width
      let yOff = 8
      if (imgH <= pH - 16) {
        pdf.addImage(imgData, 'PNG', 8, yOff, imgW, imgH)
      } else {
        let remaining = imgH
        let srcY = 0
        while (remaining > 0) {
          const sliceH = Math.min(pH - 16, remaining)
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = Math.round((sliceH / imgH) * canvas.height)
          const ctx = sliceCanvas.getContext('2d')
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height)
          pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 8, 8, imgW, sliceH)
          remaining -= sliceH
          srcY += sliceCanvas.height
          if (remaining > 0) pdf.addPage()
        }
      }
      pdf.save(`${(f.name || '').trim() || 'Resume'}.pdf`)
      addToast('success', '✅ PDF downloaded!')
    } catch (e) {
      console.error('PDF export:', e)
      addToast('error', '⚠️ PDF export failed')
    }
    setExporting(false)
  }, [f, addToast])

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    addToast('info', `📄 Parsing "${file.name}" with AI…`)
    try {
      const parsed = await parseResumeWithAI(file)
      setF(prev => {
        const merged = { ...prev }
        for (const [k, v] of Object.entries(parsed)) {
          if (v && v.trim()) merged[k] = v
        }
        return merged
      })
      addToast('success', '✅ Resume parsed! Fields have been filled.')
      setStep('personal')
    } catch (err) {
      console.error('Upload parse error:', err)
      addToast('error', `⚠️ ${err.message || 'Failed to parse resume'}`)
    }
    setUploading(false)
  }, [addToast])

  const handleClear = () => {
    setF({ ...EMPTY_FIELDS })
    setStep('personal')
    addToast('info', '🗑️ All fields cleared')
  }

  const renderForm = () => {
    switch (step) {
      case 'personal': return (<>
        <div className="rb-form-title">👤 Personal Information</div>
        <div className="rb-form-desc">Start with the basics — this appears at the top of your resume.</div>
        <div className="fg2">
          <div className="fg"><label className="fl">Full Name *</label><input className="fi" value={g('name')} onChange={e => set('name', e.target.value)} placeholder="John Doe" /></div>
          <div className="fg"><label className="fl">Job Title *</label><input className="fi" value={g('title')} onChange={e => set('title', e.target.value)} placeholder="Software Engineer" /></div>
        </div>
        <div className="fg2">
          <div className="fg"><label className="fl">Email *</label><input className="fi" type="email" value={g('email')} onChange={e => set('email', e.target.value)} placeholder="john@email.com" /></div>
          <div className="fg"><label className="fl">Phone</label><input className="fi" value={g('phone')} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
        </div>
        <div className="fg2">
          <div className="fg"><label className="fl">Location</label><input className="fi" value={g('loc')} onChange={e => set('loc', e.target.value)} placeholder="Bangalore, India" /></div>
          <div className="fg"><label className="fl">LinkedIn</label><input className="fi" value={g('li')} onChange={e => set('li', e.target.value)} placeholder="linkedin.com/in/username" /></div>
        </div>
        <div className="fg"><label className="fl">GitHub</label><input className="fi" value={g('gh')} onChange={e => set('gh', e.target.value)} placeholder="github.com/username" /></div>
      </>)
      case 'summary': return (<>
        <div className="rb-form-title">📝 Professional Summary</div>
        <div className="rb-form-desc">Write 2–4 sentences highlighting your experience, skills, and career goals. This is the first thing recruiters read.</div>
        <div className="fg"><label className="fl">Summary *</label><textarea className="fta" style={{ minHeight: 140 }} value={g('summary')} onChange={e => set('summary', e.target.value)} placeholder="Motivated B.Tech graduate with strong skills in…" /></div>
      </>)
      case 'education': return (<>
        <div className="rb-form-title">🎓 Education</div>
        <div className="rb-form-desc">Add your most recent education. Include CGPA if it's above 7.5.</div>
        <div className="fg2">
          <div className="fg"><label className="fl">Degree & Branch *</label><input className="fi" value={g('deg')} onChange={e => set('deg', e.target.value)} placeholder="B.Tech Computer Science" /></div>
          <div className="fg"><label className="fl">College / University *</label><input className="fi" value={g('col')} onChange={e => set('col', e.target.value)} placeholder="IIT Delhi" /></div>
        </div>
        <div className="fg2">
          <div className="fg"><label className="fl">Graduation Year</label><input className="fi" value={g('yr')} onChange={e => set('yr', e.target.value)} placeholder="2024" /></div>
          <div className="fg"><label className="fl">CGPA / Percentage</label><input className="fi" value={g('cgpa')} onChange={e => set('cgpa', e.target.value)} placeholder="8.7" /></div>
        </div>
      </>)
      case 'experience': return (<>
        <div className="rb-form-title">💼 Experience & Internships</div>
        <div className="rb-form-desc">List your work experience with bullet points. Use action verbs like "Developed", "Built", "Improved".</div>
        <div className="fg"><label className="fl">Experience *</label><textarea className="fta" style={{ minHeight: 180 }} value={g('exp')} onChange={e => set('exp', e.target.value)} placeholder={"Company | Role | Duration\n• Built REST APIs using Node.js\n• Improved query performance by 30%"} /></div>
      </>)
      case 'projects': return (<>
        <div className="rb-form-title">🚀 Projects</div>
        <div className="rb-form-desc">Showcase 2–3 key projects with tech stack and impact. This is crucial for freshers.</div>
        <div className="fg"><label className="fl">Projects</label><textarea className="fta" style={{ minHeight: 160 }} value={g('projects')} onChange={e => set('projects', e.target.value)} placeholder={"E-Commerce App — React + Node + MongoDB\n• Served 150+ users; integrated Razorpay\n• Deployed on AWS EC2 with CI/CD"} /></div>
      </>)
      case 'skills': return (<>
        <div className="rb-form-title">🛠️ Skills</div>
        <div className="rb-form-desc">Add skills separated by commas. Include both technical and soft skills. Mirror keywords from job descriptions.</div>
        <div className="fg"><label className="fl">Skills (comma-separated) *</label><textarea className="fta" style={{ minHeight: 120 }} value={g('skills')} onChange={e => set('skills', e.target.value)} placeholder="Python, JavaScript, React, Node.js, SQL, AWS, Docker, Git" /></div>
      </>)
      case 'achievements': return (<>
        <div className="rb-form-title">🏆 Achievements & Certifications</div>
        <div className="rb-form-desc">Awards, certifications, hackathon wins, competitive programming ranks — anything that makes you stand out.</div>
        <div className="fg"><label className="fl">Achievements</label><textarea className="fta" style={{ minHeight: 140 }} value={g('ach')} onChange={e => set('ach', e.target.value)} placeholder={"• AWS Certified Cloud Practitioner (2024)\n• Winner — HackFest National Hackathon 2023\n• Top 100 — TCS CodeVita Round 2"} /></div>
      </>)
      default: return null
    }
  }

  return (
    <>
      {/* Top Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="dsh-title">Resume Builder</div>
          <div className="dsh-sub" style={{ marginBottom: 0 }}>Build a professional resume step by step</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Resume name input */}
          <input
            value={resumeName}
            onChange={e => setResumeName(e.target.value)}
            style={{ fontSize: '.74rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-bdr)', background: 'var(--color-surf)', color: 'var(--color-txt)', width: 130 }}
          />
          <button className="btn btn-p btn-sm" onClick={saveResume} disabled={saving} title="Save to cloud">
            {saving ? '⏳' : '💾'} Save
          </button>
          {(isPro || savedList.length < 1) && (
            <button className="btn btn-o btn-sm" onClick={newResume} title="Start new resume">➕ New</button>
          )}
          {!isPro && savedList.length >= 1 && (
            <button className="btn btn-gh btn-sm" onClick={() => addToast('info', '⚡ Upgrade to Pro for unlimited resumes')} title="Pro feature" style={{ opacity: .6 }}>🔒 New (Pro)</button>
          )}
          {savedList.length > 1 && (
            <select
              value={activeId || ''}
              onChange={e => { const r = savedList.find(s => s.id === e.target.value); if (r) loadResume(r) }}
              style={{ fontSize: '.72rem', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-bdr)', background: 'var(--color-surf)', color: 'var(--color-txt)' }}
            >
              {savedList.map(r => <option key={r.id} value={r.id}>{r.name || 'Resume'}</option>)}
            </select>
          )}
          <div style={{ width: 1, height: 20, background: 'var(--color-bdr)' }} />
          <span style={{ fontSize: '.72rem', color: 'var(--color-muted)', fontWeight: 600 }}>{score}% complete</span>
          <div style={{ width: 80, height: 5, background: 'var(--color-bg3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score}%`, background: score === 100 ? 'var(--color-grn)' : 'var(--color-blu)', borderRadius: 3, transition: 'width .4s' }} />
          </div>
        </div>
      </motion.div>

      {/* Toolbar */}
      <div className="rb-toolbar" style={{ borderRadius: '14px 14px 0 0' }}>
        <div className="rb-toolbar-left">
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-muted)' }}>Template:</span>
          {TEMPLATES.map(t => (
            <button key={t.id} className={`rb-tpl-btn${tpl === t.id ? ' active' : ''}`}
              onClick={() => { setTpl(t.id); setAccent(t.accent) }} title={`${t.label} — ${t.desc}`}>
              <div className="rb-tpl-inner">
                {t.id === 'professional' ? (
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: '25%', background: t.accent }} />
                    <div className="rb-tpl-bd" style={{ flex: 1 }}>
                      <div className="rb-tpl-ln" /><div className="rb-tpl-ln" style={{ width: '70%' }} /><div className="rb-tpl-ln" /><div className="rb-tpl-ln" style={{ width: '50%' }} />
                    </div>
                  </div>
                ) : t.id === 'creative' ? (
                  <>
                    <div className="rb-tpl-hd" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}88)`, borderRadius: '0 0 6px 6px' }} />
                    <div className="rb-tpl-bd">
                      <div className="rb-tpl-ln" style={{ borderRadius: 4 }} /><div className="rb-tpl-ln" style={{ width: '60%', borderRadius: 4 }} /><div className="rb-tpl-ln" style={{ borderRadius: 4 }} />
                    </div>
                  </>
                ) : t.id === 'executive' ? (
                  <>
                    <div className="rb-tpl-hd" style={{ background: '#1a1a1a', borderBottom: `2px solid ${t.accent}` }} />
                    <div className="rb-tpl-bd">
                      <div className="rb-tpl-ln" style={{ background: t.accent, opacity: .5 }} /><div className="rb-tpl-ln" /><div className="rb-tpl-ln" style={{ width: '70%' }} /><div className="rb-tpl-ln" style={{ width: '40%' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rb-tpl-hd" style={{ background: t.id === 'classic' ? t.accent : t.id === 'modern' ? '#fff' : '#f5f5f5', borderBottom: t.id === 'modern' ? `2px solid ${t.accent}` : 'none' }} />
                    <div className="rb-tpl-bd">
                      <div className="rb-tpl-ln" /><div className="rb-tpl-ln" style={{ width: '70%' }} /><div className="rb-tpl-ln" /><div className="rb-tpl-ln" style={{ width: '50%' }} />
                    </div>
                  </>
                )}
              </div>
            </button>
          ))}
          <div style={{ width: 1, height: 24, background: 'var(--color-bdr)', margin: '0 4px' }} />
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-muted)' }}>Color:</span>
          {COLORS.map(c => (
            <button key={c} className={`rb-color-btn${accent === c ? ' active' : ''}`}
              style={{ background: c }} onClick={() => setAccent(c)} />
          ))}
        </div>
        <div className="rb-toolbar-right">
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} style={{ display: 'none' }} />
          <button className="btn btn-o btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? '⏳ Parsing…' : '📤 Upload Resume'}
          </button>
          {score > 0 && <button className="btn btn-gh btn-sm" onClick={handleClear} title="Clear all fields">🗑️</button>}
          <button className="btn btn-p btn-sm" onClick={downloadPDF} disabled={exporting}>
            {exporting ? '⏳ Exporting…' : '📥 Download PDF'}
          </button>
        </div>
      </div>

      {/* Main Layout: Left nav+form | Right preview */}
      <div className="rb-wrap" style={{ borderRadius: '0 0 14px 14px', borderTop: 'none' }}>
        {/* Left Panel */}
        <div className="rb-left">
          {/* Section Tabs */}
          <div className="rb-sections">
            {SECTIONS.map((sec, i) => (
              <div key={sec.id}
                className={`rb-sec-tab${step === sec.id ? ' active' : ''}${isSectionDone(sec) ? ' done' : ''}`}
                onClick={() => setStep(sec.id)}>
                <div className="rb-sec-num">{isSectionDone(sec) ? '✓' : i + 1}</div>
                <span>{sec.label}</span>
                <span className="rb-sec-check">✓</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="rb-form">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: .25, ease }}
              >
                {renderForm()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav Buttons */}
          <div className="rb-form-nav">
            <button className="btn btn-gh btn-sm" onClick={goPrev} disabled={secIdx === 0}>← Back</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '.7rem', color: 'var(--color-muted)' }}>Step {secIdx + 1} of {SECTIONS.length}</span>
              {activeId && <button className="btn btn-gh btn-sm" onClick={() => deleteResume(activeId)} title="Delete this resume" style={{ fontSize: '.68rem', color: 'var(--color-red, #e5534b)' }}>🗑️</button>}
            </div>
            {secIdx < SECTIONS.length - 1
              ? <button className="btn btn-p btn-sm" onClick={goNext}>Next →</button>
              : <button className="btn btn-g btn-sm" onClick={downloadPDF} disabled={exporting}>📥 Download</button>
            }
          </div>

          {/* ATS Score */}
          <div style={{ padding: '12px 18px' }}>
            <div className="rb-ats">
              <div className="rb-ats-title">🤖 ATS Score: {score}/100</div>
              <div className="rb-ats-bar">
                <div className="rb-ats-fill" style={{ width: `${score}%` }} />
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--color-txt2)', marginTop: 6 }}>
                {score < 50 ? '⚠️ Fill in more sections to improve score.' : score < 85 ? '💡 Complete all sections for best results.' : '✅ Great! Your resume is well-filled.'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Live A4 Preview */}
        <div className="rb-right">
          <div className={`rb-paper tpl-${tpl}`} ref={previewRef} style={{ '--rb-accent': accent }}>
            {/* Paper Header */}
            <div className={`rb-p-header tpl-${tpl}`} style={
              tpl === 'classic' ? { background: accent }
              : tpl === 'modern' ? { borderBottomColor: accent }
              : tpl === 'professional' ? { borderLeftColor: accent }
              : tpl === 'creative' ? { background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }
              : tpl === 'executive' ? { borderBottomColor: accent }
              : {}
            }>
              <div className="rb-p-name" style={['modern','professional'].includes(tpl) ? { color: accent } : {}}>{g('name') || 'Your Name'}</div>
              <div className="rb-p-title">{g('title') || 'Job Title'}</div>
              <div className="rb-p-contact">
                {g('email') && <span>✉ {g('email')}</span>}
                {g('phone') && <span>📞 {g('phone')}</span>}
                {g('loc') && <span>📍 {g('loc')}</span>}
                {g('li') && <span>🔗 {g('li')}</span>}
                {g('gh') && <span>💻 {g('gh')}</span>}
              </div>
            </div>

            {/* Paper Body */}
            <div className="rb-p-body">
              {g('summary') && (
                <div className="rb-p-sec">
                  <div className="rb-p-sh" style={{ color: accent, '--rb-accent': accent }}>Summary</div>
                  <div className="rb-p-text">{g('summary')}</div>
                </div>
              )}

              {(g('deg') || g('col')) && (
                <div className="rb-p-sec">
                  <div className="rb-p-sh" style={{ color: accent, '--rb-accent': accent }}>Education</div>
                  <div className="rb-p-edu-title">{[g('deg'), g('col')].filter(Boolean).join(' — ')}</div>
                  <div className="rb-p-edu-sub">{[g('yr') ? `Class of ${g('yr')}` : '', g('cgpa') ? `CGPA: ${g('cgpa')}` : ''].filter(Boolean).join(' · ')}</div>
                </div>
              )}

              {g('exp') && (
                <div className="rb-p-sec">
                  <div className="rb-p-sh" style={{ color: accent, '--rb-accent': accent }}>Experience</div>
                  <div className="rb-p-text">{g('exp')}</div>
                </div>
              )}

              {g('projects') && (
                <div className="rb-p-sec">
                  <div className="rb-p-sh" style={{ color: accent, '--rb-accent': accent }}>Projects</div>
                  <div className="rb-p-text">{g('projects')}</div>
                </div>
              )}

              {sks.length > 0 && (
                <div className="rb-p-sec">
                  <div className="rb-p-sh" style={{ color: accent, '--rb-accent': accent }}>Skills</div>
                  <div className="rb-p-skills">
                    {sks.map(s => <span key={s} className="rb-p-skill" style={{ borderColor: accent, color: accent }}>{s}</span>)}
                  </div>
                </div>
              )}

              {g('ach') && (
                <div className="rb-p-sec">
                  <div className="rb-p-sh" style={{ color: accent, '--rb-accent': accent }}>Achievements & Certifications</div>
                  <div className="rb-p-text">{g('ach')}</div>
                </div>
              )}

              {/* Empty state */}
              {!g('summary') && !g('deg') && !g('exp') && !g('skills') && (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#999' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📄</div>
                  <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#666', fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>Your resume is empty</div>
                  <div style={{ fontSize: '.74rem', fontFamily: "'Outfit',sans-serif", lineHeight: 1.6, maxWidth: 280, margin: '0 auto 14px' }}>
                    Upload an existing resume to auto-fill with AI, or start typing in the sections on the left.
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{
                      padding: '9px 20px', borderRadius: 8, border: '2px dashed #bbb', background: '#f9f9f9',
                      color: '#555', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'Outfit',sans-serif", transition: '.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#1d4ed8'; e.currentTarget.style.color = '#1d4ed8' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#bbb'; e.currentTarget.style.color = '#555' }}
                  >
                    {uploading ? '⏳ Parsing…' : '📤 Upload Resume (PDF, DOCX, TXT)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
