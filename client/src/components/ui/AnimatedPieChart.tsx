import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface PieData {
  label: string
  value: number
  color: string
}

interface AnimatedPieChartProps {
  data: PieData[]
  size?: number
  className?: string
  innerRadius?: number
}

/**
 * Animated donut chart — segments grow from 0 with Framer Motion stagger.
 */
export function AnimatedPieChart({
  data,
  size = 200,
  className = '',
  innerRadius = 0.6,
}: AnimatedPieChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const reducedMotion = useReducedMotion()

  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 10
  const ir = r * innerRadius

  let currentAngle = -90

  return (
    <div ref={ref} className={`inline-flex flex-col items-center gap-4 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          const angle = (item.value / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          currentAngle = endAngle

          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180

          const x1 = cx + r * Math.cos(startRad)
          const y1 = cy + r * Math.sin(startRad)
          const x2 = cx + r * Math.cos(endRad)
          const y2 = cy + r * Math.sin(endRad)
          const ix1 = cx + ir * Math.cos(endRad)
          const iy1 = cy + ir * Math.sin(endRad)
          const ix2 = cx + ir * Math.cos(startRad)
          const iy2 = cy + ir * Math.sin(startRad)

          const largeArc = angle > 180 ? 1 : 0
          const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2} Z`

          return (
            <motion.path
              key={item.label}
              d={path}
              fill={item.color}
              style={{
                filter: `drop-shadow(0 0 6px ${item.color}40)`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
          )
        })}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="11">
          total
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-xs text-slate-400">{item.label}</span>
            <span className="text-xs font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
