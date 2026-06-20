import { motion } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface StreakCounterProps {
  streak: number
  className?: string
}

/**
 * Daily streak visualization — 7 dots showing the last 7 days.
 * Current streak highlighted with glow.
 */
export function StreakCounter({ streak, className = '' }: StreakCounterProps) {
  const reducedMotion = useReducedMotion()

  // Generate last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const isActive = i >= 7 - streak
    const isToday = i === 6
    return {
      label: date.toLocaleDateString('en', { weekday: 'short' }),
      isActive,
      isToday,
    }
  })

  return (
    <div className={`glass rounded-xl p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🔥</span>
        <span className="text-xs font-semibold text-white">{streak} day streak</span>
      </div>
      <div className="flex items-center gap-1.5">
        {days.map((day, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-1"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
                day.isActive
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white/5 text-slate-600 border border-white/[0.06]'
              } ${day.isToday ? 'ring-2 ring-amber-400/30' : ''}`}
            >
              {day.isActive ? '🔥' : '·'}
            </div>
            <span className="text-[8px] text-slate-600">{day.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
