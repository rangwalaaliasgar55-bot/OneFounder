import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { SkeletonListPage } from '../components/ui/PageSkeletons'

const DOC_TYPES = [
  { value: 'note', label: 'Note', icon: '📝' },
  { value: 'document', label: 'Document', icon: '📄' },
  { value: 'business_plan', label: 'Business Plan', icon: '📋' },
  { value: 'research', label: 'Research', icon: '🔬' },
  { value: 'strategy', label: 'Strategy', icon: '♟️' },
  { value: 'template', label: 'Template', icon: '🗂️' },
]

const TYPE_ICONS: Record<string, string> = Object.fromEntries(DOC_TYPES.map(t => [t.value, t.icon]))

export function KnowledgePage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', content: '', type: 'note', tags: '' })

  useEffect(() => {
    api.get<any[]>('/knowledge').then(setItems).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    const data = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] }
    if (editing) {
      const updated = await api.patch<any>(`/knowledge/${editing.id}`, data)
      setItems(items.map(i => i.id === editing.id ? updated : i))
    } else {
      const item = await api.post<any>('/knowledge', data)
      setItems(prev => [item, ...prev])
    }
    setShowModal(false)
    setEditing(null)
    setForm({ title: '', content: '', type: 'note', tags: '' })
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setForm({ title: item.title, content: item.content || '', type: item.type || 'note', tags: Array.isArray(item.tags) ? item.tags.join(', ') : '' })
    setShowModal(true)
  }

  const deleteItem = async (id: string) => {
    await api.delete(`/knowledge/${id}`)
    setItems(items.filter(i => i.id !== id))
  }

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.content?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <SkeletonListPage />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon="📚"
        title="Knowledge Base"
        description="Store and organize documents, plans, research, and strategies"
        action={<button onClick={() => { setEditing(null); setForm({ title: '', content: '', type: 'note', tags: '' }); setShowModal(true) }} className="btn-primary">+ New Document</button>}
      />

      <div className="mb-6">
        <input
          className="input max-w-md"
          placeholder="🔍 Search knowledge base..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyStateAnimated
          icon="📚"
          title="No documents yet"
          description="Store business plans, research, strategies, and notes in your knowledge base"
          action={{ label: 'Create Document', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="card-hover group" onClick={() => openEdit(item)}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{TYPE_ICONS[item.type] || '📝'}</span>
                <span className="text-xs glass px-2 py-0.5 rounded-full text-slate-400">
                  {DOC_TYPES.find(t => t.value === item.type)?.label || item.type}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
              {item.content && (
                <p className="text-xs text-slate-400 line-clamp-4">{item.content}</p>
              )}
              {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="glass px-2 py-0.5 rounded-full text-xs text-brand-400">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-600">{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteItem(item.id) }}
                  className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-red-400 hover:text-red-300 transition-opacity"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null) }} title={editing ? 'Edit Document' : 'New Document'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title</label>
              <input className="input" placeholder="Document title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value} className="bg-surface-900">{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags (comma separated)</label>
              <input className="input" placeholder="strategy, marketing, q4..." value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea
              className="input resize-none font-mono text-sm"
              style={{ height: '300px' }}
              placeholder="Write your content here..."
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => { setShowModal(false); setEditing(null) }}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={!form.title.trim()}>
              {editing ? 'Save Changes' : 'Create Document'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
