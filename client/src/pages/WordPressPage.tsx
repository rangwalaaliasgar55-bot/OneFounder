import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

interface WPSite {
  id: string
  siteUrl: string
  siteName: string
  username: string
  status: string
  createdAt: string
}

interface WPPost {
  id: number
  title: { rendered: string }
  status: string
  date: string
  link: string
  excerpt: { rendered: string }
}

type Tab = 'connect' | 'posts' | 'seo'

export function WordPressPage() {
  const [sites, setSites] = useState<WPSite[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('connect')
  const [selectedSite, setSelectedSite] = useState<WPSite | null>(null)
  const [posts, setPosts] = useState<WPPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)

  const [form, setForm] = useState({ siteUrl: '', siteName: '', username: '', applicationPassword: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [newPost, setNewPost] = useState({ title: '', content: '', status: 'draft' })
  const [postSaving, setPostSaving] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)

  useEffect(() => {
    api.get<WPSite[]>('/wordpress/sites').then(data => {
      setSites(data)
      if (data.length > 0) setSelectedSite(data[0])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedSite && tab === 'posts') loadPosts()
  }, [selectedSite, tab])

  const loadPosts = async () => {
    if (!selectedSite) return
    setPostsLoading(true)
    try {
      const data = await api.get<WPPost[]>(`/wordpress/sites/${selectedSite.id}/posts`)
      setPosts(data)
    } catch {} finally { setPostsLoading(false) }
  }

  const connectSite = async () => {
    if (!form.siteUrl) return setError('Site URL is required')
    setSaving(true)
    setError('')
    try {
      const site = await api.post<WPSite>('/wordpress/sites', form)
      setSites(prev => [...prev, site])
      setSelectedSite(site)
      setForm({ siteUrl: '', siteName: '', username: '', applicationPassword: '' })
      setTab('posts')
    } catch (e: any) { setError(e.message || 'Failed to connect site') } finally { setSaving(false) }
  }

  const deleteSite = async (id: string) => {
    if (!confirm('Remove this site?')) return
    await api.delete(`/wordpress/sites/${id}`)
    setSites(prev => prev.filter(s => s.id !== id))
    if (selectedSite?.id === id) setSelectedSite(sites.find(s => s.id !== id) || null)
  }

  const createPost = async () => {
    if (!selectedSite || !newPost.title) return
    setPostSaving(true)
    try {
      await api.post(`/wordpress/sites/${selectedSite.id}/posts`, newPost)
      setNewPost({ title: '', content: '', status: 'draft' })
      setShowNewPost(false)
      loadPosts()
    } catch {} finally { setPostSaving(false) }
  }

  const getSeoScore = (post: WPPost) => {
    const title = post.title.rendered || ''
    const excerpt = post.excerpt.rendered || ''
    let score = 40
    if (title.length >= 40 && title.length <= 60) score += 20
    if (excerpt.length > 100) score += 20
    if (title.length > 0) score += 10
    if (post.status === 'publish') score += 10
    return Math.min(score, 100)
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'connect', label: 'Connect', icon: '🔗' },
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'seo', label: 'SEO Scores', icon: '🔎' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader icon="🌐" title="Website Manager" description="Manage your WordPress sites, posts and SEO" />

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-brand-600/20 border border-brand-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'connect' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Connect WordPress Site</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Site URL *</label>
                <input className="input w-full" placeholder="https://yoursite.com" value={form.siteUrl}
                  onChange={e => setForm(f => ({ ...f, siteUrl: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Site Name</label>
                <input className="input w-full" placeholder="My Blog" value={form.siteName}
                  onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">WordPress Username</label>
                <input className="input w-full" placeholder="admin" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Application Password</label>
                <input className="input w-full" type="password" placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  value={form.applicationPassword}
                  onChange={e => setForm(f => ({ ...f, applicationPassword: e.target.value }))} />
                <p className="text-xs text-slate-600 mt-1">Generate in WordPress → Users → Profile → Application Passwords</p>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button onClick={connectSite} disabled={saving} className="btn-primary">
                {saving ? <LoadingSpinner size="sm" /> : '+ Connect Site'}
              </button>
            </div>
          </div>

          {sites.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4">Connected Sites</h2>
              <div className="space-y-2">
                {sites.map(site => (
                  <div key={site.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center text-sm">🌐</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{site.siteName}</div>
                      <div className="text-xs text-slate-500 truncate">{site.siteUrl}</div>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Active</span>
                    <button onClick={() => deleteSite(site.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-4">
          {sites.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">🌐</div>
              <p className="text-slate-400">Connect a WordPress site first</p>
              <button onClick={() => setTab('connect')} className="btn-primary mt-4">Connect Site</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <select className="input text-sm"
                  value={selectedSite?.id || ''}
                  onChange={e => setSelectedSite(sites.find(s => s.id === e.target.value) || null)}>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
                </select>
                <button onClick={() => setShowNewPost(true)} className="btn-primary text-sm">+ New Post</button>
              </div>

              {showNewPost && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-white mb-3">New Post</h3>
                  <div className="space-y-3">
                    <input className="input w-full" placeholder="Post title" value={newPost.title}
                      onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} />
                    <textarea className="input w-full h-32 resize-none" placeholder="Post content (HTML supported)"
                      value={newPost.content}
                      onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} />
                    <div className="flex gap-3">
                      <select className="input text-sm" value={newPost.status}
                        onChange={e => setNewPost(p => ({ ...p, status: e.target.value }))}>
                        <option value="draft">Draft</option>
                        <option value="publish">Publish</option>
                      </select>
                      <button onClick={createPost} disabled={postSaving} className="btn-primary text-sm">
                        {postSaving ? <LoadingSpinner size="sm" /> : 'Save Post'}
                      </button>
                      <button onClick={() => setShowNewPost(false)} className="btn-ghost text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {postsLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
              ) : posts.length === 0 ? (
                <div className="card text-center py-12 text-slate-400">No posts found</div>
              ) : (
                <div className="space-y-2">
                  {posts.map(post => (
                    <div key={post.id} className="card flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            post.status === 'publish' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>{post.status}</span>
                          <span className="text-xs text-slate-600">{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm font-medium text-white" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                      </div>
                      <a href={post.link} target="_blank" rel="noreferrer"
                        className="text-xs text-brand-400 hover:text-brand-300 flex-shrink-0">View →</a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'seo' && (
        <div className="space-y-4">
          {sites.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-400">Connect a WordPress site to see SEO scores</p>
              <button onClick={() => setTab('connect')} className="btn-primary mt-4">Connect Site</button>
            </div>
          ) : (
            <>
              <select className="input text-sm mb-2"
                value={selectedSite?.id || ''}
                onChange={e => {
                  setSelectedSite(sites.find(s => s.id === e.target.value) || null)
                  setTab('seo')
                }}>
                {sites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
              </select>
              {postsLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
              ) : posts.length === 0 ? (
                <div className="card text-center py-12 text-slate-400">
                  <button onClick={() => { setTab('posts'); loadPosts() }} className="btn-ghost text-sm">Load posts first →</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {posts.map(post => {
                    const score = getSeoScore(post)
                    return (
                      <div key={post.id} className="card flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                          <div className="text-xs text-slate-500 mt-0.5">{post.status} · {new Date(post.date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${score}%` }} />
                          </div>
                          <span className={`text-sm font-bold ${score >= 70 ? 'text-emerald-400' : score >= 45 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
