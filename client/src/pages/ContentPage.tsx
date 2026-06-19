import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { SkeletonListPage } from '../components/ui/PageSkeletons'
import { MeshGradient } from '../components/ui/MeshGradient'

const CONTENT_TYPES = [
  { value: 'blog', label: 'Blog Post', icon: '📝' },
  { value: 'linkedin', label: 'LinkedIn Post', icon: '💼' },
  { value: 'twitter', label: 'Twitter Thread', icon: '🐦' },
  { value: 'newsletter', label: 'Newsletter', icon: '📧' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'landing_page', label: 'Landing Page', icon: '🌐' },
  { value: 'ad_copy', label: 'Ad Copy', icon: '📣' },
  { value: 'product_description', label: 'Product Description', icon: '🛍️' },
]

const TYPE_ICONS: Record<string, string> = Object.fromEntries(CONTENT_TYPES.map(t => [t.value, t.icon]))

const PLATFORM_CONFIG = [
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'from-blue-600/20 to-blue-800/10 border-blue-500/20', desc: 'Professional post + hashtags' },
  { key: 'twitter', label: 'X / Twitter', icon: '🐦', color: 'from-sky-600/20 to-sky-800/10 border-sky-500/20', desc: '6-8 tweet thread' },
  { key: 'newsletter', label: 'Newsletter', icon: '📧', color: 'from-orange-600/20 to-orange-800/10 border-orange-500/20', desc: 'Email-ready section' },
  { key: 'instagram', label: 'Instagram', icon: '📸', color: 'from-pink-600/20 to-pink-800/10 border-pink-500/20', desc: 'Carousel slides + hashtags' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', color: 'from-red-600/20 to-red-800/10 border-red-500/20', desc: 'Video script outline' },
  { key: 'podcast', label: 'Podcast', icon: '🎙️', color: 'from-violet-600/20 to-violet-800/10 border-violet-500/20', desc: 'Episode outline' },
]

const TABS = ['Library', 'Repurpose'] as const
type Tab = typeof TABS[number]

export function ContentPage() {
  const [tab, setTab] = useState<Tab>('Library')

  // Library tab state
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ type: 'blog', topic: '', tone: 'professional', audience: '', keywords: '' })

  // Repurpose tab state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'twitter', 'newsletter'])
  const [repForm, setRepForm] = useState({ sourceTopic: '', sourceType: 'blog', sourceContent: '', tone: 'professional', audience: 'startup founders' })
  const [repurposing, setRepurposing] = useState(false)
  const [repResults, setRepResults] = useState<Record<string, { content: string; tips: string }> | null>(null)
  const [activePlatform, setActivePlatform] = useState<string>('linkedin')
  const [useExistingContent, setUseExistingContent] = useState(false)
  const [selectedSource, setSelectedSource] = useState<string>('')

  useEffect(() => {
    api.get<any[]>('/content').then(setContent).finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    if (!form.topic.trim()) return
    setGenerating(true)
    setShowModal(false)
    try {
      const piece = await api.post<any>('/content/generate', form)
      setContent(prev => [piece, ...prev])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const deletePiece = async (id: string) => {
    await api.delete(`/content/${id}`)
    setContent(content.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  const repurpose = async () => {
    if (!repForm.sourceTopic.trim() && !repForm.sourceContent.trim()) return
    setRepurposing(true)
    try {
      const sourceContent = useExistingContent && selectedSource
        ? content.find(c => c.id === selectedSource)?.content || ''
        : repForm.sourceContent

      const result = await api.post<any>('/content/repurpose', {
        ...repForm,
        sourceContent,
        platforms: selectedPlatforms,
      })
      setRepResults(result)
      if (selectedPlatforms.length > 0) setActivePlatform(selectedPlatforms[0])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRepurposing(false)
    }
  }

  const filtered = filter === 'all' ? content : content.filter(c => c.type === filter)

  if (loading) return <SkeletonListPage />

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <MeshGradient />
      <PageHeader
        icon="✍️"
        title="Content Studio"
        description="AI-powered content generation and repurposing for every channel"
        action={tab === 'Library'
          ? <button onClick={() => setShowModal(true)} className="btn-primary">✍️ Generate Content</button>
          : undefined
        }
      />

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'Library' ? '📚 Library' : '♻️ Repurpose'}
          </button>
        ))}
      </div>

      {/* ── LIBRARY TAB ─────────────────────────────────────────────────── */}
      {tab === 'Library' && (
        <>
          {generating && (
            <div className="card border border-brand-500/20 mb-6 flex items-center gap-4">
              <LoadingSpinner />
              <div>
                <div className="text-white font-medium">Generating content...</div>
                <div className="text-slate-400 text-sm">AI is writing your content piece</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-brand-600 text-white' : 'glass text-slate-400 hover:text-white'}`}
            >
              All ({content.length})
            </button>
            {CONTENT_TYPES.map(type => {
              const count = content.filter(c => c.type === type.value).length
              if (count === 0) return null
              return (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === type.value ? 'bg-brand-600 text-white' : 'glass text-slate-400 hover:text-white'}`}
                >
                  {type.icon} {type.label} ({count})
                </button>
              )
            })}
          </div>

          {filtered.length === 0 ? (
            <EmptyStateAnimated
              icon="✍️"
              title="No content yet"
              description="Generate blogs, LinkedIn posts, Twitter threads, newsletters, and more with AI"
              action={{ label: 'Generate Content', onClick: () => setShowModal(true) }}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(piece => (
                <div key={piece.id} onClick={() => setSelected(piece)} className="card-hover">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{TYPE_ICONS[piece.type] || '📝'}</span>
                    <span className="text-xs glass px-2 py-0.5 rounded-full text-slate-400">
                      {CONTENT_TYPES.find(t => t.value === piece.type)?.label || piece.type}
                    </span>
                    <span className={`ml-auto badge ${piece.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      {piece.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{piece.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-4">{piece.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{new Date(piece.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={e => { e.stopPropagation(); setRepForm(f => ({ ...f, sourceTopic: piece.title, sourceContent: piece.content })); setSelectedSource(piece.id); setUseExistingContent(true); setTab('Repurpose') }}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      ♻️ Repurpose →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── REPURPOSE TAB ────────────────────────────────────────────────── */}
      {tab === 'Repurpose' && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left panel — inputs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4">♻️ Multi-Platform Repurposer</h2>
              <p className="text-xs text-slate-500 mb-4">Turn one piece of content into posts for every platform — with one click.</p>

              {/* Source content toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUseExistingContent(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${!useExistingContent ? 'bg-brand-600 text-white' : 'glass text-slate-400 hover:text-white'}`}
                >
                  New Topic
                </button>
                <button
                  onClick={() => setUseExistingContent(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${useExistingContent ? 'bg-brand-600 text-white' : 'glass text-slate-400 hover:text-white'}`}
                >
                  From Library ({content.length})
                </button>
              </div>

              {useExistingContent ? (
                <div className="mb-3">
                  <label className="label">Select Content</label>
                  <select
                    className="input"
                    value={selectedSource}
                    onChange={e => {
                      setSelectedSource(e.target.value)
                      const piece = content.find(c => c.id === e.target.value)
                      if (piece) setRepForm(f => ({ ...f, sourceTopic: piece.title, sourceType: piece.type }))
                    }}
                  >
                    <option value="">Choose from library...</option>
                    {content.map(c => (
                      <option key={c.id} value={c.id} className="bg-surface-900">
                        {TYPE_ICONS[c.type]} {c.title.substring(0, 60)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="label">Topic / Title</label>
                    <input
                      className="input"
                      placeholder="e.g. 5 Lessons from my first $10K MRR"
                      value={repForm.sourceTopic}
                      onChange={e => setRepForm(f => ({ ...f, sourceTopic: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="label">Content (optional — paste or leave blank)</label>
                    <textarea
                      className="input resize-none h-24 text-sm"
                      placeholder="Paste your blog post, article, or notes here..."
                      value={repForm.sourceContent}
                      onChange={e => setRepForm(f => ({ ...f, sourceContent: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="label">Tone</label>
                  <select className="input text-sm" value={repForm.tone} onChange={e => setRepForm(f => ({ ...f, tone: e.target.value }))}>
                    {['professional', 'casual', 'inspirational', 'educational', 'humorous'].map(t => (
                      <option key={t} value={t} className="bg-surface-900 capitalize">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Audience</label>
                  <input className="input text-sm" placeholder="startup founders" value={repForm.audience} onChange={e => setRepForm(f => ({ ...f, audience: e.target.value }))} />
                </div>
              </div>

              {/* Platform picker */}
              <div className="mb-4">
                <label className="label">Platforms to Repurpose For</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORM_CONFIG.map(p => (
                    <button
                      key={p.key}
                      onClick={() => togglePlatform(p.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                        selectedPlatforms.includes(p.key)
                          ? `bg-gradient-to-br ${p.color} text-white`
                          : 'border-white/10 glass text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className="text-base mb-0.5">{p.icon}</div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs opacity-70">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={repurpose}
                disabled={repurposing || selectedPlatforms.length === 0 || (!repForm.sourceTopic.trim() && (!useExistingContent || !selectedSource))}
                className="btn-primary w-full"
              >
                {repurposing ? (
                  <span className="flex items-center gap-2 justify-center"><LoadingSpinner size="sm" /> Repurposing for {selectedPlatforms.length} platforms...</span>
                ) : (
                  `♻️ Repurpose for ${selectedPlatforms.length} Platform${selectedPlatforms.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>

          {/* Right panel — results */}
          <div className="lg:col-span-3">
            {repResults ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPlatforms.map(key => {
                    const p = PLATFORM_CONFIG.find(p => p.key === key)
                    if (!p || !repResults[key]) return null
                    return (
                      <button
                        key={key}
                        onClick={() => setActivePlatform(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          activePlatform === key ? 'bg-brand-600 text-white' : 'glass text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.icon} {p.label}
                      </button>
                    )
                  })}
                  <button onClick={() => setRepResults(null)} className="ml-auto btn-ghost text-xs text-slate-500">← New repurpose</button>
                </div>

                {selectedPlatforms.filter(k => repResults[k]).map(key => {
                  const p = PLATFORM_CONFIG.find(p => p.key === key)
                  const result = repResults[key]
                  if (!p || !result) return null
                  return (
                    <div key={key} className={`${activePlatform === key ? '' : 'hidden'}`}>
                      <div className={`card border bg-gradient-to-br ${p.color}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{p.icon}</span>
                            <span className="font-semibold text-white">{p.label}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(result.content)}
                              className="btn-secondary text-xs py-1"
                            >
                              📋 Copy
                            </button>
                            <button
                              onClick={async () => {
                                await api.post('/content/generate', {
                                  type: key === 'twitter' ? 'twitter' : key === 'linkedin' ? 'linkedin' : key === 'newsletter' ? 'newsletter' : 'blog',
                                  topic: repForm.sourceTopic,
                                  tone: repForm.tone,
                                  audience: repForm.audience,
                                  keywords: '',
                                })
                                api.get<any[]>('/content').then(setContent)
                              }}
                              className="btn-secondary text-xs py-1"
                            >
                              💾 Save
                            </button>
                          </div>
                        </div>
                        <div className="glass rounded-xl p-4 max-h-72 overflow-y-auto">
                          <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{result.content}</pre>
                        </div>
                        {result.tips && (
                          <div className="mt-3 text-xs text-slate-500 flex items-start gap-1.5">
                            <span>💡</span>
                            <span>{result.tips}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 card text-center">
                <div className="text-5xl mb-4">♻️</div>
                <h3 className="text-lg font-semibold text-white mb-2">One Topic → Every Platform</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-4">
                  Write or paste content once. AI adapts it perfectly for LinkedIn, X, Newsletter, Instagram, YouTube, and Podcast — matching each platform's format and algorithm.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-600">
                  {PLATFORM_CONFIG.map(p => (
                    <span key={p.key}>{p.icon} {p.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="✍️ Generate Content" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Content Type</label>
            <div className="grid grid-cols-4 gap-2">
              {CONTENT_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setForm({ ...form, type: type.value })}
                  className={`p-3 rounded-xl border text-center transition-all ${form.type === type.value ? 'border-brand-500/50 bg-brand-600/15 text-white' : 'border-white/10 glass text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  <div className="text-xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Topic</label>
            <input className="input" placeholder="What should the content be about?" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tone</label>
              <select className="input" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>
                {['professional', 'casual', 'humorous', 'inspirational', 'educational', 'persuasive'].map(t => (
                  <option key={t} value={t} className="bg-surface-900 capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Target Audience</label>
              <input className="input" placeholder="e.g. Startup founders" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Keywords (optional)</label>
            <input className="input" placeholder="keyword1, keyword2, ..." value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={generate} disabled={!form.topic.trim()}>✍️ Generate</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} size="xl">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{TYPE_ICONS[selected.type] || '📝'}</span>
              <span className="badge glass">{CONTENT_TYPES.find(t => t.value === selected.type)?.label || selected.type}</span>
            </div>
            <div className="glass rounded-xl p-4 max-h-[50vh] overflow-y-auto">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{selected.content}</pre>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(selected.content)}
                  className="btn-secondary text-sm py-1.5"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => {
                    setRepForm(f => ({ ...f, sourceTopic: selected.title, sourceContent: selected.content }))
                    setSelected(null)
                    setTab('Repurpose')
                  }}
                  className="btn-secondary text-sm py-1.5"
                >
                  ♻️ Repurpose
                </button>
              </div>
              <button onClick={() => deletePiece(selected.id)} className="btn-ghost text-red-400 hover:text-red-300 text-sm">
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
