import { motion } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface FounderScoreProps {
  xp: number
  level: number
  title: string
  nextLevelXp: number
  nextLevelTitle: string
  className?: string
  compact?: boolean
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#94a3b8',
  2: '#60a5fa',
  3: '#22d3ee',
  4: '#8191f8',
  5: '#a78bfa',
  6: '#34d399',
  7: '#fb923c',
  8: '#fbbf24',
}

/**
 * Animated XP bar with level badge.
 * Shows current level title, XP progress to next level.
 */
export function FounderScore({
  xp,
  level,
  title,
  nextLevelXp,
  nextLevelTitle,
  className = '',
  compact = false,
}: FounderScoreProps) {
  const reducedMotion = useReducedMotion()
  const color = LEVEL_COLORS[level] || '#6366f1'
  const progress = nextLevelXp > 0 ? Math.min((xp / nextLevelXp) * 100, 100) : 100

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: `${color}30`, border: `1px solid ${color}40` }}
        >
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
        <span className="text-[10px] text-slate-500 flex-shrink-0">{xp} XP</span>
      </div>
    )
  }

  return (
    <div className={`glass rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}
          initial={reducedMotion ? {} : { scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {level}
        </motion.div>
        <div>
          <div className="text-sm font-semibold" style={{ color }}>{title}</div>
          <div className="text-[10px] text-slate-500">Level {level} Founder</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">{xp.toLocaleString()} XP</span>
        <span className="text-[10px] text-slate-500">Next: {nextLevelTitle}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  )
}
