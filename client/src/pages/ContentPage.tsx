import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner, PageLoader } from '../components/ui/LoadingSpinner'

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

export function ContentPage() {
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ type: 'blog', topic: '', tone: 'professional', audience: '', keywords: '' })

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

  const filtered = filter === 'all' ? content : content.filter(c => c.type === filter)

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon="✍️"
        title="Content Studio"
        description="AI-powered content generation for every channel"
        action={<button onClick={() => setShowModal(true)} className="btn-primary">✍️ Generate Content</button>}
      />

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
        <EmptyState
          icon="✍️"
          title="No content yet"
          description="Generate blogs, LinkedIn posts, Twitter threads, newsletters, and more with AI"
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Generate Content</button>}
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
              <div className="mt-3 text-xs text-slate-500">{new Date(piece.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

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
              <input className="input" placeholder="e.g., Startup founders" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} />
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
