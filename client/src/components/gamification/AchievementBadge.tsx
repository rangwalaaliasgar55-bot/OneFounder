import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface AchievementBadgeProps {
  icon: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: string
  className?: string
}

/**
 * Achievement badge with locked/unlocked states.
 * Unlock animation: scale from 0 with spring + glow.
 */
export function AchievementBadge({
  icon,
  title,
  description,
  unlocked,
  unlockedAt,
  className = '',
}: AchievementBadgeProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={`relative rounded-xl p-3 border transition-all ${
        unlocked
          ? 'glass border-brand-500/20 bg-brand-500/5'
          : 'bg-white/[0.02] border-white/[0.04]'
      } ${className}`}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
    >
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${unlocked ? '' : 'grayscale opacity-40'}`}>
          {unlocked ? icon : '🔒'}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold ${unlocked ? 'text-white' : 'text-slate-500'}`}>
            {title}
          </div>
          <div className={`text-[10px] ${unlocked ? 'text-slate-400' : 'text-slate-600'}`}>
            {description}
          </div>
          {unlocked && unlockedAt && (
            <div className="text-[10px] text-emerald-400 mt-0.5">
              ✓ {new Date(unlockedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Glow effect on unlocked */}
      {unlocked && !reducedMotion && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)',
          }}
        />
      )}
    </motion.div>
  )
}
