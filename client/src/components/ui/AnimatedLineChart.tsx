import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface LineData {
  label: string
  value: number
}

interface AnimatedLineChartProps {
  data: LineData[]
  height?: number
  className?: string
  color?: string
  showDots?: boolean
  showArea?: boolean
}

/**
 * Animated line chart — line draws from left to right using Framer Motion pathLength.
 */
export function AnimatedLineChart({
  data,
  height = 160,
  className = '',
  color = '#6366f1',
  showDots = true,
  showArea = true,
}: AnimatedLineChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const reducedMotion = useReducedMotion()

  if (data.length < 2) return null

  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const w = 400
  const h = height
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom

  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - min) / range) * chartH,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  return (
    <div ref={ref} className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + chartH * (1 - pct)
          const val = Math.round(min + range * pct)
          return (
            <g key={i}>
              <line
                x1={padding.left} y1={y} x2={w - padding.right} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#475569" fontSize="10">
                {val}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        {showArea && (
          <motion.path
            d={areaPath}
            fill={`url(#areaGrad-${color.replace('#', '')})`}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.3 } : {}}
            transition={{ delay: 0.5, duration: 1, ease: [0.4, 0, 0.2, 1] }}
          />
        )}

        {/* Line — uses pathLength for the draw effect */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={reducedMotion ? { duration: 0.1 } : { delay: 0.2, duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Dots */}
        {showDots && points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#0f172a"
            stroke={color}
            strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padding.left + (i / (data.length - 1)) * chartW}
            y={h - 5}
            textAnchor="middle"
            fill="#475569"
            fontSize="10"
          >
            {d.label}
          </text>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id={`areaGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
