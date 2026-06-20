import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { SkeletonListPage } from '../components/ui/PageSkeletons'
import { MeshGradient } from '../components/ui/MeshGradient'
import { useReducedMotion } from '../motion/scroll'

const STAGE_COLORS: Record<string, { gradient: string; border: string; text: string; dot: string }> = {
  'Idea':       { gradient: 'from-yellow-600/20 to-yellow-800/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: '#facc15' },
  'Validation': { gradient: 'from-blue-600/20 to-blue-800/10',     border: 'border-blue-500/30',   text: 'text-blue-400',   dot: '#60a5fa' },
  'Research':   { gradient: 'from-cyan-600/20 to-cyan-800/10',     border: 'border-cyan-500/30',   text: 'text-cyan-400',   dot: '#22d3ee' },
  'Planning':   { gradient: 'from-violet-600/20 to-violet-800/10', border: 'border-violet-500/30', text: 'text-violet-400', dot: '#a78bfa' },
  'MVP':        { gradient: 'from-brand-600/20 to-brand-800/10',   border: 'border-brand-500/30',  text: 'text-brand-400',  dot: '#8191f8' },
  'Traction':   { gradient: 'from-emerald-600/20 to-emerald-800/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: '#34d399' },
  'Marketing':  { gradient: 'from-pink-600/20 to-pink-800/10',     border: 'border-pink-500/30',   text: 'text-pink-400',   dot: '#f472b6' },
  'Sales':      { gradient: 'from-orange-600/20 to-orange-800/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: '#fb923c' },
  'Revenue':    { gradient: 'from-green-600/20 to-green-800/10',   border: 'border-green-500/30',  text: 'text-green-400',  dot: '#4ade80' },
  'Growth':     { gradient: 'from-emerald-600/20 to-emerald-800/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: '#34d399' },
  'Visibility': { gradient: 'from-teal-600/20 to-teal-800/10',     border: 'border-teal-500/30',   text: 'text-teal-400',   dot: '#2dd4bf' },
  'Scale':      { gradient: 'from-brand-600/20 to-brand-800/10',   border: 'border-brand-500/30',  text: 'text-brand-400',  dot: '#8191f8' },
  'Success':    { gradient: 'from-amber-600/20 to-amber-800/10',   border: 'border-amber-500/30',  text: 'text-amber-400',  dot: '#fbbf24' },
}

const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Dreamer',   minXp: 0,     maxXp: 200,   color: 'text-slate-400',  bg: 'bg-slate-500/20',  hex: '#94a3b8' },
  { level: 2, title: 'Explorer',  minXp: 200,   maxXp: 500,   color: 'text-blue-400',   bg: 'bg-blue-500/20',   hex: '#60a5fa' },
  { level: 3, title: 'Builder',   minXp: 500,   maxXp: 1000,  color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   hex: '#22d3ee' },
  { level: 4, title: 'Launcher',  minXp: 1000,  maxXp: 2000,  color: 'text-brand-400',  bg: 'bg-brand-500/20',  hex: '#8191f8' },
  { level: 5, title: 'Operator',  minXp: 2000,  maxXp: 4000,  color: 'text-violet-400', bg: 'bg-violet-500/20',  hex: '#a78bfa' },
  { level: 6, title: 'Grower',    minXp: 4000,  maxXp: 7000,  color: 'text-emerald-400', bg: 'bg-emerald-500/20', hex: '#34d399' },
  { level: 7, title: 'Scaler',    minXp: 7000,  maxXp: 12000, color: 'text-orange-400',  bg: 'bg-orange-500/20', hex: '#fb923c' },
  { level: 8, title: 'Founder',   minXp: 12000, maxXp: 99999, color: 'text-amber-400',   bg: 'bg-amber-500/20',  hex: '#fbbf24' },
]

function getLevel(xp: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) return LEVEL_THRESHOLDS[i]
  }
  return LEVEL_THRESHOLDS[0]
}

/**
 * Individual timeline milestone with Framer Motion entrance.
 */
function TimelineMilestone({
  milestone,
  index,
  onToggle,
  toggling,
}: {
  milestone: any
  index: number
  onToggle: () => void
  toggling: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const reducedMotion = useReducedMotion()
  const stage = STAGE_COLORS[milestone.stage] || { gradient: 'from-slate-600/20 to-slate-800/10', border: 'border-slate-500/30', text: 'text-slate-400', dot: '#94a3b8' }

  return (
    <motion.div
      ref={ref}
      className="relative group"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
      animate={isInView ? (reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }) : {}}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Node on timeline */}
      <motion.div
        className={`absolute -left-10 top-5 w-8 h-8 rounded-full flex items-center justify-center text-lg border-2 z-10
          ${milestone.completed
            ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
            : 'bg-surface-900 border-white/20 group-hover:border-brand-500/50'
          }`}
        initial={reducedMotion ? {} : { scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ delay: index * 0.06 + 0.1, type: 'spring', stiffness: 300, damping: 20 }}
      >
        {milestone.completed ? '✓' : milestone.icon}
      </motion.div>

      <motion.div
        className={`glass rounded-xl p-5 border transition-all duration-200
          ${milestone.completed
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-white/5 hover:border-white/10'
          }`}
        whileHover={reducedMotion ? {} : { y: -2 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border bg-gradient-to-r ${stage.gradient} ${stage.border}`}>
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
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              onClick={onToggle}
              disabled={toggling}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                milestone.completed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                  : 'bg-brand-600/20 text-brand-400 border border-brand-500/30 hover:bg-brand-600/30'
              }`}
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
            >
              {toggling ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : milestone.completed ? (
                <>✓ Done</>
              ) : (
                <>Mark Done</>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function JourneyPage() {
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    api.get<any[]>('/journey').then(setMilestones).finally(() => setLoading(false))
  }, [])

  const toggle = async (milestone: any) => {
    setToggling(milestone.id)
    try {
      const updated = await api.patch<any>(`/journey/${milestone.id}`, { completed: !milestone.completed })
      setMilestones(prev => prev.map(m => m.id === milestone.id ? updated : m))
    } finally { setToggling(null) }
  }

  if (loading) return <SkeletonListPage />

  const completedXp = milestones.filter(m => m.completed).reduce((s: number, m: any) => s + (m.xp || 0), 0)
  const totalXp = milestones.reduce((s: number, m: any) => s + (m.xp || 0), 0)
  const completedCount = milestones.filter(m => m.completed).length
  const level = getLevel(completedXp)
  const nextLevel = LEVEL_THRESHOLDS[Math.min(LEVEL_THRESHOLDS.indexOf(level) + 1, LEVEL_THRESHOLDS.length - 1)]
  const progressPct = level === nextLevel ? 100 : Math.round(((completedXp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100)

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      <MeshGradient />

      {/* Header */}
      <motion.div
        className="mb-8"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-white mb-1">🗺️ Founder Journey</h1>
        <p className="text-slate-400">Track your startup milestones. Every step forward earns XP.</p>
      </motion.div>

      {/* Level & XP Panel */}
      <motion.div
        className="glass-strong rounded-2xl p-6 mb-8 bg-gradient-to-br from-brand-600/10 to-violet-600/10 border border-brand-500/20"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Level badge */}
          <div className="flex items-center gap-4">
            <motion.div
              className={`w-16 h-16 rounded-2xl ${level.bg} flex items-center justify-center text-3xl font-bold ${level.color} border border-white/10`}
              initial={reducedMotion ? {} : { scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {level.level}
            </motion.div>
            <div>
              <div className={`text-xl font-bold ${level.color}`}>{level.title}</div>
              <div className="text-slate-400 text-sm">Level {level.level} Founder</div>
            </div>
          </div>

          {/* XP progress bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{completedXp.toLocaleString()} XP</span>
              {level !== nextLevel && <span className="text-sm text-slate-500">{nextLevel.minXp.toLocaleString()} XP → {nextLevel.title}</span>}
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            {level !== nextLevel && (
              <div className="text-xs text-slate-500 mt-1">{nextLevel.minXp - completedXp} XP to reach {nextLevel.title}</div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: completedCount, label: 'Milestones' },
              { value: milestones.length - completedCount, label: 'Remaining' },
              { value: `${Math.round((completedCount / milestones.length) * 100)}%`, label: 'Progress' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Journey Timeline */}
      <div className="relative">
        {/* Animated vertical line */}
        <motion.div
          className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-500/50 via-violet-500/30 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformOrigin: 'top' }}
        />

        <div className="space-y-4 pl-16">
          <AnimatePresence>
            {milestones.map((milestone, idx) => (
              <TimelineMilestone
                key={milestone.id}
                milestone={milestone}
                index={idx}
                onToggle={() => toggle(milestone)}
                toggling={toggling === milestone.id}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer tip */}
      <motion.div
        className="mt-8 glass rounded-xl p-4 border border-white/5 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-slate-500 text-sm">
          🎯 <span className="text-slate-400">Tip:</span> Mark milestones as you hit them. Your journey map tells your founder story and unlocks deeper insights.
        </p>
      </motion.div>
    </div>
  )
}
