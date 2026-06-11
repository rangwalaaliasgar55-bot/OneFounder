import { useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'

const KPI_DATA = [
  { label: 'MRR', value: '$0', change: '—', icon: '💰', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { label: 'ARR', value: '$0', change: '—', icon: '📈', color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/20' },
  { label: 'Runway', value: '∞ mo', change: '—', icon: '🛫', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { label: 'Burn Rate', value: '$0/mo', change: '—', icon: '🔥', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { label: 'Valuation', value: 'TBD', change: '—', icon: '🏆', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { label: 'Investors', value: '0', change: '—', icon: '🤝', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
]

const PITCH_SECTIONS = [
  { id: 'problem', icon: '⚠️', label: 'Problem', placeholder: 'What painful problem are you solving and who suffers from it?' },
  { id: 'solution', icon: '💡', label: 'Solution', placeholder: 'How does your product uniquely solve this problem?' },
  { id: 'market', icon: '🌍', label: 'Market Size', placeholder: 'TAM, SAM, SOM — who is your addressable market?' },
  { id: 'traction', icon: '🚀', label: 'Traction', placeholder: 'Revenue, users, growth rate, key milestones…' },
  { id: 'business_model', icon: '💰', label: 'Business Model', placeholder: 'How do you make money? Pricing, unit economics…' },
  { id: 'competition', icon: '⚔️', label: 'Competition', placeholder: 'Who are the alternatives and what is your moat?' },
  { id: 'team', icon: '👥', label: 'Team', placeholder: 'Why are YOU the team to win this market?' },
  { id: 'ask', icon: '🎯', label: 'The Ask', placeholder: 'How much are you raising, at what terms, and how will you use it?' },
]

const STAGE_OPTIONS = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth', 'Profitable']
const INSTRUMENT_OPTIONS = ['SAFE', 'Convertible Note', 'Equity', 'Revenue Share', 'Grants']

interface CapEntry {
  id: string
  name: string
  type: 'founder' | 'investor' | 'employee' | 'advisor'
  shares: number
  percent: number
  stage: string
  note: string
}

export function InvestorPage() {
  const [activeTab, setActiveTab] = useState<'kpis' | 'pitch' | 'captable' | 'pipeline'>('kpis')
  const [pitchContent, setPitchContent] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [stage, setStage] = useState('Pre-seed')
  const [raising, setRaising] = useState('')
  const [instrument, setInstrument] = useState('SAFE')
  const [capTable, setCapTable] = useState<CapEntry[]>([
    { id: '1', name: 'Founder', type: 'founder', shares: 1000000, percent: 80, stage: 'Founding', note: 'Common stock' },
    { id: '2', name: 'ESOP Pool', type: 'employee', shares: 200000, percent: 16, stage: 'Founding', note: 'Employee option pool' },
    { id: '3', name: 'Advisor', type: 'advisor', shares: 50000, percent: 4, stage: 'Founding', note: 'Advisory shares' },
  ])
  const [showCapModal, setShowCapModal] = useState(false)
  const [capForm, setCapForm] = useState({ name: '', type: 'investor' as CapEntry['type'], shares: '', percent: '', stage: 'Seed', note: '' })
  const [pipeline, setPipeline] = useState([
    { id: '1', name: 'Angel Investor A', stage: 'Intro', amount: '$25K', notes: 'Warm intro via LinkedIn' },
    { id: '2', name: 'Seed Fund B', stage: 'DD', amount: '$150K', notes: 'Sent deck, awaiting reply' },
  ])
  const [showPipelineModal, setShowPipelineModal] = useState(false)
  const [pipelineForm, setPipelineForm] = useState({ name: '', stage: 'Intro', amount: '', notes: '' })

  const PIPELINE_STAGES = ['Outreach', 'Intro', 'Meeting', 'DD', 'Term Sheet', 'Closed', 'Passed']
  const STAGE_COLORS: Record<string, string> = {
    Outreach: 'bg-slate-500/20 text-slate-400',
    Intro: 'bg-blue-500/20 text-blue-400',
    Meeting: 'bg-violet-500/20 text-violet-400',
    DD: 'bg-yellow-500/20 text-yellow-400',
    'Term Sheet': 'bg-orange-500/20 text-orange-400',
    Closed: 'bg-green-500/20 text-green-400',
    Passed: 'bg-red-500/20 text-red-400',
  }

  const generateSection = async (sectionId: string, placeholder: string) => {
    setGenerating(sectionId)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a compelling investor pitch section for: "${placeholder}". Be specific, data-driven, and concise (3-5 sentences). Format it as if writing for a real pitch deck slide.`,
          mode: 'startup',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPitchContent(prev => ({ ...prev, [sectionId]: data.response || data.message || 'AI generated content will appear here.' }))
      } else {
        setPitchContent(prev => ({ ...prev, [sectionId]: placeholder }))
      }
    } catch {
      setPitchContent(prev => ({ ...prev, [sectionId]: placeholder }))
    } finally {
      setGenerating(null)
    }
  }

  const totalShares = capTable.reduce((s, r) => s + r.shares, 0)

  const addCapEntry = () => {
    if (!capForm.name || !capForm.shares) return
    setCapTable(prev => [...prev, {
      id: Date.now().toString(),
      name: capForm.name,
      type: capForm.type,
      shares: Number(capForm.shares),
      percent: Number(capForm.percent) || Math.round((Number(capForm.shares) / (totalShares + Number(capForm.shares))) * 100),
      stage: capForm.stage,
      note: capForm.note,
    }])
    setCapForm({ name: '', type: 'investor', shares: '', percent: '', stage: 'Seed', note: '' })
    setShowCapModal(false)
  }

  const addPipelineEntry = () => {
    if (!pipelineForm.name) return
    setPipeline(prev => [...prev, { id: Date.now().toString(), ...pipelineForm }])
    setPipelineForm({ name: '', stage: 'Intro', amount: '', notes: '' })
    setShowPipelineModal(false)
  }

  const TYPE_COLORS: Record<string, string> = {
    founder: 'bg-brand-500/20 text-brand-400',
    investor: 'bg-green-500/20 text-green-400',
    employee: 'bg-violet-500/20 text-violet-400',
    advisor: 'bg-yellow-500/20 text-yellow-400',
  }

  const exportPitch = () => {
    const lines = PITCH_SECTIONS.map(s =>
      `## ${s.label}\n${pitchContent[s.id] || '(not filled)'}`
    ).join('\n\n')
    const blob = new Blob([`# Pitch Deck — OneFounder\n\n${lines}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pitch-deck.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Investor Mode"
        subtitle="KPIs, pitch deck, cap table & fundraising pipeline"
        icon="💎"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="input text-xs py-1.5 px-2.5"
            >
              {STAGE_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <span className="badge badge-purple">{stage}</span>
          </div>
        }
      />

      {/* Fundraising bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Round</div>
        <div className="flex items-center gap-2 flex-1">
          <input
            className="input text-sm py-1.5 w-36"
            placeholder="Amount, e.g. $500K"
            value={raising}
            onChange={e => setRaising(e.target.value)}
          />
          <select
            value={instrument}
            onChange={e => setInstrument(e.target.value)}
            className="input text-sm py-1.5"
          >
            {INSTRUMENT_OPTIONS.map(i => <option key={i}>{i}</option>)}
          </select>
          {raising && (
            <span className="text-xs text-green-400 font-medium">
              Raising {raising} via {instrument}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {(['kpis', 'pitch', 'captable', 'pipeline'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'kpis' ? '📊 KPI Dashboard' : tab === 'pitch' ? '🎤 Pitch Deck' : tab === 'captable' ? '📑 Cap Table' : '🤝 Investor Pipeline'}
          </button>
        ))}
      </div>

      {/* KPI Dashboard */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {KPI_DATA.map(kpi => (
              <div key={kpi.label} className={`glass-card p-4 border ${kpi.border} space-y-2`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{kpi.icon}</span>
                  <span className="text-xs text-slate-500 font-medium">{kpi.label}</span>
                </div>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-slate-600">{kpi.change} vs last month</div>
              </div>
            ))}
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Fundraising Progress</h3>
              {raising && <span className="text-xs text-slate-500">Goal: {raising}</span>}
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-2.5">
              <div className="bg-gradient-to-r from-brand-500 to-violet-500 h-2.5 rounded-full" style={{ width: '0%' }} />
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>$0 raised</span>
              <span>{raising || 'Set a goal above'}</span>
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Investor Updates</h3>
            <p className="text-xs text-slate-500">Send monthly updates to keep investors engaged. Build the habit before you need them.</p>
            <div className="grid grid-cols-3 gap-3">
              {['Last Month Highlights', 'Key Metrics', 'Help Needed'].map(s => (
                <div key={s} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                  <div className="text-xs text-slate-400 font-medium mb-1">{s}</div>
                  <textarea className="w-full bg-transparent text-xs text-slate-300 resize-none outline-none h-16 placeholder-slate-700" placeholder="Write here…" />
                </div>
              ))}
            </div>
            <button className="btn-primary text-xs py-1.5 px-3">Send Investor Update</button>
          </div>
        </div>
      )}

      {/* Pitch Deck */}
      {activeTab === 'pitch' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Build your pitch deck section by section. Use AI to generate a first draft.</p>
            <button onClick={exportPitch} className="btn-ghost text-xs py-1.5 px-3 gap-1.5">
              ↓ Export as Markdown
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PITCH_SECTIONS.map(section => (
              <div key={section.id} className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{section.icon}</span>
                    <span className="text-sm font-semibold text-white">{section.label}</span>
                  </div>
                  <button
                    onClick={() => generateSection(section.id, section.placeholder)}
                    disabled={generating === section.id}
                    className="btn-ghost text-xs py-1 px-2.5 gap-1 text-brand-400 hover:text-brand-300 border border-brand-500/30"
                  >
                    {generating === section.id ? (
                      <><span className="animate-spin">⟳</span> Generating…</>
                    ) : (
                      <>✨ AI Draft</>
                    )}
                  </button>
                </div>
                <textarea
                  value={pitchContent[section.id] || ''}
                  onChange={e => setPitchContent(prev => ({ ...prev, [section.id]: e.target.value }))}
                  placeholder={section.placeholder}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-xs text-slate-300 placeholder-slate-700 resize-none outline-none focus:border-brand-500/50 transition-colors"
                  rows={5}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cap Table */}
      {activeTab === 'captable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Track ownership. Total shares: {totalShares.toLocaleString()}</p>
            <button onClick={() => setShowCapModal(true)} className="btn-primary text-xs py-1.5 px-3 gap-1.5">
              + Add Entry
            </button>
          </div>

          {/* Visual equity breakdown */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Equity Breakdown</h3>
            <div className="w-full flex h-4 rounded-full overflow-hidden gap-px">
              {capTable.map((entry, i) => {
                const colors = ['bg-brand-500', 'bg-violet-500', 'bg-yellow-500', 'bg-green-500', 'bg-cyan-500', 'bg-orange-500']
                return (
                  <div
                    key={entry.id}
                    className={`${colors[i % colors.length]} transition-all`}
                    style={{ width: `${entry.percent}%` }}
                    title={`${entry.name}: ${entry.percent}%`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {capTable.map((entry, i) => {
                const colors = ['bg-brand-500', 'bg-violet-500', 'bg-yellow-500', 'bg-green-500', 'bg-cyan-500', 'bg-orange-500']
                return (
                  <div key={entry.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className={`w-2 h-2 rounded-sm ${colors[i % colors.length]}`} />
                    {entry.name} ({entry.percent}%)
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-500">
                  <th className="text-left p-3 font-medium">Stakeholder</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-right p-3 font-medium">Shares</th>
                  <th className="text-right p-3 font-medium">%</th>
                  <th className="text-left p-3 font-medium">Stage</th>
                  <th className="text-left p-3 font-medium">Note</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {capTable.map(row => (
                  <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-medium text-white">{row.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${TYPE_COLORS[row.type]}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-300">{row.shares.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-300 font-semibold">{row.percent}%</td>
                    <td className="p-3 text-slate-400">{row.stage}</td>
                    <td className="p-3 text-slate-500">{row.note}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setCapTable(prev => prev.filter(r => r.id !== row.id))}
                        className="text-slate-700 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investor Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Track your fundraising conversations from first outreach to close.</p>
            <button onClick={() => setShowPipelineModal(true)} className="btn-primary text-xs py-1.5 px-3 gap-1.5">
              + Add Investor
            </button>
          </div>

          {/* Kanban-style pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Intro', 'Meeting', 'DD', 'Closed'].map(s => {
              const stageDeals = pipeline.filter(p => p.stage === s)
              return (
                <div key={s} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[s]}`}>{s}</span>
                    <span className="text-[10px] text-slate-600">{stageDeals.length}</span>
                  </div>
                  {stageDeals.map(deal => (
                    <div key={deal.id} className="glass-card p-3 space-y-1.5 border border-white/[0.04]">
                      <div className="text-xs font-semibold text-white">{deal.name}</div>
                      {deal.amount && <div className="text-xs text-green-400">{deal.amount}</div>}
                      {deal.notes && <div className="text-[10px] text-slate-500 leading-relaxed">{deal.notes}</div>}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Full list */}
          <div className="glass-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-500">
                  <th className="text-left p-3 font-medium">Investor</th>
                  <th className="text-left p-3 font-medium">Stage</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Notes</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {pipeline.map(deal => (
                  <tr key={deal.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-medium text-white">{deal.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STAGE_COLORS[deal.stage] || 'bg-slate-500/20 text-slate-400'}`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="p-3 text-green-400 font-medium">{deal.amount || '—'}</td>
                    <td className="p-3 text-slate-500">{deal.notes}</td>
                    <td className="p-3">
                      <select
                        value={deal.stage}
                        onChange={e => setPipeline(prev => prev.map(p => p.id === deal.id ? { ...p, stage: e.target.value } : p))}
                        className="bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-[10px] text-slate-400 outline-none"
                      >
                        {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cap Table Modal */}
      {showCapModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-semibold text-white">Add Cap Table Entry</h3>
            <div className="space-y-3">
              <input className="input w-full" placeholder="Name" value={capForm.name} onChange={e => setCapForm(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input" value={capForm.type} onChange={e => setCapForm(p => ({ ...p, type: e.target.value as CapEntry['type'] }))}>
                  {['founder', 'investor', 'employee', 'advisor'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input className="input" placeholder="Stage (e.g. Seed)" value={capForm.stage} onChange={e => setCapForm(p => ({ ...p, stage: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Shares" type="number" value={capForm.shares} onChange={e => setCapForm(p => ({ ...p, shares: e.target.value }))} />
                <input className="input" placeholder="% ownership" type="number" value={capForm.percent} onChange={e => setCapForm(p => ({ ...p, percent: e.target.value }))} />
              </div>
              <input className="input w-full" placeholder="Note (optional)" value={capForm.note} onChange={e => setCapForm(p => ({ ...p, note: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCapModal(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
              <button onClick={addCapEntry} className="btn-primary text-xs py-1.5 px-3">Add Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Modal */}
      {showPipelineModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-semibold text-white">Add Investor</h3>
            <div className="space-y-3">
              <input className="input w-full" placeholder="Investor / Fund name" value={pipelineForm.name} onChange={e => setPipelineForm(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input" value={pipelineForm.stage} onChange={e => setPipelineForm(p => ({ ...p, stage: e.target.value }))}>
                  {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
                <input className="input" placeholder="Amount (e.g. $50K)" value={pipelineForm.amount} onChange={e => setPipelineForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <textarea className="input w-full resize-none" placeholder="Notes…" rows={3} value={pipelineForm.notes} onChange={e => setPipelineForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPipelineModal(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
              <button onClick={addPipelineEntry} className="btn-primary text-xs py-1.5 px-3">Add Investor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
