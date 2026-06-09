import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner, PageLoader } from '../components/ui/LoadingSpinner'

const DIFFICULTY_COLOR = (d: number | null) => {
  if (!d) return 'text-slate-400'
  if (d < 30) return 'text-green-400'
  if (d < 60) return 'text-amber-400'
  return 'text-red-400'
}

const DIFFICULTY_LABEL = (d: number | null) => {
  if (!d) return '—'
  if (d < 30) return 'Easy'
  if (d < 60) return 'Medium'
  return 'Hard'
}

const RANK_BADGE = (rank: number | null) => {
  if (!rank) return null
  if (rank <= 3) return 'bg-yellow-500/20 text-yellow-400'
  if (rank <= 10) return 'bg-green-500/20 text-green-400'
  if (rank <= 30) return 'bg-blue-500/20 text-blue-400'
  return 'bg-slate-500/20 text-slate-400'
}

export function SeoPage() {
  const [keywords, setKeywords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [suggesting, setSuggesting] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const [showBrief, setShowBrief] = useState(false)
  const [brief, setBrief] = useState<any>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [briefKeyword, setBriefKeyword] = useState('')

  const [addForm, setAddForm] = useState({
    keyword: '', targetUrl: '', volume: '', difficulty: '', currentRank: '', targetRank: '', notes: ''
  })
  const [suggestForm, setSuggestForm] = useState({ niche: '', seedKeyword: '' })
  const [briefForm, setBriefForm] = useState({ keyword: '', targetAudience: '', businessContext: '' })

  useEffect(() => {
    api.get<any[]>('/seo').then(setKeywords).finally(() => setLoading(false))
  }, [])

  const addKeyword = async () => {
    const kw = await api.post<any>('/seo', addForm)
    setKeywords(prev => [kw, ...prev])
    setShowAdd(false)
    setAddForm({ keyword: '', targetUrl: '', volume: '', difficulty: '', currentRank: '', targetRank: '', notes: '' })
  }

  const suggestKeywords = async () => {
    setSuggesting(true)
    setShowSuggest(false)
    try {
      const newKws = await api.post<any[]>('/seo/suggest', suggestForm)
      setKeywords(prev => [...newKws, ...prev])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSuggesting(false)
    }
  }

  const generateBrief = async () => {
    setBriefLoading(true)
    try {
      const result = await api.post<any>('/seo/brief', briefForm)
      setBrief(result)
      setBriefKeyword(briefForm.keyword)
      setShowBrief(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setBriefLoading(false)
    }
  }

  const deleteKeyword = async (id: string) => {
    await api.delete(`/seo/${id}`)
    setKeywords(keywords.filter(k => k.id !== id))
  }

  const updateRank = async (id: string, rank: number) => {
    const updated = await api.patch<any>(`/seo/${id}`, { currentRank: rank })
    setKeywords(keywords.map(k => k.id === id ? updated : k))
  }

  if (loading) return <PageLoader />

  const avgDifficulty = keywords.length
    ? Math.round(keywords.filter(k => k.difficulty).reduce((s, k) => s + k.difficulty, 0) / keywords.filter(k => k.difficulty).length)
    : 0

  const top10 = keywords.filter(k => k.currentRank && k.currentRank <= 10).length
  const totalVolume = keywords.filter(k => k.volume).reduce((s, k) => s + k.volume, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon="🔍"
        title="SEO OS"
        description="Track keywords, monitor rankings, and generate content briefs with AI"
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowBrief(true)} className="btn-secondary text-sm">
              📝 Content Brief
            </button>
            <button onClick={() => setShowSuggest(true)} className="btn-secondary text-sm">
              🤖 AI Suggest
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
              + Add Keyword
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tracked Keywords', value: keywords.length, color: 'text-white', icon: '🔑' },
          { label: 'Total Search Volume', value: totalVolume > 1000 ? `${(totalVolume/1000).toFixed(1)}K` : totalVolume, color: 'text-brand-400', icon: '📊' },
          { label: 'Avg Difficulty', value: avgDifficulty ? `${avgDifficulty}/100` : '—', color: DIFFICULTY_COLOR(avgDifficulty), icon: '💪' },
          { label: 'Top 10 Rankings', value: top10, color: 'text-green-400', icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {suggesting && (
        <div className="card border border-brand-500/20 mb-6 flex items-center gap-4">
          <LoadingSpinner />
          <div>
            <div className="text-white font-medium">Finding keyword opportunities...</div>
            <div className="text-slate-400 text-sm">AI is researching keywords for your niche</div>
          </div>
        </div>
      )}

      {briefLoading && (
        <div className="card border border-violet-500/20 mb-6 flex items-center gap-4">
          <LoadingSpinner />
          <div>
            <div className="text-white font-medium">Generating content brief...</div>
            <div className="text-slate-400 text-sm">AI is building your SEO content brief</div>
          </div>
        </div>
      )}

      {brief && (
        <div className="card border border-violet-500/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">📝 Content Brief: <span className="text-violet-400">"{briefKeyword}"</span></h3>
              <p className="text-xs text-slate-500 mt-0.5">Recommended: {brief.wordCount} words</p>
            </div>
            <button onClick={() => setBrief(null)} className="btn-ghost p-1.5 text-slate-500">✕</button>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Title Options</div>
                {(brief.titles || []).map((t: string, i: number) => (
                  <div key={i} className="glass rounded-lg px-3 py-2 text-sm text-slate-300 mb-1.5">{t}</div>
                ))}
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Meta Description</div>
                <div className="glass rounded-lg px-3 py-2 text-sm text-slate-300">{brief.metaDescription}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Content Outline</div>
              <div className="space-y-1.5">
                {(brief.outline || []).map((h: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-brand-400 font-mono text-xs mt-0.5 w-5">{i + 1}.</span>
                    <span className="text-slate-300">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Key Points</div>
                {(brief.keyPoints || []).map((p: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300 mb-1.5">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Related Keywords</div>
                <div className="flex flex-wrap gap-1.5">
                  {(brief.relatedKeywords || []).map((kw: string) => (
                    <span key={kw} className="text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {keywords.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No keywords tracked yet"
          description="Add keywords to track rankings or use AI to discover opportunities"
          action={
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(true)} className="btn-secondary">Add Keyword</button>
              <button onClick={() => setShowSuggest(true)} className="btn-primary">🤖 AI Suggest</button>
            </div>
          }
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/10">
                <th className="px-4 py-3 font-medium">Keyword</th>
                <th className="px-4 py-3 font-medium">Volume</th>
                <th className="px-4 py-3 font-medium">Difficulty</th>
                <th className="px-4 py-3 font-medium">Current Rank</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Target URL</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {keywords.map(kw => {
                const rankBadge = RANK_BADGE(kw.currentRank)
                return (
                  <tr key={kw.id} className="hover:bg-white/3 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="text-sm text-white font-medium">{kw.keyword}</div>
                      {kw.notes && <div className="text-xs text-slate-500 mt-0.5">{kw.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {kw.volume ? (kw.volume > 1000 ? `${(kw.volume/1000).toFixed(1)}K` : kw.volume) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {kw.difficulty !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${kw.difficulty < 30 ? 'bg-green-400' : kw.difficulty < 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${kw.difficulty}%` }}
                            />
                          </div>
                          <span className={`text-xs ${DIFFICULTY_COLOR(kw.difficulty)}`}>
                            {DIFFICULTY_LABEL(kw.difficulty)}
                          </span>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {rankBadge ? (
                        <span className={`badge ${rankBadge}`}>#{kw.currentRank}</span>
                      ) : (
                        <span className="text-slate-600 text-sm">{kw.currentRank ? `#${kw.currentRank}` : '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {kw.targetRank ? `#${kw.targetRank}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {kw.targetUrl ? (
                        <a
                          href={kw.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-400 hover:text-brand-300 truncate max-w-32 block"
                          onClick={e => e.stopPropagation()}
                        >
                          {kw.targetUrl.replace(/^https?:\/\//, '')}
                        </a>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteKeyword(kw.id)}
                        className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="+ Add Keyword" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Keyword</label>
            <input className="input" placeholder="e.g. best project management software" value={addForm.keyword} onChange={e => setAddForm(f => ({...f, keyword: e.target.value}))} />
          </div>
          {[
            { key: 'volume', label: 'Monthly Volume', placeholder: '1200', type: 'number' },
            { key: 'difficulty', label: 'Difficulty (0-100)', placeholder: '35', type: 'number' },
            { key: 'currentRank', label: 'Current Rank', placeholder: '24', type: 'number' },
            { key: 'targetRank', label: 'Target Rank', placeholder: '5', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input type={f.type} className="input" placeholder={f.placeholder} value={(addForm as any)[f.key]} onChange={e => setAddForm(prev => ({...prev, [f.key]: e.target.value}))} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="label">Target URL</label>
            <input className="input" placeholder="https://yoursite.com/blog/post" value={addForm.targetUrl} onChange={e => setAddForm(f => ({...f, targetUrl: e.target.value}))} />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <input className="input" placeholder="Intent: informational, priority: high..." value={addForm.notes} onChange={e => setAddForm(f => ({...f, notes: e.target.value}))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary" onClick={addKeyword} disabled={!addForm.keyword}>Add Keyword</button>
        </div>
      </Modal>

      <Modal isOpen={showSuggest} onClose={() => setShowSuggest(false)} title="🤖 AI Keyword Research" size="md">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">AI will find 10 keyword opportunities for your niche.</p>
          <div>
            <label className="label">Your Niche / Industry</label>
            <input className="input" placeholder="e.g. project management, email marketing, SaaS tools" value={suggestForm.niche} onChange={e => setSuggestForm(f => ({...f, niche: e.target.value}))} />
          </div>
          <div>
            <label className="label">Seed Keyword</label>
            <input className="input" placeholder="e.g. task management" value={suggestForm.seedKeyword} onChange={e => setSuggestForm(f => ({...f, seedKeyword: e.target.value}))} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowSuggest(false)}>Cancel</button>
            <button className="btn-primary" onClick={suggestKeywords} disabled={!suggestForm.niche || !suggestForm.seedKeyword}>
              🔍 Find Keywords
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showBrief} onClose={() => setShowBrief(false)} title="📝 Generate Content Brief" size="md">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Generate a detailed SEO content brief for any keyword.</p>
          <div>
            <label className="label">Target Keyword</label>
            <input className="input" placeholder="e.g. best crm for startups" value={briefForm.keyword} onChange={e => setBriefForm(f => ({...f, keyword: e.target.value}))} />
          </div>
          <div>
            <label className="label">Target Audience</label>
            <input className="input" placeholder="e.g. early-stage founders, SaaS founders" value={briefForm.targetAudience} onChange={e => setBriefForm(f => ({...f, targetAudience: e.target.value}))} />
          </div>
          <div>
            <label className="label">Business Context</label>
            <input className="input" placeholder="e.g. B2B SaaS startup with CRM product" value={briefForm.businessContext} onChange={e => setBriefForm(f => ({...f, businessContext: e.target.value}))} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowBrief(false)}>Cancel</button>
            <button className="btn-primary" onClick={generateBrief} disabled={!briefForm.keyword}>
              📝 Generate Brief
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
