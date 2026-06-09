import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner, PageLoader } from '../components/ui/LoadingSpinner'

export function ResearchPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [niche, setNiche] = useState('')

  useEffect(() => {
    api.get<any[]>('/research').then(setReports).finally(() => setLoading(false))
  }, [])

  const analyze = async () => {
    if (!niche.trim()) return
    setAnalyzing(true)
    setShowModal(false)
    try {
      const report = await api.post<any>('/research/analyze', { niche })
      setReports(prev => [report, ...prev])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const deleteReport = async (id: string) => {
    await api.delete(`/research/${id}`)
    setReports(reports.filter(r => r.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon="🔍"
        title="Market Research"
        description="AI-powered competitor analysis, trend research, and market intelligence"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            🔍 Analyze Market
          </button>
        }
      />

      {analyzing && (
        <div className="card border border-brand-500/20 mb-6 flex items-center gap-4">
          <LoadingSpinner />
          <div>
            <div className="text-white font-medium">Analyzing market...</div>
            <div className="text-slate-400 text-sm">AI is researching competitors, trends, and opportunities</div>
          </div>
        </div>
      )}

      {reports.length === 0 && !analyzing ? (
        <EmptyState
          icon="🔍"
          title="No research reports yet"
          description="Enter a market niche and get instant competitor analysis, SWOT, trends, and keyword research"
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Analyze a Market</button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(report => (
            <div key={report.id} onClick={() => setSelected(report)} className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">🔍</div>
                <span className="text-xs text-slate-500 glass px-2 py-0.5 rounded-full">Research</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{report.title}</h3>
              <p className="text-sm text-slate-400 mb-4">Niche: <span className="text-brand-400">{report.niche}</span></p>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="glass rounded-lg p-2 text-center">
                  <div className="text-slate-500">Competitors</div>
                  <div className="text-white font-bold mt-0.5">
                    {Array.isArray(report.competitors) ? report.competitors.length : '—'}
                  </div>
                </div>
                <div className="glass rounded-lg p-2 text-center">
                  <div className="text-slate-500">Trends</div>
                  <div className="text-white font-bold mt-0.5">
                    {Array.isArray(report.trends) ? report.trends.length : '—'}
                  </div>
                </div>
                <div className="glass rounded-lg p-2 text-center">
                  <div className="text-slate-500">Keywords</div>
                  <div className="text-white font-bold mt-0.5">
                    {Array.isArray(report.keywords) ? report.keywords.length : '—'}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                {new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="🔍 Market Research Analysis">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Enter a market niche to get a comprehensive research report</p>
          <div>
            <label className="label">Market / Niche</label>
            <input
              className="input"
              placeholder="e.g., AI writing tools, SaaS for restaurants, freelance platforms..."
              value={niche}
              onChange={e => setNiche(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyze()}
            />
          </div>
          <div className="glass rounded-xl p-4 text-sm text-slate-400">
            <p className="font-medium text-white mb-2">Report includes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Top 5 competitors with strengths & weaknesses</li>
              <li>5 market trends</li>
              <li>Untapped opportunities</li>
              <li>High-value keywords</li>
              <li>SWOT analysis</li>
              <li>Risks & mitigation</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={analyze} disabled={!niche.trim()}>
              🔍 Analyze
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} size="xl">
        {selected && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {selected.swot && Object.keys(selected.swot).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">SWOT Analysis</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selected.swot as Record<string, any>).map(([key, value]) => {
                    const colors: Record<string, string> = {
                      strengths: 'border-green-500/20 bg-green-500/5',
                      weaknesses: 'border-red-500/20 bg-red-500/5',
                      opportunities: 'border-blue-500/20 bg-blue-500/5',
                      threats: 'border-orange-500/20 bg-orange-500/5',
                    }
                    return (
                      <div key={key} className={`rounded-xl p-3 border ${colors[key.toLowerCase()] || 'glass'}`}>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">{key}</div>
                        {Array.isArray(value) ? (
                          <ul className="text-xs text-slate-300 space-y-1">
                            {value.map((v: string, i: number) => <li key={i} className="flex gap-1.5"><span>•</span>{v}</li>)}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-300">{String(value)}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {Array.isArray(selected.competitors) && selected.competitors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Competitors</h3>
                <div className="space-y-2">
                  {selected.competitors.map((c: any, i: number) => (
                    <div key={i} className="glass rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium text-sm">{c.name || c}</span>
                        {c.website && <span className="text-xs text-brand-400">{c.website}</span>}
                      </div>
                      {c.strengths && <p className="text-xs text-green-400">✓ {Array.isArray(c.strengths) ? c.strengths.join(', ') : c.strengths}</p>}
                      {c.weaknesses && <p className="text-xs text-red-400">✗ {Array.isArray(c.weaknesses) ? c.weaknesses.join(', ') : c.weaknesses}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selected.trends) && selected.trends.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Market Trends</h3>
                <div className="space-y-2">
                  {selected.trends.map((t: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 glass rounded-lg p-3">
                      <span className="text-brand-400 text-sm flex-shrink-0">📈</span>
                      <p className="text-sm text-slate-300">{typeof t === 'string' ? t : t.trend || JSON.stringify(t)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selected.keywords) && selected.keywords.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.keywords.map((k: any, i: number) => (
                    <span key={i} className="glass px-3 py-1 rounded-full text-xs text-brand-300">
                      {typeof k === 'string' ? k : k.keyword || JSON.stringify(k)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => deleteReport(selected.id)} className="btn-ghost text-red-400 hover:text-red-300">
                🗑️ Delete Report
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
