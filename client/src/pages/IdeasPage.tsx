import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner, PageLoader } from '../components/ui/LoadingSpinner'
import { TiltCard } from '../components/ui/TiltCard'
import { Confetti, useConfetti } from '../components/ui/Confetti'
import { MeshGradient } from '../components/ui/MeshGradient'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-400',
  validated: 'bg-blue-500/20 text-blue-400',
  building: 'bg-brand-500/20 text-brand-400',
  launched: 'bg-green-500/20 text-green-400',
}

const TYPE_EMOJIS: Record<string, string> = {
  SaaS: '💻',
  Agency: '🏢',
  Marketplace: '🛒',
  AI: '🤖',
  'Local Business': '📍',
  default: '💡',
}

export function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState({
    skills: '', interests: '', budget: '', availableTime: '', location: '', experience: ''
  })
  const { active: confettiActive, celebrate } = useConfetti()

  useEffect(() => {
    api.get<any[]>('/ideas').then(setIdeas).finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    setGenerating(true)
    setShowModal(false)
    try {
      const newIdeas = await api.post<any[]>('/ideas/generate', form)
      setIdeas(prev => [...newIdeas, ...prev])
      celebrate()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const deleteIdea = async (id: string) => {
    await api.delete(`/ideas/${id}`)
    setIdeas(ideas.filter(i => i.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const updateStatus = async (id: string, status: string) => {
    const updated = await api.patch<any>(`/ideas/${id}`, { status })
    setIdeas(ideas.map(i => i.id === id ? updated : i))
    if (selected?.id === id) setSelected(updated)
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <MeshGradient />
      <Confetti active={confettiActive} />
      <PageHeader
        icon="💡"
        title="Idea Lab"
        description="Discover AI-powered startup opportunities tailored to your skills"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            ✨ Generate Ideas
          </button>
        }
      />

      {generating && (
        <div className="card border border-brand-500/20 mb-6 flex items-center gap-4">
          <LoadingSpinner />
          <div>
            <div className="text-white font-medium">Generating business ideas...</div>
            <div className="text-slate-400 text-sm">AI is analyzing your profile and market opportunities</div>
          </div>
        </div>
      )}

      {ideas.length === 0 && !generating ? (
        <EmptyStateAnimated
          icon="💡"
          title="No ideas yet"
          description="Generate AI-powered startup ideas based on your skills, interests, and goals"
          action={{ label: 'Generate Ideas', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea, i) => (
            <TiltCard
              key={idea.id}
              className={`card-hover group animate-slide-up stagger-${Math.min(i + 1, 7)}`}
              tiltAmount={8}
            >
              <div onClick={() => setSelected(idea)} className="cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_EMOJIS[idea.type] || TYPE_EMOJIS.default}</span>
                  <span className="text-xs text-slate-500 glass px-2 py-0.5 rounded-full">{idea.type}</span>
                </div>
                <span className={`badge ${STATUS_COLORS[idea.status] || 'bg-slate-500/20 text-slate-400'}`}>
                  {idea.status}
                </span>
              </div>

              <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">{idea.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-3 mb-4">{idea.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {idea.revenuePotential && (
                  <div className="bg-green-500/10 rounded-lg p-2">
                    <div className="text-slate-500 mb-0.5">Revenue</div>
                    <div className="text-green-400 font-medium truncate">{idea.revenuePotential}</div>
                  </div>
                )}
                {idea.difficulty && (
                  <div className="bg-brand-500/10 rounded-lg p-2">
                    <div className="text-slate-500 mb-0.5">Difficulty</div>
                    <div className="text-brand-400 font-medium">{idea.difficulty}/10</div>
                  </div>
                )}
                {idea.competition && (
                  <div className="bg-orange-500/10 rounded-lg p-2">
                    <div className="text-slate-500 mb-0.5">Competition</div>
                    <div className="text-orange-400 font-medium">{idea.competition}</div>
                  </div>
                )}
                {idea.marketSize && (
                  <div className="bg-violet-500/10 rounded-lg p-2">
                    <div className="text-slate-500 mb-0.5">Market Size</div>
                    <div className="text-violet-400 font-medium truncate">{idea.marketSize}</div>
                  </div>
                )}
              </div>
              </div>
            </TiltCard>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="✨ Generate Business Ideas" size="lg">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Tell us about yourself and we'll generate tailored startup ideas</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'skills', label: 'Your Skills', placeholder: 'React, marketing, writing...' },
              { key: 'interests', label: 'Interests', placeholder: 'AI, fintech, health...' },
              { key: 'budget', label: 'Budget', placeholder: '$1,000-$10,000' },
              { key: 'availableTime', label: 'Time Available', placeholder: '10-20 hours/week' },
              { key: 'location', label: 'Location', placeholder: 'US, Remote, Europe...' },
              { key: 'experience', label: 'Experience Level', placeholder: 'Beginner, 5 years...' },
            ].map(field => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                <input
                  className="input"
                  placeholder={field.placeholder}
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={generate}>
              ✨ Generate 5 Ideas
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} size="xl">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl">{TYPE_EMOJIS[selected.type] || '💡'}</span>
              <span className="glass px-3 py-1 rounded-full text-sm text-slate-300">{selected.type}</span>
              <select
                className="glass px-3 py-1 rounded-full text-sm text-slate-300 bg-transparent border-none outline-none cursor-pointer"
                value={selected.status}
                onChange={e => updateStatus(selected.id, e.target.value)}
              >
                {['draft', 'validated', 'building', 'launched'].map(s => (
                  <option key={s} value={s} className="bg-surface-900">{s}</option>
                ))}
              </select>
            </div>

            <p className="text-slate-300">{selected.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Revenue Potential', value: selected.revenuePotential, color: 'text-green-400' },
                { label: 'Market Size', value: selected.marketSize, color: 'text-violet-400' },
                { label: 'Competition', value: selected.competition, color: 'text-orange-400' },
                { label: 'Difficulty', value: selected.difficulty ? `${selected.difficulty}/10` : null, color: 'text-brand-400' },
              ].filter(item => item.value).map(item => (
                <div key={item.label} className="glass rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                  <div className={`text-sm font-semibold ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {selected.roadmap && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Roadmap</h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(selected.roadmap as Record<string, string>).map(([key, value]) => (
                    <div key={key} className="glass rounded-xl p-3">
                      <div className="text-xs text-brand-400 font-medium mb-1">{key.replace('day', 'Day ')}</div>
                      <div className="text-sm text-slate-300">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => { deleteIdea(selected.id) }} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
