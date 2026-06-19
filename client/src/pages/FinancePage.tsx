import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { SkeletonListPage } from '../components/ui/PageSkeletons'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'
import { AnimatedBarChart } from '../components/ui/AnimatedBarChart'
import { MeshGradient } from '../components/ui/MeshGradient'

const CATEGORIES = {
  revenue: ['Sales', 'Consulting', 'Subscription', 'Services', 'Affiliate', 'Other'],
  expense: ['Marketing', 'Tools & Software', 'Infrastructure', 'Payroll', 'Office', 'Legal', 'Accounting', 'Other'],
  subscription: ['Product', 'Addon', 'Enterprise', 'Lifetime', 'Other'],
}

const TYPE_CONFIG = {
  revenue: { label: 'Revenue', icon: '💰', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  expense: { label: 'Expense', icon: '💸', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  subscription: { label: 'MRR', icon: '🔄', color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/20' },
}

export function FinancePage() {
  const [entries, setEntries] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState({
    type: 'revenue', amount: '', description: '', category: 'Sales', recurring: false, recurringInterval: 'monthly', date: new Date().toISOString().split('T')[0]
  })

  const load = () => Promise.all([
    api.get<any[]>('/finance'),
    api.get<any>('/finance/summary'),
  ]).then(([e, s]) => { setEntries(e); setSummary(s) })

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const createEntry = async () => {
    await api.post('/finance', form)
    setShowModal(false)
    setForm({ type: 'revenue', amount: '', description: '', category: 'Sales', recurring: false, recurringInterval: 'monthly', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const deleteEntry = async (id: string) => {
    await api.delete(`/finance/${id}`)
    setEntries(entries.filter(e => e.id !== id))
    load()
  }

  if (loading) return <SkeletonListPage />

  const filtered = filterType === 'all' ? entries : entries.filter(e => e.type === filterType)

  const groupByMonth = (entries: any[]) => {
    const groups: Record<string, any[]> = {}
    entries.forEach(e => {
      const key = new Date(e.date).toLocaleDateString('en', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })
    return groups
  }

  const monthGroups = groupByMonth(filtered)

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <MeshGradient />
      <PageHeader
        icon="💰"
        title="Finance Tracker"
        description="Track revenue, expenses, and MRR for your startup"
        action={<button onClick={() => setShowModal(true)} className="btn-primary">+ Add Entry</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card-3d bg-gradient-to-br from-brand-600/10 to-brand-800/5 border border-brand-500/20">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">🔄 Monthly Recurring Revenue</div>
          <div className="text-2xl font-bold text-brand-400">
            $<AnimatedCounter value={summary?.mrr || 0} decimals={2} duration={1000} />
          </div>
          <div className="text-xs text-slate-500 mt-1">ARR: ${((summary?.mrr || 0) * 12).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card-3d bg-gradient-to-br from-green-600/10 to-green-800/5 border border-green-500/20">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">💰 This Month Revenue</div>
          <div className="text-2xl font-bold text-green-400">
            $<AnimatedCounter value={summary?.monthRevenue || 0} decimals={2} duration={1000} />
          </div>
        </div>
        <div className="stat-card-3d bg-gradient-to-br from-red-600/10 to-red-800/5 border border-red-500/20">
          <div className="text-xs text-slate-400 mb-1">💸 This Month Expenses</div>
          <div className="text-2xl font-bold text-red-400">
            $<AnimatedCounter value={summary?.monthExpenses || 0} decimals={2} duration={1000} />
          </div>
        </div>
        <div className={`stat-card-3d bg-gradient-to-br ${(summary?.profit || 0) >= 0 ? 'from-emerald-600/10 to-emerald-800/5 border border-emerald-500/20' : 'from-red-600/10 to-red-800/5 border border-red-500/20'}`}>
          <div className="text-xs text-slate-400 mb-1">📊 Net Profit (Month)</div>
          <div className={`text-2xl font-bold ${(summary?.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {(summary?.profit || 0) >= 0 ? '+' : ''}${summary?.profit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'revenue', 'expense', 'subscription'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-all font-medium ${
              filterType === t
                ? 'bg-brand-600 text-white'
                : 'glass text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {t === 'all' ? '📋 All' : t === 'revenue' ? '💰 Revenue' : t === 'expense' ? '💸 Expenses' : '🔄 Subscriptions'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyStateAnimated
          icon="💰"
          title="No entries yet"
          description="Track your first revenue or expense to get started"
          action={{ label: 'Add Entry', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(monthGroups).map(([month, monthEntries]) => {
            const monthRevenue = monthEntries.filter(e => e.type === 'revenue' || e.type === 'subscription').reduce((s, e) => s + e.amount, 0)
            const monthExpense = monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
            return (
              <div key={month}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-400">{month}</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-400">+${monthRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                    <span className="text-red-400">-${monthExpense.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                  </div>
                </div>
                <div className="card divide-y divide-white/5 p-0 overflow-hidden">
                  {monthEntries.map(entry => {
                    const cfg = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG]
                    return (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${cfg.bg}`}>
                            {cfg.icon}
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">{entry.description}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span>{entry.category}</span>
                              {entry.recurring && <span className="text-brand-400">↻ {entry.recurringInterval}</span>}
                              <span>{new Date(entry.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold ${entry.type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                            {entry.type === 'expense' ? '-' : '+'}${Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`badge ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="btn-ghost p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Finance Entry" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {(['revenue', 'expense', 'subscription'] as const).map(t => {
                const cfg = TYPE_CONFIG[t]
                return (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t, category: CATEGORIES[t][0] }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      form.type === t
                        ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                        : 'glass text-slate-400 hover:text-white'
                    }`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <input
                className="input"
                placeholder="e.g. Monthly subscription from Acme Corp"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES[form.type as keyof typeof CATEGORIES].map(c => (
                  <option key={c} value={c} className="bg-gray-900">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Recurring?</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))}
                  className={`w-11 h-6 rounded-full transition-all ${form.recurring ? 'bg-brand-600' : 'bg-white/10'} relative`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.recurring ? 'left-6' : 'left-1'}`} />
                </button>
                {form.recurring && (
                  <select
                    className="input py-1"
                    value={form.recurringInterval}
                    onChange={e => setForm(f => ({ ...f, recurringInterval: e.target.value }))}
                  >
                    {['monthly', 'yearly', 'weekly'].map(i => (
                      <option key={i} value={i} className="bg-gray-900">{i}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={createEntry}
              disabled={!form.amount || !form.description}
            >
              Add Entry
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
