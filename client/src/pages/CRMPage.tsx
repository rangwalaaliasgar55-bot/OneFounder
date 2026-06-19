import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { TiltCard } from '../components/ui/TiltCard'
import { MeshGradient } from '../components/ui/MeshGradient'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-slate-500/20 text-slate-300 border-slate-500/20',
  qualified: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  proposal: 'bg-brand-500/20 text-brand-400 border-brand-500/20',
  negotiation: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  won: 'bg-green-500/20 text-green-400 border-green-500/20',
  lost: 'bg-red-500/20 text-red-400 border-red-500/20',
}

export function CRMPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', source: '', notes: '', value: '', status: 'lead' })

  useEffect(() => {
    api.get<any[]>('/leads').then(setLeads).finally(() => setLoading(false))
  }, [])

  const createLead = async () => {
    const lead = await api.post<any>('/leads', { ...form, value: form.value ? parseInt(form.value) : null })
    setLeads(prev => [lead, ...prev])
    setShowModal(false)
    setForm({ name: '', email: '', company: '', phone: '', source: '', notes: '', value: '', status: 'lead' })
  }

  const updateStatus = async (id: string, status: string) => {
    const updated = await api.patch<any>(`/leads/${id}`, { status })
    setLeads(leads.map(l => l.id === id ? updated : l))
    if (selected?.id === id) setSelected(updated)
  }

  const deleteLead = async (id: string) => {
    await api.delete(`/leads/${id}`)
    setLeads(leads.filter(l => l.id !== id))
    setSelected(null)
  }

  if (loading) return <PageLoader />

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = leads.filter(l => l.status === stage)
    return acc
  }, {} as Record<string, any[]>)

  const totalValue = leads.filter(l => l.status === 'won').reduce((sum, l) => sum + (l.value || 0), 0)
  const pipelineValue = leads.reduce((sum, l) => sum + (l.value || 0), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon="👥"
        title="CRM"
        description="Track leads, prospects, and clients through your sales pipeline"
        action={<button onClick={() => setShowModal(true)} className="btn-primary">+ Add Lead</button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="text-xs text-slate-500 mb-1">Total Leads</div>
          <div className="text-2xl font-bold text-white">{leads.length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500 mb-1">Won Deals Value</div>
          <div className="text-2xl font-bold text-green-400">${totalValue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500 mb-1">Pipeline Value</div>
          <div className="text-2xl font-bold text-brand-400">${pipelineValue.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('pipeline')} className={`btn-${view === 'pipeline' ? 'primary' : 'secondary'} text-sm py-1.5`}>
          🗂️ Pipeline
        </button>
        <button onClick={() => setView('list')} className={`btn-${view === 'list' ? 'primary' : 'secondary'} text-sm py-1.5`}>
          📋 List
        </button>
      </div>

      {leads.length === 0 ? (
        <EmptyStateAnimated
          icon="👥"
          title="No leads yet"
          description="Add your first lead and start tracking your sales pipeline"
          action={{ label: 'Add Lead', onClick: () => setShowModal(true) }}
        />
      ) : view === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage} className="flex-shrink-0 w-56 glass rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <span className={`badge border ${STAGE_COLORS[stage]}`}>{stage}</span>
                <span className="text-xs text-slate-500">{grouped[stage]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(grouped[stage] || []).map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className="glass rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-brand-600/30 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div className="text-sm text-white font-medium truncate">{lead.name}</div>
                    </div>
                    {lead.company && <div className="text-xs text-slate-500 truncate">{lead.company}</div>}
                    {lead.value && <div className="text-xs text-green-400 font-medium mt-1">${lead.value.toLocaleString()}</div>}
                  </div>
                ))}
                {(grouped[stage] || []).length === 0 && (
                  <div className="text-center text-xs text-slate-600 py-4">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/10">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Value</th>
                <th className="pb-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map(lead => (
                <tr key={lead.id} onClick={() => setSelected(lead)} className="hover:bg-white/5 cursor-pointer transition-colors">
                  <td className="py-3 text-sm text-white font-medium">{lead.name}</td>
                  <td className="py-3 text-sm text-slate-400">{lead.company || '—'}</td>
                  <td className="py-3">
                    <span className={`badge border ${STAGE_COLORS[lead.status]}`}>{lead.status}</span>
                  </td>
                  <td className="py-3 text-sm text-green-400">{lead.value ? `$${lead.value.toLocaleString()}` : '—'}</td>
                  <td className="py-3 text-sm text-slate-400">{lead.source || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Lead" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Full Name', placeholder: 'John Smith', required: true },
            { key: 'email', label: 'Email', placeholder: 'john@company.com', type: 'email' },
            { key: 'company', label: 'Company', placeholder: 'Acme Corp' },
            { key: 'phone', label: 'Phone', placeholder: '+1 555 0000' },
            { key: 'source', label: 'Source', placeholder: 'LinkedIn, referral...' },
            { key: 'value', label: 'Deal Value ($)', placeholder: '5000', type: 'number' },
          ].map(field => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <input
                className="input"
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={(form as any)[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                required={field.required}
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none h-20" placeholder="Any notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={createLead} disabled={!form.name.trim()}>Add Lead</button>
        </div>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Email', value: selected.email },
                { label: 'Company', value: selected.company },
                { label: 'Phone', value: selected.phone },
                { label: 'Source', value: selected.source },
                { label: 'Deal Value', value: selected.value ? `$${selected.value.toLocaleString()}` : null },
              ].filter(item => item.value).map(item => (
                <div key={item.label}>
                  <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                  <div className="text-white">{item.value}</div>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Notes</div>
                <div className="glass rounded-xl p-3 text-sm text-slate-300">{selected.notes}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-500 mb-2">Move to Stage</div>
              <div className="flex flex-wrap gap-2">
                {STAGES.map(stage => (
                  <button
                    key={stage}
                    onClick={() => updateStatus(selected.id, stage)}
                    className={`badge border cursor-pointer transition-all ${selected.status === stage ? STAGE_COLORS[stage] : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => deleteLead(selected.id)} className="btn-ghost text-red-400 hover:text-red-300">🗑️ Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
