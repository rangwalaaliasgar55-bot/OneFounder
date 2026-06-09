import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageLoader } from '../components/ui/LoadingSpinner'

const STAGE_COLORS: Record<string, string> = {
  'Idea': 'from-yellow-600/30 to-yellow-800/10 border-yellow-500/30',
  'Validation': 'from-blue-600/30 to-blue-800/10 border-blue-500/30',
  'Research': 'from-cyan-600/30 to-cyan-800/10 border-cyan-500/30',
  'Planning': 'from-violet-600/30 to-violet-800/10 border-violet-500/30',
  'MVP': 'from-brand-600/30 to-brand-800/10 border-brand-500/30',
  'Traction': 'from-emerald-600/30 to-emerald-800/10 border-emerald-500/30',
  'Marketing': 'from-pink-600/30 to-pink-800/10 border-pink-500/30',
  'Sales': 'from-orange-600/30 to-orange-800/10 border-orange-500/30',
  'Revenue': 'from-green-600/30 to-green-800/10 border-green-500/30',
  'Growth': 'from-emerald-600/30 to-emerald-800/10 border-emerald-500/30',
  'Visibility': 'from-teal-600/30 to-teal-800/10 border-teal-500/30',
  'Scale': 'from-brand-600/30 to-brand-800/10 border-brand-500/30',
  'Success': 'from-amber-600/30 to-amber-800/10 border-amber-500/30',
}

const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Dreamer', minXp: 0, maxXp: 200, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  { level: 2, title: 'Explorer', minXp: 200, maxXp: 500, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { level: 3, title: 'Builder', minXp: 500, maxXp: 1000, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { level: 4, title: 'Launcher', minXp: 1000, maxXp: 2000, color: 'text-brand-400', bg: 'bg-brand-500/20' },
  { level: 5, title: 'Operator', minXp: 2000, maxXp: 4000, color: 'text-violet-400', bg: 'bg-violet-500/20' },
  { level: 6, title: 'Grower', minXp: 4000, maxXp: 7000, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { level: 7, title: 'Scaler', minXp: 7000, maxXp: 12000, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { level: 8, title: 'Founder', minXp: 12000, maxXp: 99999, color: 'text-amber-400', bg: 'bg-amber-500/20' },
]

function getLevel(xp: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) return LEVEL_THRESHOLDS[i]
  }
  return LEVEL_THRESHOLDS[0]
}

export function JourneyPage() {
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [editingNotes, setEditingNotes] = useState<string | null>(null)

  useEffect(() => {
    api.get<any[]>('/journey').then(ms => {
      setMilestones(ms)
      const n: Record<string, string> = {}
      ms.forEach(m => { if (m.notes) n[m.id] = m.notes })
      setNotes(n)
    }).finally(() => setLoading(false))
  }, [])

  const toggle = async (milestone: any) => {
    setToggling(milestone.id)
    try {
      const updated = await api.patch<any>(`/journey/${milestone.id}`, { completed: !milestone.completed })
      setMilestones(prev => prev.map(m => m.id === milestone.id ? updated : m))
    } finally { setToggling(null) }
  }

  const saveNotes = async (id: string) => {
    const updated = await api.patch<any>(`/journey/${id}`, { notes: notes[id] || '' })
    setMilestones(prev => prev.map(m => m.id === id ? updated : m))
    setEditingNotes(null)
  }

  if (loading) return <PageLoader />

  const completedXp = milestones.filter(m => m.completed).reduce((s: number, m: any) => s + (m.xp || 0), 0)
  const totalXp = milestones.reduce((s: number, m: any) => s + (m.xp || 0), 0)
  const completedCount = milestones.filter(m => m.completed).length
  const level = getLevel(completedXp)
  const nextLevel = LEVEL_THRESHOLDS[Math.min(LEVEL_THRESHOLDS.indexOf(level) + 1, LEVEL_THRESHOLDS.length - 1)]
  const progressPct = level === nextLevel ? 100 : Math.round(((completedXp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">🗺️ Founder Journey</h1>
        <p className="text-slate-400">Track your startup milestones. Every step forward earns XP.</p>
      </div>

      {/* Level & XP Panel */}
      <div className="glass-strong rounded-2xl p-6 mb-8 bg-gradient-to-br from-brand-600/10 to-violet-600/10 border border-brand-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${level.bg} flex items-center justify-center text-3xl font-bold ${level.color} border border-white/10`}>
              {level.level}
            </div>
            <div>
              <div className={`text-xl font-bold ${level.color}`}>{level.title}</div>
              <div className="text-slate-400 text-sm">Level {level.level} Founder</div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{completedXp.toLocaleString()} XP</span>
              {level !== nextLevel && <span className="text-sm text-slate-500">{nextLevel.minXp.toLocaleString()} XP → {nextLevel.title}</span>}
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {level !== nextLevel && (
              <div className="text-xs text-slate-500 mt-1">{nextLevel.minXp - completedXp} XP to reach {nextLevel.title}</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{completedCount}</div>
              <div className="text-xs text-slate-500">Milestones</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{milestones.length - completedCount}</div>
              <div className="text-xs text-slate-500">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{Math.round((completedCount / milestones.length) * 100)}%</div>
              <div className="text-xs text-slate-500">Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-500/50 via-violet-500/30 to-transparent" />

        <div className="space-y-4 pl-16">
          {milestones.map((milestone, idx) => (
            <div key={milestone.id} className={`relative group`}>
              {/* Node on timeline */}
              <div className={`absolute -left-10 top-5 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 border-2 z-10
                ${milestone.completed
                  ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-surface-900 border-white/20 group-hover:border-brand-500/50'
                }`}
              >
                {milestone.completed ? '✓' : milestone.icon}
              </div>

              <div className={`glass rounded-xl p-5 border transition-all duration-200
                ${milestone.completed
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border bg-gradient-to-r ${STAGE_COLORS[milestone.stage] || 'from-slate-600/20 to-slate-800/10 border-slate-500/30'}`}>
                        {milestone.stage}
                      </span>
                      <span className="text-xs text-slate-600">+{milestone.xp} XP</span>
                      {milestone.completedAt && (
                        <span className="text-xs text-slate-600">
                          ✓ {new Date(milestone.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-semibold text-base ${milestone.completed ? 'text-emerald-400' : 'text-white'}`}>
                      {milestone.icon} {milestone.title}
                    </h3>
                    <p className="text-slate-400 text-sm mt-0.5">{milestone.description}</p>

                    {/* Notes section */}
                    {editingNotes === milestone.id ? (
                      <div className="mt-3">
                        <textarea
                          value={notes[milestone.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [milestone.id]: e.target.value }))}
                          className="input text-sm w-full resize-none"
                          rows={2}
                          placeholder="Add a note about this milestone..."
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveNotes(milestone.id)} className="btn-primary text-xs py-1 px-3">Save</button>
                          <button onClick={() => setEditingNotes(null)} className="btn-ghost text-xs py-1 px-3">Cancel</button>
                        </div>
                      </div>
                    ) : milestone.notes ? (
                      <div
                        className="mt-2 text-xs text-slate-500 italic cursor-pointer hover:text-slate-400"
                        onClick={() => setEditingNotes(milestone.id)}
                      >
                        📝 {milestone.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!milestone.notes && editingNotes !== milestone.id && (
                      <button
                        onClick={() => setEditingNotes(milestone.id)}
                        className="btn-ghost text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        + Note
                      </button>
                    )}
                    <button
                      onClick={() => toggle(milestone)}
                      disabled={toggling === milestone.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        milestone.completed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                          : 'bg-brand-600/20 text-brand-400 border border-brand-500/30 hover:bg-brand-600/30'
                      }`}
                    >
                      {toggling === milestone.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : milestone.completed ? (
                        <>✓ Done</>
                      ) : (
                        <>Mark Done</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer tip */}
      <div className="mt-8 glass rounded-xl p-4 border border-white/5 text-center">
        <p className="text-slate-500 text-sm">
          🎯 <span className="text-slate-400">Tip:</span> Mark milestones as you hit them. Your journey map tells your founder story and unlocks deeper insights.
        </p>
      </div>
    </div>
  )
}
