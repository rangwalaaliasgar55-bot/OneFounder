import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { SkeletonListPage } from '../components/ui/PageSkeletons'
import { MeshGradient } from '../components/ui/MeshGradient'

export function PlannerPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState({ title: '', businessType: '', targetMarket: '', uniqueValue: '' })

  useEffect(() => {
    api.get<any[]>('/plans').then(setPlans).finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    if (!form.title.trim()) return
    setGenerating(true)
    setShowModal(false)
    try {
      const plan = await api.post<any>('/plans/generate', form)
      setPlans(prev => [plan, ...prev])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const deletePlan = async (id: string) => {
    await api.delete(`/plans/${id}`)
    setPlans(plans.filter(p => p.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  if (loading) return <SkeletonListPage />

  const renderSection = (title: string, content: any, color = 'text-brand-400') => {
    if (!content) return null
    return (
      <div>
        <h3 className={`text-sm font-semibold mb-2 ${color}`}>{title}</h3>
        {typeof content === 'string' ? (
          <p className="text-sm text-slate-300 leading-relaxed">{content}</p>
        ) : Array.isArray(content) ? (
          <ul className="space-y-1">
            {content.map((item: any, i: number) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-brand-500 flex-shrink-0">•</span>
                {typeof item === 'string' ? item : JSON.stringify(item)}
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            {Object.entries(content as Record<string, any>).map(([k, v]) => (
              <div key={k} className="glass rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1 font-medium capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                <div className="text-sm text-slate-300">{typeof v === 'string' ? v : JSON.stringify(v)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <MeshGradient />
      <PageHeader
        icon="📋"
        title="Business Planner"
        description="AI-generated business plans with strategy, pricing, and growth roadmaps"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            📋 Create Plan
          </button>
        }
      />

      {generating && (
        <div className="card border border-brand-500/20 mb-6 flex items-center gap-4">
          <LoadingSpinner />
          <div>
            <div className="text-white font-medium">Generating business plan...</div>
            <div className="text-slate-400 text-sm">AI is creating your complete business strategy</div>
          </div>
        </div>
      )}

      {plans.length === 0 && !generating ? (
        <EmptyStateAnimated
          icon="📋"
          title="No business plans yet"
          description="Generate a complete business plan with AI — includes business model, pricing, acquisition strategy, and financial projections"
          action={{ label: 'Create Business Plan', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} onClick={() => setSelected(plan)} className="card-hover">
              <div className="text-2xl mb-3">📋</div>
              <h3 className="text-base font-semibold text-white mb-2">{plan.title}</h3>
              {plan.businessModel && (
                <p className="text-sm text-slate-400 line-clamp-3 mb-4">{
                  typeof plan.businessModel === 'string'
                    ? plan.businessModel.substring(0, 120) + '...'
                    : 'Business model defined'
                }</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                {plan.pricing && <span className="glass px-2 py-0.5 rounded-full text-slate-300">💰 Pricing</span>}
                {plan.acquisitionStrategy && <span className="glass px-2 py-0.5 rounded-full text-slate-300">📣 Acquisition</span>}
                {plan.growthStrategy && <span className="glass px-2 py-0.5 rounded-full text-slate-300">📈 Growth</span>}
                {plan.financialProjections && <span className="glass px-2 py-0.5 rounded-full text-slate-300">💹 Projections</span>}
              </div>
              <div className="mt-3 text-xs text-slate-500">{new Date(plan.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="📋 Generate Business Plan" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Business Name / Title</label>
            <input className="input" placeholder="e.g., TaskFlow AI" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Business Type</label>
            <select className="input" value={form.businessType} onChange={e => setForm({ ...form, businessType: e.target.value })}>
              <option value="" className="bg-surface-900">Select type...</option>
              {['SaaS', 'Agency', 'Marketplace', 'E-commerce', 'Consulting', 'App', 'Content', 'AI Product'].map(t => (
                <option key={t} value={t} className="bg-surface-900">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target Market</label>
            <input className="input" placeholder="e.g., Small business owners, freelancers..." value={form.targetMarket} onChange={e => setForm({ ...form, targetMarket: e.target.value })} />
          </div>
          <div>
            <label className="label">Unique Value Proposition</label>
            <textarea className="input resize-none h-20" placeholder="What makes you different?" value={form.uniqueValue} onChange={e => setForm({ ...form, uniqueValue: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={generate} disabled={!form.title.trim()}>
              📋 Generate Plan
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} size="xl">
        {selected && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid sm:grid-cols-2 gap-6">
              {renderSection('Business Model', selected.businessModel)}
              {renderSection('Customer Profile', selected.customerProfile, 'text-violet-400')}
              {renderSection('Pricing Strategy', selected.pricing, 'text-green-400')}
              {renderSection('Acquisition Strategy', selected.acquisitionStrategy, 'text-orange-400')}
              {renderSection('Launch Strategy', selected.launchStrategy, 'text-cyan-400')}
              {renderSection('Growth Strategy', selected.growthStrategy, 'text-pink-400')}
            </div>
            {selected.financialProjections && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-3">Financial Projections</h3>
                <div className="glass rounded-xl p-4">
                  {typeof selected.financialProjections === 'object' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(selected.financialProjections as Record<string, any>).slice(0, 8).map(([k, v]) => (
                        <div key={k} className="text-center">
                          <div className="text-xs text-slate-500 mb-1">{k.replace(/([A-Z])/g, ' $1')}</div>
                          <div className="text-sm font-bold text-yellow-400">{typeof v === 'string' ? v : JSON.stringify(v)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">{String(selected.financialProjections)}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => deletePlan(selected.id)} className="btn-ghost text-red-400 hover:text-red-300">
                🗑️ Delete Plan
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
