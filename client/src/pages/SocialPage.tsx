import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner, PageLoader } from '../components/ui/LoadingSpinner'

const PLATFORMS = [
  { id: 'all', label: 'All', icon: '📱' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'twitter', label: 'X / Twitter', icon: '🐦', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'facebook', label: 'Facebook', icon: '👥', color: 'text-brand-400', bg: 'bg-brand-500/10' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-400',
  scheduled: 'bg-amber-500/20 text-amber-400',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
}

const TONES = ['professional', 'casual', 'inspirational', 'educational', 'promotional', 'storytelling']

export function SocialPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activePlatform, setActivePlatform] = useState('all')
  const [showComposer, setShowComposer] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [editContent, setEditContent] = useState('')

  const [composeForm, setComposeForm] = useState({
    platform: 'linkedin', content: '', hashtags: '', scheduledAt: ''
  })
  const [genForm, setGenForm] = useState({
    platform: 'linkedin', topic: '', tone: 'professional', businessContext: ''
  })

  useEffect(() => {
    api.get<any[]>('/social').then(setPosts).finally(() => setLoading(false))
  }, [])

  const createPost = async () => {
    const post = await api.post<any>('/social', {
      ...composeForm,
      hashtags: composeForm.hashtags.split(' ').filter(Boolean).map(t => t.replace('#', '')),
    })
    setPosts(prev => [post, ...prev])
    setShowComposer(false)
    setComposeForm({ platform: 'linkedin', content: '', hashtags: '', scheduledAt: '' })
  }

  const generatePost = async () => {
    setGenerating(true)
    setShowGenerator(false)
    try {
      const post = await api.post<any>('/social/generate', genForm)
      setPosts(prev => [post, ...prev])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const updatePost = async (id: string, updates: any) => {
    const updated = await api.patch<any>(`/social/${id}`, updates)
    setPosts(posts.map(p => p.id === id ? updated : p))
    if (selected?.id === id) setSelected(updated)
  }

  const deletePost = async (id: string) => {
    await api.delete(`/social/${id}`)
    setPosts(posts.filter(p => p.id !== id))
    setSelected(null)
  }

  const openPost = (post: any) => {
    setSelected(post)
    setEditContent(post.content)
  }

  if (loading) return <PageLoader />

  const filtered = activePlatform === 'all' ? posts : posts.filter(p => p.platform === activePlatform)

  const getPlatform = (id: string) => PLATFORMS.find(p => p.id === id)

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    draft: posts.filter(p => p.status === 'draft').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon="📱"
        title="Social Media Manager"
        description="Create, schedule, and track posts across all your platforms with AI"
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowComposer(true)} className="btn-secondary text-sm">
              ✏️ Compose
            </button>
            <button onClick={() => setShowGenerator(true)} className="btn-primary text-sm">
              ✨ AI Generate
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Posts', value: stats.total, color: 'text-white' },
          { label: 'Published', value: stats.published, color: 'text-green-400' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-amber-400' },
          { label: 'Drafts', value: stats.draft, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {generating && (
        <div className="card border border-brand-500/20 mb-6 flex items-center gap-4">
          <LoadingSpinner />
          <div>
            <div className="text-white font-medium">Generating post...</div>
            <div className="text-slate-400 text-sm">AI is crafting your {genForm.platform} post</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activePlatform === p.id
                ? 'bg-brand-600 text-white'
                : 'glass text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
            {p.id !== 'all' && (
              <span className="text-xs opacity-60 ml-1">
                {posts.filter(post => post.platform === p.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyStateAnimated
          icon="📱"
          title="No posts yet"
          description="Create your first social media post manually or generate one with AI"
          action={{ label: '✨ AI Generate', onClick: () => setShowGenerator(true) }}
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(post => {
            const platform = getPlatform(post.platform)
            return (
              <div key={post.id} onClick={() => openPost(post)} className="card-hover group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium ${platform?.bg || 'bg-white/5'} ${platform?.color || 'text-slate-300'}`}>
                    <span>{platform?.icon}</span>
                    <span>{platform?.label || post.platform}</span>
                  </div>
                  <span className={`badge ${STATUS_COLORS[post.status] || 'bg-slate-500/20 text-slate-400'}`}>
                    {post.status}
                  </span>
                </div>

                <p className="text-sm text-slate-300 line-clamp-4 mb-3 leading-relaxed">{post.content}</p>

                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(post.hashtags as string[]).slice(0, 4).map((tag: string) => (
                      <span key={tag} className="text-xs text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                    {post.hashtags.length > 4 && (
                      <span className="text-xs text-slate-500">+{post.hashtags.length - 4} more</span>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-600">
                  {post.scheduledAt
                    ? `Scheduled: ${new Date(post.scheduledAt).toLocaleDateString()}`
                    : new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showComposer} onClose={() => setShowComposer(false)} title="✏️ Compose Post" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.slice(1).map(p => (
                <button
                  key={p.id}
                  onClick={() => setComposeForm(f => ({ ...f, platform: p.id }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    composeForm.platform === p.id
                      ? `${p.bg} ${p.color} border border-current/20`
                      : 'glass text-slate-400 hover:text-white'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea
              className="input resize-none h-40"
              placeholder="What's on your mind? Share your story, insight, or update..."
              value={composeForm.content}
              onChange={e => setComposeForm(f => ({ ...f, content: e.target.value }))}
            />
            <div className="text-xs text-slate-600 text-right mt-1">{composeForm.content.length} chars</div>
          </div>
          <div>
            <label className="label">Hashtags (space separated)</label>
            <input
              className="input"
              placeholder="#startup #founder #entrepreneurship"
              value={composeForm.hashtags}
              onChange={e => setComposeForm(f => ({ ...f, hashtags: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Schedule For (optional)</label>
            <input
              type="datetime-local"
              className="input"
              value={composeForm.scheduledAt}
              onChange={e => setComposeForm(f => ({ ...f, scheduledAt: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowComposer(false)}>Cancel</button>
            <button className="btn-primary" onClick={createPost} disabled={!composeForm.content.trim()}>
              {composeForm.scheduledAt ? '📅 Schedule Post' : '📤 Save Draft'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showGenerator} onClose={() => setShowGenerator(false)} title="✨ AI Post Generator" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.slice(1).map(p => (
                <button
                  key={p.id}
                  onClick={() => setGenForm(f => ({ ...f, platform: p.id }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    genForm.platform === p.id
                      ? `${p.bg} ${p.color} border border-current/20`
                      : 'glass text-slate-400 hover:text-white'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">What do you want to post about?</label>
            <textarea
              className="input resize-none h-24"
              placeholder="e.g. We just launched our MVP after 3 months of building. Here's what I learned..."
              value={genForm.topic}
              onChange={e => setGenForm(f => ({ ...f, topic: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setGenForm(f => ({ ...f, tone: t }))}
                    className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                      genForm.tone === t
                        ? 'bg-brand-600 text-white'
                        : 'glass text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Business Context</label>
              <input
                className="input"
                placeholder="SaaS founder, B2B startup..."
                value={genForm.businessContext}
                onChange={e => setGenForm(f => ({ ...f, businessContext: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowGenerator(false)}>Cancel</button>
            <button className="btn-primary" onClick={generatePost} disabled={!genForm.topic.trim()}>
              ✨ Generate Post
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Edit Post" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {(() => {
                const p = getPlatform(selected.platform)
                return (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${p?.bg} ${p?.color}`}>
                    {p?.icon} {p?.label}
                  </div>
                )
              })()}
              <select
                className="glass px-3 py-1.5 rounded-lg text-sm text-slate-300 bg-transparent cursor-pointer"
                value={selected.status}
                onChange={e => updatePost(selected.id, { status: e.target.value })}
              >
                {['draft', 'scheduled', 'published', 'failed'].map(s => (
                  <option key={s} value={s} className="bg-gray-900">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Content</label>
              <textarea
                className="input resize-none h-40"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
              />
              <div className="text-xs text-slate-600 text-right mt-1">{editContent.length} chars</div>
            </div>

            {selected.hashtags && selected.hashtags.length > 0 && (
              <div>
                <label className="label">Hashtags</label>
                <div className="flex flex-wrap gap-1">
                  {(selected.hashtags as string[]).map((tag: string) => (
                    <span key={tag} className="text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => deletePost(selected.id)} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">
                🗑️ Delete
              </button>
              <button
                onClick={() => { updatePost(selected.id, { content: editContent }); setSelected(null) }}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
