import { motion } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface MilestoneProgressProps {
  stages: Array<{ name: string; completed: boolean; count: number }>
  className?: string
}

const STAGE_COLORS: Record<string, string> = {
  'Idea': '#facc15',
  'Validation': '#60a5fa',
  'Research': '#22d3ee',
  'Planning': '#a78bfa',
  'MVP': '#8191f8',
  'Traction': '#34d399',
  'Marketing': '#f472b6',
  'Sales': '#fb923c',
  'Revenue': '#4ade80',
  'Growth': '#34d399',
  'Visibility': '#2dd4bf',
  'Scale': '#8191f8',
  'Success': '#fbbf24',
}

/**
 * Animated progress bar for journey milestones.
 * Shows stage progression as a horizontal stepper.
 */
export function MilestoneProgress({ stages, className = '' }: MilestoneProgressProps) {
  const reducedMotion = useReducedMotion()
  const completedCount = stages.filter(s => s.completed).length
  const progress = stages.length > 0 ? (completedCount / stages.length) * 100 : 0

  return (
    <div className={`glass rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white">Journey Progress</span>
        <span className="text-[10px] text-slate-500">{completedCount}/{stages.length} stages</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const color = STAGE_COLORS[stage.name] || '#6366f1'
          return (
            <motion.div
              key={stage.name}
              className="flex-1 flex flex-col items-center gap-1"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  stage.completed ? 'shadow-lg' : 'opacity-30'
                }`}
                style={{
                  background: stage.completed ? color : 'rgba(255,255,255,0.1)',
                  boxShadow: stage.completed ? `0 0 8px ${color}40` : 'none',
                }}
              />
              <span className="text-[8px] text-slate-600 truncate w-full text-center">
                {stage.name}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
