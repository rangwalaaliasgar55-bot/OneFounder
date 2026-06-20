import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useReducedMotion } from '../../motion/scroll'

interface BarData {
  label: string
  value: number
  color?: string
}

interface AnimatedBarChartProps {
  data: BarData[]
  height?: number
  className?: string
  showValues?: boolean
  maxValue?: number
}

/**
 * Animated bar chart — bars grow from 0 with stagger using Framer Motion.
 */
export function AnimatedBarChart({
  data,
  height = 200,
  className = '',
  showValues = true,
  maxValue,
}: AnimatedBarChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const reducedMotion = useReducedMotion()

  const max = maxValue || Math.max(...data.map(d => d.value), 1)
  const defaultColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185']

  return (
    <div ref={ref} className={`flex items-end gap-2 ${className}`} style={{ height }}>
      {data.map((item, i) => {
        const percent = (item.value / max) * 100
        const color = item.color || defaultColors[i % defaultColors.length]
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            {showValues && (
              <motion.span
                className="text-xs font-semibold text-white"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={isInView ? (reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }) : {}}
                transition={{ delay: i * 0.08 + 0.4, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                {item.value}
              </motion.span>
            )}
            <motion.div
              className="w-full rounded-t-lg relative overflow-hidden"
              style={{
                background: `linear-gradient(to top, ${color}, ${color}88)`,
                boxShadow: `0 0 12px ${color}40`,
              }}
              initial={{ height: 0 }}
              animate={isInView ? { height: `${percent}%`, minHeight: item.value > 0 ? 4 : 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Shine */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  transform: 'skewX(-15deg)',
                }}
              />
            </motion.div>
            <span className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}
