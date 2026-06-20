import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AnimatedCounter } from './AnimatedCounter'
import { useReducedMotion } from '../../motion/scroll'

interface StatCard3DProps {
  label: string
  value: number
  icon: string
  page: string
  color?: string
  prefix?: string
  suffix?: string
  trend?: { value: number; positive: boolean }
  delay?: number
}

/**
 * 3D stat card with animated counter, glow effect, and Framer Motion interactions.
 */
export function StatCard3D({
  label,
  value,
  icon,
  page,
  color = 'brand',
  prefix = '',
  suffix = '',
  trend,
  delay = 0,
}: StatCard3DProps) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  const colorMap: Record<string, { gradient: string; glow: string; text: string }> = {
    brand:    { gradient: 'from-brand-600/20 to-brand-800/10', glow: 'group-hover:shadow-brand-500/20', text: 'text-brand-400' },
    violet:   { gradient: 'from-violet-600/20 to-violet-800/10', glow: 'group-hover:shadow-violet-500/20', text: 'text-violet-400' },
    emerald:  { gradient: 'from-emerald-600/20 to-emerald-800/10', glow: 'group-hover:shadow-emerald-500/20', text: 'text-emerald-400' },
    orange:   { gradient: 'from-orange-600/20 to-orange-800/10', glow: 'group-hover:shadow-orange-500/20', text: 'text-orange-400' },
    pink:     { gradient: 'from-pink-600/20 to-pink-800/10', glow: 'group-hover:shadow-pink-500/20', text: 'text-pink-400' },
    cyan:     { gradient: 'from-cyan-600/20 to-cyan-800/10', glow: 'group-hover:shadow-cyan-500/20', text: 'text-cyan-400' },
    amber:    { gradient: 'from-amber-600/20 to-amber-800/10', glow: 'group-hover:shadow-amber-500/20', text: 'text-amber-400' },
  }

  const c = colorMap[color] || colorMap.brand

  return (
    <motion.button
      onClick={() => navigate(page)}
      className={`stat-card-3d group bg-gradient-to-br ${c.gradient} ${c.glow}`}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ delay: delay / 1000, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={reducedMotion ? {} : { y: -4, scale: 1.02 }}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} duration={800} />
      </div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </motion.button>
  )
}
