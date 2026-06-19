import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { MeshGradient } from '../components/ui/MeshGradient'

interface Memory {
  id: string
  type: string
  content: string
  source: string
  importance: number
  tags: string[]
  createdAt: string
  referenceCount: number
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  goal: { icon: '🎯', color: 'text-brand-400 bg-brand-500/10 border-brand-500/20', label: 'Goal' },
  decision: { icon: '⚡', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', label: 'Decision' },
  preference: { icon: '💎', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Preference' },
  fact: { icon: '📌', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Fact' },
  pattern: { icon: '🔄', color: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'Pattern' },
  reflection: { icon: '🪞', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', label: 'Reflection' },
  semantic: { icon: '🧬', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', label: 'Business Entity' },
  episodic: { icon: '📅', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', label: 'Event' },
  procedural: { icon: '⚙️', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', label: 'Workflow' },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || { icon: '💡', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', label: type }
}

function ImportanceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 h-2 rounded-sm transition-colors ${
              i < value ? 'bg-brand-500' : 'bg-white/5'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-slate-600">{value}/10</span>
    </div>
  )
}

export function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [adding, setAdding] = useState(false)
  const [newMemory, setNewMemory] = useState({ type: 'fact', content: '', importance: 7 })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})

  async function load() {
    setLoading(true)
    try {
      const res = await api.get<{ memories: Memory[] }>('/memory')
      const mems = res.memories || []
      setMemories(mems)
      const s: Record<string, number> = {}
      mems.forEach(m => { s[m.type] = (s[m.type] || 0) + 1 })
      setStats(s)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSearch() {
    if (!searchQuery.trim()) return load()
    setLoading(true)
    try {
      const res = await api.get<{ memories: Memory[] }>(`/memory/search?q=${encodeURIComponent(searchQuery)}`)
      setMemories(res.memories || [])
    } catch {}
    setLoading(false)
  }

  async function handleAdd() {
    if (!newMemory.content.trim()) return
    setSaving(true)
    try {
      await api.post('/memory', newMemory)
      setAdding(false)
      setNewMemory({ type: 'fact', content: '', importance: 7 })
      load()
    } catch {}
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/memory/${id}`)
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch {}
    setDeletingId(null)
  }

  const filtered = memories.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const allTypes = ['all', ...Object.keys(stats)]

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      <MeshGradient />
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🧠 Memory Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            What OneFounder Supreme knows about you — persistent across all conversations
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="btn-primary text-sm px-4 py-2"
        >
          + Add Memory
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{memories.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total Memories</div>
        </div>
        {Object.entries(stats).slice(0, 3).map(([type, count]) => {
          const cfg = getTypeConfig(type)
          return (
            <div key={type} className="glass rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-xs text-slate-500 mt-0.5">{cfg.icon} {cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search memories..."
            className="input-field flex-1 text-sm"
          />
          <button onClick={handleSearch} className="btn-ghost text-sm px-3">
            🔍
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {allTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                filterType === type
                  ? 'bg-brand-600/20 border-brand-500/30 text-brand-300'
                  : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
              }`}
            >
              {type === 'all' ? 'All' : `${getTypeConfig(type).icon} ${getTypeConfig(type).label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Add Memory Modal */}
      {adding && (
        <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Add Memory</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <select
                value={newMemory.type}
                onChange={e => setNewMemory(p => ({ ...p, type: e.target.value }))}
                className="input-field text-sm w-40"
              >
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                  <option key={type} value={type}>{cfg.icon} {cfg.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-slate-500">Importance:</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={newMemory.importance}
                  onChange={e => setNewMemory(p => ({ ...p, importance: Number(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-xs text-white w-4">{newMemory.importance}</span>
              </div>
            </div>
            <textarea
              value={newMemory.content}
              onChange={e => setNewMemory(p => ({ ...p, content: e.target.value }))}
              placeholder="What should the AI remember about you? Be specific..."
              rows={3}
              className="input-field text-sm w-full"
            />
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm px-4 py-2">
                {saving ? 'Saving...' : 'Save Memory'}
              </button>
              <button onClick={() => setAdding(false)} className="btn-ghost text-sm px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500 text-sm">Loading memories...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-white mb-2">No memories yet</h3>
          <p className="text-slate-500 text-sm max-w-xs">
            Start chatting with AI agents. OneFounder Supreme automatically builds memory about you and your business.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(memory => {
            const cfg = getTypeConfig(memory.type)
            return (
              <div
                key={memory.id}
                className="glass rounded-xl p-4 flex items-start gap-3 group hover:border-white/10 border border-transparent transition-all"
              >
                <span className={`text-xs px-2 py-1 rounded-lg border flex-shrink-0 font-medium ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 leading-relaxed">{memory.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <ImportanceBar value={memory.importance} />
                    <span className="text-xs text-slate-600">
                      via {memory.source} · {memory.referenceCount || 0}× referenced
                    </span>
                    {memory.tags && memory.tags.length > 0 && (
                      <div className="flex gap-1">
                        {memory.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(memory.id)}
                  disabled={deletingId === memory.id}
                  className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 transition-all text-xs flex-shrink-0"
                >
                  {deletingId === memory.id ? '...' : '✕'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
