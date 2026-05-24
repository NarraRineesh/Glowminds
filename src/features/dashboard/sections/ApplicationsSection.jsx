import { useState, useEffect } from 'react'
import useAppStore from '@/store/authStore'
import useIsPro from '@/hooks/useIsPro'
import useTrackerStore from '@/store/trackerStore'
import Loader from '@/components/Loader'
import {
  APPLICATION_STATUS,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABEL,
} from '@/constants/schema'
import '@/styles/dashboard.css'
import '@/styles/kanban.css'
import '@/styles/forms.css'
import '@/styles/modal.css'

const COLUMN_COLOR = {
  [APPLICATION_STATUS.APPLIED]: 'var(--color-blu)',
  [APPLICATION_STATUS.IN_REVIEW]: 'var(--color-gold)',
  [APPLICATION_STATUS.INTERVIEW]: 'var(--color-prp)',
  [APPLICATION_STATUS.OFFER]: 'var(--color-grn)',
  [APPLICATION_STATUS.REJECTED]: 'var(--color-red, #e5534b)',
}

const FREE_APP_LIMIT = 5

const EMPTY_FORM = {
  company: '',
  role: '',
  status: APPLICATION_STATUS.APPLIED,
  appliedDate: '',
  salary: '',
  notes: '',
}

export default function ApplicationsSection() {
  const { addToast } = useAppStore()
  const isPro = useIsPro()
  const { apps, loading, addApp, updateStatus, deleteApp, loadApps } = useTrackerStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { loadApps() }, [loadApps])

  const handleAdd = async () => {
    if (!form.company || !form.role) { addToast('error', '⚠️ Company and role required'); return }
    const application = await addApp({
      company: form.company,
      role: form.role,
      status: form.status,
      appliedDate: form.appliedDate || new Date().toISOString().split('T')[0],
      salary: form.salary,
      notes: form.notes,
      logo: '💼',
    })
    if (application) addToast('success', `✅ ${form.role} at ${form.company} tracked!`)
    else addToast('error', '⚠️ Failed to add application')
    setModal(false)
    setForm(EMPTY_FORM)
  }

  const handleStatusChange = async (appId, newStatus) => {
    await updateStatus(appId, newStatus)
    addToast('info', `📋 Status updated to ${APPLICATION_STATUS_LABEL[newStatus] || newStatus}`)
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
          {APPLICATION_STATUSES.map(col => {
            const items = apps.filter(a => a.status === col)
            const colColor = COLUMN_COLOR[col]
            return (
              <div key={col} className="k-col">
                <div className="k-col-h" style={{ color: colColor }}>
                  <span>{APPLICATION_STATUS_LABEL[col]}</span>
                  <span className="py-0.5 px-2 rounded-lg text-[.68rem]" style={{ background: `${colColor}20` }}>{items.length}</span>
                </div>
                {items.map((a) => (
                  <div key={a.id} className="k-item" style={{ position: 'relative' }}>
                    <div className="k-co">{a.logo || '💼'} {a.company}</div>
                    <div className="k-role">{a.role}</div>
                    {a.salary && <div className="k-date text-[--color-grn] font-bold">{a.salary}</div>}
                    <div className="k-date">{a.appliedDate}{a.notes ? ` · ${a.notes}` : ''}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <select
                        className="fsl text-[.68rem] py-0.5 px-1.5 flex-1"
                        value={a.status}
                        onChange={(e) => handleStatusChange(a.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {APPLICATION_STATUSES.map(c => <option key={c} value={c}>{APPLICATION_STATUS_LABEL[c]}</option>)}
                      </select>
                      <button
                        className="text-[.68rem] text-[--color-muted] hover:text-[red] cursor-pointer bg-none border-none p-0.5"
                        onClick={() => handleDelete(a.id, a.company)}
                        title="Remove"
                      >✕</button>
                    </div>
                  </div>
                ))}
                {col === APPLICATION_STATUS.APPLIED && (isPro || apps.length < FREE_APP_LIMIT) && (
                  <div className="border border-dashed border-[--color-bdr] rounded-[7px] p-[9px] text-center text-[.73rem] text-[--color-muted] cursor-pointer"
                    onClick={() => setModal(true)}>+ Add manually</div>
                )}
                {col === APPLICATION_STATUS.APPLIED && !isPro && apps.length >= FREE_APP_LIMIT && (
                  <div className="border border-dashed border-[--color-bdr] rounded-[7px] p-[9px] text-center text-[.68rem] text-[--color-muted]">🔒 {FREE_APP_LIMIT}/{FREE_APP_LIMIT} free apps used · <span style={{ color: 'var(--color-blu2)', cursor: 'pointer', fontWeight: 700 }} onClick={() => addToast('info', '⚡ Upgrade to Pro for unlimited tracking')}>Upgrade</span></div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="mb on" onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="mo">
            <div className="mh"><h2>Track Application</h2><div className="mx" onClick={() => setModal(false)}>✕</div></div>
            <div className="mb2 flex flex-col gap-3">
              <div className="fg"><label className="fl">Company Name</label><input className="fi" placeholder="Google, TCS, Infosys…" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              <div className="fg2">
                <div className="fg"><label className="fl">Job Role</label><input className="fi" placeholder="Software Engineer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
                <div className="fg"><label className="fl">Status</label>
                  <select className="fsl" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {APPLICATION_STATUSES.map(c => <option key={c} value={c}>{APPLICATION_STATUS_LABEL[c]}</option>)}
                  </select>
                </div>
              </div>
              <div className="fg2">
                <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={form.appliedDate} onChange={e => setForm({ ...form, appliedDate: e.target.value })} /></div>
                <div className="fg"><label className="fl">Salary</label><input className="fi" placeholder="5–8 LPA" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
              </div>
              <div className="fg"><label className="fl">Notes</label><textarea className="fta min-h-[56px]" placeholder="Recruiter name, next steps…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
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
