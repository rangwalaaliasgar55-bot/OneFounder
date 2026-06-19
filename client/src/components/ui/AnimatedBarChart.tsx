import { useEffect, useRef, useState } from 'react'

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
 * Animated bar chart — bars grow from 0 with stagger.
 * Pure CSS/SVG, no dependencies.
 */
export function AnimatedBarChart({
  data,
  height = 200,
  className = '',
  showValues = true,
  maxValue,
}: AnimatedBarChartProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
              <span
                className="text-xs font-semibold text-white transition-all duration-500"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: `${i * 80 + 400}ms`,
                }}
              >
                {item.value}
              </span>
            )}
            <div
              className="w-full rounded-t-lg transition-all duration-700 ease-out relative overflow-hidden"
              style={{
                height: visible ? `${percent}%` : '0%',
                background: `linear-gradient(to top, ${color}, ${color}88)`,
                transitionDelay: `${i * 80}ms`,
                boxShadow: `0 0 12px ${color}40`,
                minHeight: visible && item.value > 0 ? '4px' : '0',
              }}
            >
              {/* Shine */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  transform: 'skewX(-15deg)',
                }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}
