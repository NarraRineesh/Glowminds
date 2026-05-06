import { useState, useEffect } from 'react'
import useAppStore from '@/store/authStore'
import useJobStore from '@/store/jobStore'
import useTrackerStore from '@/store/trackerStore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import app from '@/services/firebase'
import Loader from '@/components/Loader'
import '@/styles/dashboard.css'
import '@/styles/jobs.css'
import '@/styles/cards.css'
import '@/styles/forms.css'
import '@/styles/modal.css'

const functions = getFunctions(app)
const jobMatchFn = httpsCallable(functions, 'jobMatch')
const coverLetterFn = httpsCallable(functions, 'generateCoverLetter')

const JF = ['All', 'Best Match', 'Full-time', 'Contract', 'New Today']
const PER_PAGE = 8

export default function JobsSection() {
  const { addToast } = useAppStore()
  const { jobs, loading, error, fetchJobs, saveJob, unsaveJob, isJobSaved, loadSavedJobs } = useJobStore()
  const { addApp } = useTrackerStore()
  const [activeF, setActiveF] = useState('All')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalJob, setModalJob] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [aiMatch, setAiMatch] = useState(null) // { score, verdict, matchedSkills, missingSkills, recommendations, summary }
  const [aiLoading, setAiLoading] = useState(false)
  const [matchCache, setMatchCache] = useState({}) // jobId -> analysis
  const [coverLetter, setCoverLetter] = useState('')
  const [clLoading, setClLoading] = useState(false)
  const [clCopied, setClCopied] = useState(false)

  useEffect(() => {
    fetchJobs()
    loadSavedJobs()
  }, [fetchJobs, loadSavedJobs])

  useEffect(() => {
    const id = requestAnimationFrame(() => setPage(1))
    return () => cancelAnimationFrame(id)
  }, [activeF, typeFilter, search])

  const handleSearch = (e) => {
    e?.preventDefault?.()
    setSearch(searchInput)
    fetchJobs({ search: searchInput })
  }

  let list = [...jobs]
  if (activeF === 'Best Match') list = list.filter(j => j.match >= 80)
  else if (activeF === 'Full-time') list = list.filter(j => j.type === 'Full-time')
  else if (activeF === 'Contract') list = list.filter(j => j.type === 'Contract')
  else if (activeF === 'New Today') list = list.filter(j => j.isNew)
  if (typeFilter) list = list.filter(j => j.type === typeFilter)

  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const paged = list.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const quickApply = async (j) => {
    const app = await addApp({ co: j.co, role: j.title, status: 'Applied', date: new Date().toISOString().split('T')[0], sal: j.sal || '', notes: 'Applied via Glowminds', logo: j.logo, source: 'remotive', jobUrl: j.url })
    if (app) addToast('success', `✅ Applied to ${j.title} at ${j.co}!`)
    else addToast('error', '⚠️ Failed to track application')
  }

  const toggleSave = async (j, e) => {
    e?.stopPropagation?.()
    if (isJobSaved(j.id)) {
      await unsaveJob(j.id)
      addToast('info', '🔖 Job removed from saved')
    } else {
      await saveJob(j)
      addToast('success', '🔖 Job saved!')
    }
  }

  return (
    <>
      <div className="mb-4">
        <div className="dsh-title">Job Board 💼</div>
        <div className="dsh-sub"><span className="pulse" /> Live remote jobs from Remotive API · {list.length} results</div>
      </div>

      {/* Search & Filter Bar */}
      <div className="fbar">
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '.82rem', opacity: .5 }}>🔍</span>
            <input className="fi" style={{ paddingLeft: 32, paddingRight: 10, height: 36, fontSize: '.82rem', width: '100%' }} placeholder="Search jobs, skills, companies…" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-p" style={{ height: 36, padding: '0 16px', fontSize: '.78rem', whiteSpace: 'nowrap' }}>Search</button>
        </form>

        <div style={{ width: 1, height: 24, background: 'var(--color-bdr)', flexShrink: 0 }} className="hidden sm:block" />

        <select className="fsl" style={{ height: 36, padding: '0 28px 0 10px', fontSize: '.78rem', minWidth: 120, background: 'var(--color-bg3)', border: '1px solid var(--color-bdr)', borderRadius: 8 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option><option>Full-time</option><option>Contract</option><option>Part-time</option>
        </select>

        <div className="fbar-pills" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {JF.map(f => (
            <button key={f} onClick={() => setActiveF(f)}
              style={{ padding: '5px 12px', fontSize: '.74rem', fontWeight: 600, borderRadius: 8, border: '1px solid', cursor: 'pointer', transition: '.15s',
                background: f === activeF ? 'rgba(56,139,253,.18)' : 'transparent',
                borderColor: f === activeF ? 'rgba(56,139,253,.35)' : 'var(--color-bdr)',
                color: f === activeF ? 'var(--color-blu2)' : 'var(--color-txt2)',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <Loader variant="block" label="Fetching jobs from Remotive…" />}

      {error && !loading && (
        <div className="text-center p-10">
          <div className="text-[--color-muted] mb-2">⚠️ {error}</div>
          <button className="btn btn-o btn-sm" onClick={() => fetchJobs({ search })}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="rg-j">
            {paged.length === 0 && (
              <div className="col-span-full text-center p-10 text-[--color-muted]">No jobs found. Try different search terms or filters.</div>
            )}
            {paged.map(j => (
              <div key={j.id} className={`jc${j.isNew ? ' new-j' : ''}`} onClick={() => { setAiMatch(matchCache[j.id] || null); setModalJob(j) }}>
                <div className="jch">
                  <div className="jc-logo">{j.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="jc-title">{j.title}</div>
                    <div className="jc-co">{j.co} · {j.loc}</div>
                  </div>
                </div>
                <div className="text-[.7rem] text-[--color-muted] mb-[7px]">{j.type} · {j.posted}</div>
                <div className="text-[.68rem] text-[--color-muted] mb-0.5">
                  Match: <strong className={j.match >= 90 ? 'text-[--color-grn]' : j.match >= 80 ? 'text-[--color-blu2]' : 'text-[--color-gold]'}>{j.match}%</strong>
                </div>
                <div className="match-bar"><div className="match-fill" style={{ width: `${j.match}%` }} /></div>
                <div className="flex flex-wrap gap-[5px] mb-[11px]">
                  {j.tags.slice(0, 3).map(t => <span key={t} className="tag tb">{t}</span>)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[.8rem] font-extrabold text-[--color-grn]">{j.sal || 'Not listed'}</div>
                  <div className="flex gap-1.5">
                    <button className="btn btn-gh btn-xs" onClick={(e) => toggleSave(j, e)}>{isJobSaved(j.id) ? '❤️' : '🤍'}</button>
                    <button className="btn btn-p btn-xs" onClick={(e) => { e.stopPropagation(); quickApply(j) }}>Apply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {list.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              <button className="btn btn-gh btn-sm" disabled={page <= 1}
                style={{ opacity: page <= 1 ? .4 : 1 }}
                onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`d${i}`} style={{ color: 'var(--color-muted)', fontSize: '.78rem', padding: '0 2px' }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: 32, height: 32, borderRadius: 8, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', transition: '.15s',
                        border: '1px solid',
                        background: p === page ? 'rgba(56,139,253,.22)' : 'var(--color-surf)',
                        borderColor: p === page ? 'rgba(56,139,253,.4)' : 'var(--color-bdr)',
                        color: p === page ? 'var(--color-blu2)' : 'var(--color-txt2)',
                      }}>
                      {p}
                    </button>
                  )
                )}

              <button className="btn btn-gh btn-sm" disabled={page >= totalPages}
                style={{ opacity: page >= totalPages ? .4 : 1 }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>

              <span style={{ fontSize: '.72rem', color: 'var(--color-muted)', marginLeft: 8 }}>
                Page {page} of {totalPages} · {list.length} jobs
              </span>
            </div>
          )}
        </>
      )}

      {/* Job Detail Modal */}
      {modalJob && (
        <div className="mb on" onClick={(e) => { if (e.target === e.currentTarget) setModalJob(null) }}>
          <div className="mo mo-lg">
            <div className="mh"><h2>{modalJob.title}</h2><div className="mx" onClick={() => setModalJob(null)}>✕</div></div>
            <div className="mb2">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ width: 50, height: 50, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', background: 'var(--color-bg3)', border: '1px solid var(--color-bdr)', flexShrink: 0 }}>{modalJob.logo}</div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: '.96rem', fontWeight: 800 }}>{modalJob.co}</div>
                  <div style={{ color: 'var(--color-txt2)', fontSize: '.82rem' }}>{modalJob.loc} · {modalJob.type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-grn)' }}>{modalJob.sal || 'Not listed'}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--color-muted)' }}>🎯 {modalJob.match}% profile match</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                {modalJob.tags.map(t => <span key={t} className="tag tb">{t}</span>)}
                <span className="tag tg">{modalJob.type}</span>
              </div>
              <div style={{ height: 1, background: 'var(--color-bdr)', margin: '14px 0' }} />
              <div style={{ fontSize: '.84rem', color: 'var(--color-txt2)', lineHeight: 1.8, marginBottom: 14, maxHeight: 300, overflow: 'auto' }}>
                {modalJob.desc?.slice(0, 800)}{modalJob.desc?.length > 800 ? '…' : ''}
              </div>
              {modalJob.req && modalJob.req[0] !== 'See full job description for details' && (
                <>
                  <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 8 }}>Requirements</div>
                  {modalJob.req.map((r, i) => (
                    <div key={i} style={{ fontSize: '.8rem', color: 'var(--color-txt2)', padding: '4px 0 4px 16px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--color-blu2)' }}>›</span>{r}
                    </div>
                  ))}
                </>
              )}
              <div style={{ background: 'var(--color-grn2)', border: '1px solid rgba(63,185,80,.22)', borderRadius: 9, padding: 13, marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ fontWeight: 800, color: 'var(--color-grn)', fontSize: '.82rem' }}>🎯 Match Analysis</div>
                  {!aiMatch && (
                    <button className="btn btn-p btn-xs" disabled={aiLoading} onClick={async (e) => {
                      e.stopPropagation()
                      if (matchCache[modalJob.id]) { setAiMatch(matchCache[modalJob.id]); return }
                      setAiLoading(true)
                      try {
                        const uid = auth.currentUser?.uid
                        let skills = '', experience = ''
                        if (uid) {
                          const snap = await getDoc(doc(db, 'users', uid))
                          if (snap.exists()) {
                            const p = snap.data().profile || {}
                            skills = Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || '')
                            experience = p.experience ? `${p.experience} years` : ''
                          }
                        }
                        const { data } = await jobMatchFn({
                          userSkills: skills, userExperience: experience,
                          jobTitle: modalJob.title, jobCompany: modalJob.co,
                          jobDesc: modalJob.desc, jobTags: modalJob.tags,
                        })
                        setAiMatch(data)
                        setMatchCache(prev => ({ ...prev, [modalJob.id]: data }))
                      } catch (err) {
                        console.error('AI match error:', err)
                        addToast('error', '⚠️ Failed to analyze match')
                      }
                      setAiLoading(false)
                    }}>
                      {aiLoading ? '⏳ Analyzing…' : '🤖 AI Match'}
                    </button>
                  )}
                </div>

                {!aiMatch ? (
                  <div style={{ fontSize: '.8rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
                    📍 Location: <strong>{modalJob.loc}</strong><br />
                    💼 Type: <strong>{modalJob.type}</strong><br />
                    🏷️ Skills: <strong>{modalJob.tags.join(', ') || 'N/A'}</strong><br />
                    📊 Basic Match: <strong>{modalJob.match}%</strong>
                    <div style={{ fontSize: '.72rem', color: 'var(--color-muted)', marginTop: 4 }}>Click "AI Match" for AI-powered analysis</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0,
                        border: '3px solid', borderColor: aiMatch.score >= 80 ? 'var(--color-grn)' : aiMatch.score >= 60 ? 'var(--color-blu2)' : aiMatch.score >= 40 ? 'var(--color-gold)' : 'var(--color-red)',
                        color: aiMatch.score >= 80 ? 'var(--color-grn)' : aiMatch.score >= 60 ? 'var(--color-blu2)' : aiMatch.score >= 40 ? 'var(--color-gold)' : 'var(--color-red)',
                        background: aiMatch.score >= 80 ? 'rgba(46,160,67,.08)' : aiMatch.score >= 60 ? 'rgba(56,139,253,.08)' : 'rgba(210,168,67,.08)',
                      }}>{aiMatch.score}%</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '.86rem' }}>{aiMatch.verdict}</div>
                        <div style={{ fontSize: '.74rem', color: 'var(--color-txt2)', lineHeight: 1.5 }}>{aiMatch.summary}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      {aiMatch.matchedSkills?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '.66rem', fontWeight: 800, color: 'var(--color-grn)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>✅ Matched Skills</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {aiMatch.matchedSkills.map(s => <span key={s} style={{ fontSize: '.66rem', padding: '2px 7px', borderRadius: 5, background: 'rgba(46,160,67,.12)', color: 'var(--color-grn)', fontWeight: 600 }}>{s}</span>)}
                          </div>
                        </div>
                      )}
                      {aiMatch.missingSkills?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '.66rem', fontWeight: 800, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>⚡ Skills to Learn</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {aiMatch.missingSkills.map(s => <span key={s} style={{ fontSize: '.66rem', padding: '2px 7px', borderRadius: 5, background: 'rgba(210,168,67,.12)', color: 'var(--color-gold)', fontWeight: 600 }}>{s}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                    {aiMatch.recommendations?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '.66rem', fontWeight: 800, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>💡 Recommendations</div>
                        {aiMatch.recommendations.map((r, i) => (
                          <div key={i} style={{ fontSize: '.74rem', color: 'var(--color-txt2)', padding: '3px 0 3px 12px', position: 'relative', lineHeight: 1.5 }}>
                            <span style={{ position: 'absolute', left: 0, color: 'var(--color-blu2)' }}>→</span>{r}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {coverLetter && (
                <div style={{ background: 'var(--color-bg3)', border: '1px solid var(--color-bdr)', borderRadius: 10, padding: 16, marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: '.82rem', color: 'var(--color-prp)' }}>✉️ Cover Letter</div>
                    <button className="btn btn-gh btn-xs" onClick={() => {
                      navigator.clipboard.writeText(coverLetter)
                      setClCopied(true)
                      setTimeout(() => setClCopied(false), 2000)
                    }}>{clCopied ? '✅ Copied!' : '📋 Copy'}</button>
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--color-txt2)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{coverLetter}</div>
                </div>
              )}
            </div>
            <div className="mf" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-gh" onClick={() => { setModalJob(null); setCoverLetter(''); setAiMatch(null) }}>Close</button>
              <button className="btn btn-o" onClick={(e) => toggleSave(modalJob, e)}>{isJobSaved(modalJob.id) ? '❤️ Saved' : '🔖 Save'}</button>
              {modalJob.url && <a href={modalJob.url} target="_blank" rel="noopener noreferrer" className="btn btn-o">🔗 Original</a>}
              <button className="btn btn-o" disabled={clLoading} onClick={async () => {
                setClLoading(true)
                try {
                  const uid = auth.currentUser?.uid
                  let profile = { name: '', title: '', skills: [], education: '', experience: '' }
                  if (uid) {
                    const snap = await getDoc(doc(db, 'users', uid))
                    if (snap.exists()) {
                      const p = snap.data().profile || {}
                      const u = snap.data()
                      profile = {
                        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (p.name || ''),
                        title: p.title || '',
                        skills: Array.isArray(p.skills) ? p.skills : [],
                        education: p.deg ? `${p.deg} from ${p.col || 'University'}` : '',
                        experience: p.experience || '',
                      }
                    }
                  }
                  const { data } = await coverLetterFn({ profile, jobTitle: modalJob.title, company: modalJob.co, jobDescription: modalJob.desc?.slice(0, 1500) })
                  setCoverLetter(data.coverLetter)
                } catch (err) {
                  console.error('Cover letter error:', err)
                  addToast('error', '⚠️ Failed to generate cover letter')
                }
                setClLoading(false)
              }}>{clLoading ? '⏳ Generating…' : '✉️ Cover Letter'}</button>
              <button className="btn btn-g" onClick={() => { quickApply(modalJob); setModalJob(null); setCoverLetter('') }}>✅ Track Application</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
