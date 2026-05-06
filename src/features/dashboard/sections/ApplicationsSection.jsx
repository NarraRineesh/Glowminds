import { useState, useEffect } from 'react'
import useAppStore from '@/store/authStore'
import useIsPro from '@/hooks/useIsPro'
import useTrackerStore from '@/store/trackerStore'
import Loader from '@/components/Loader'
import '@/styles/dashboard.css'
import '@/styles/kanban.css'
import '@/styles/forms.css'
import '@/styles/modal.css'

const COLS = ['Applied', 'In Review', 'Interview', 'Offer']
const CCOL = { 'Applied': 'var(--color-blu)', 'In Review': 'var(--color-gold)', 'Interview': 'var(--color-prp)', 'Offer': 'var(--color-grn)' }

const FREE_APP_LIMIT = 5

export default function ApplicationsSection() {
  const { addToast } = useAppStore()
  const isPro = useIsPro()
  const { apps, loading, addApp, updateStatus, deleteApp, loadApps } = useTrackerStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ co: '', rl: '', st: 'Applied', dt: '', sal: '', nt: '' })

  useEffect(() => { loadApps() }, [loadApps])

  const handleAdd = async () => {
    if (!form.co || !form.rl) { addToast('error', '⚠️ Company and role required'); return }
    const app = await addApp({ co: form.co, role: form.rl, status: form.st, date: form.dt || new Date().toISOString().split('T')[0], sal: form.sal, notes: form.nt, logo: '💼' })
    if (app) addToast('success', `✅ ${form.rl} at ${form.co} tracked!`)
    else addToast('error', '⚠️ Failed to add application')
    setModal(false)
    setForm({ co: '', rl: '', st: 'Applied', dt: '', sal: '', nt: '' })
  }

  const handleStatusChange = async (appId, newStatus) => {
    await updateStatus(appId, newStatus)
    addToast('info', `📋 Status updated to ${newStatus}`)
  }

  const handleDelete = async (appId, company) => {
    await deleteApp(appId)
    addToast('info', `🗑️ ${company} removed from tracker`)
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-[18px]">
        <div>
          <div className="dsh-title">Application Tracker 📋</div>
          <div className="dsh-sub">Track every application · Kanban board view · {apps.length} total</div>
        </div>
        {(isPro || apps.length < FREE_APP_LIMIT) ? (
          <button className="btn btn-p btn-sm" onClick={() => setModal(true)}>+ Add Application</button>
        ) : (
          <button className="btn btn-gh btn-sm" style={{ opacity: .6 }} onClick={() => addToast('info', '⚡ Upgrade to Pro for unlimited tracking')}>🔒 Limit Reached (Pro)</button>
        )}
      </div>

      {loading && <Loader variant="block" label="Loading your applications…" />}

      {!loading && (
        <div className="kanban">
          {COLS.map(col => {
            const items = apps.filter(a => a.status === col)
            return (
              <div key={col} className="k-col">
                <div className="k-col-h" style={{ color: CCOL[col] }}>
                  <span>{col}</span>
                  <span className="py-0.5 px-2 rounded-lg text-[.68rem]" style={{ background: `${CCOL[col]}20` }}>{items.length}</span>
                </div>
                {items.map((a) => (
                  <div key={a.id} className="k-item" style={{ position: 'relative' }}>
                    <div className="k-co">{a.logo || '💼'} {a.co}</div>
                    <div className="k-role">{a.role}</div>
                    {a.sal && <div className="k-date text-[--color-grn] font-bold">{a.sal}</div>}
                    <div className="k-date">{a.date}{a.notes ? ` · ${a.notes}` : ''}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <select
                        className="fsl text-[.68rem] py-0.5 px-1.5 flex-1"
                        value={a.status}
                        onChange={(e) => handleStatusChange(a.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {COLS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button
                        className="text-[.68rem] text-[--color-muted] hover:text-[red] cursor-pointer bg-none border-none p-0.5"
                        onClick={() => handleDelete(a.id, a.co)}
                        title="Remove"
                      >✕</button>
                    </div>
                  </div>
                ))}
                {col === 'Applied' && (isPro || apps.length < FREE_APP_LIMIT) && (
                  <div className="border border-dashed border-[--color-bdr] rounded-[7px] p-[9px] text-center text-[.73rem] text-[--color-muted] cursor-pointer"
                    onClick={() => setModal(true)}>+ Add manually</div>
                )}
                {col === 'Applied' && !isPro && apps.length >= FREE_APP_LIMIT && (
                  <div className="border border-dashed border-[--color-bdr] rounded-[7px] p-[9px] text-center text-[.68rem] text-[--color-muted]">🔒 {FREE_APP_LIMIT}/{FREE_APP_LIMIT} free apps used · <span style={{ color: 'var(--color-blu2)', cursor: 'pointer', fontWeight: 700 }} onClick={() => addToast('info', '⚡ Upgrade to Pro for unlimited tracking')}>Upgrade</span></div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {modal && (
        <div className="mb on" onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="mo">
            <div className="mh"><h2>Track Application</h2><div className="mx" onClick={() => setModal(false)}>✕</div></div>
            <div className="mb2 flex flex-col gap-3">
              <div className="fg"><label className="fl">Company Name</label><input className="fi" placeholder="Google, TCS, Infosys…" value={form.co} onChange={e => setForm({ ...form, co: e.target.value })} /></div>
              <div className="fg2">
                <div className="fg"><label className="fl">Job Role</label><input className="fi" placeholder="Software Engineer" value={form.rl} onChange={e => setForm({ ...form, rl: e.target.value })} /></div>
                <div className="fg"><label className="fl">Status</label>
                  <select className="fsl" value={form.st} onChange={e => setForm({ ...form, st: e.target.value })}>
                    {COLS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="fg2">
                <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={form.dt} onChange={e => setForm({ ...form, dt: e.target.value })} /></div>
                <div className="fg"><label className="fl">Salary</label><input className="fi" placeholder="5–8 LPA" value={form.sal} onChange={e => setForm({ ...form, sal: e.target.value })} /></div>
              </div>
              <div className="fg"><label className="fl">Notes</label><textarea className="fta min-h-[56px]" placeholder="Recruiter name, next steps…" value={form.nt} onChange={e => setForm({ ...form, nt: e.target.value })} /></div>
            </div>
            <div className="mf">
              <button className="btn btn-gh" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-p" onClick={handleAdd}>Add Application</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
