import { useRef, useState, useCallback, type ReactNode } from 'react'

interface HolographicCardProps {
  children: ReactNode
  className?: string
}

/**
 * Holographic card — rainbow shimmer that follows mouse position.
 * Creates a stunning "hologram" effect on hover.
 */
export function HolographicCard({ children, className = '' }: HolographicCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setStyle({
      '--holo-x': `${x}%`,
      '--holo-y': `${y}%`,
    } as React.CSSProperties)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setStyle({})
  }, [])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Holographic overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `
            radial-gradient(circle at var(--holo-x, 50%) var(--holo-y, 50%),
              rgba(255,0,0,0.06) 0%,
              rgba(255,127,0,0.06) 15%,
              rgba(255,255,0,0.06) 30%,
              rgba(0,255,0,0.06) 45%,
              rgba(0,0,255,0.06) 60%,
              rgba(75,0,130,0.06) 75%,
              rgba(148,0,211,0.06) 90%,
              transparent 100%
            )
          `,
          mixBlendMode: 'overlay',
        }}
      />
      {/* Shine line */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(
            ${105 + (((parseInt(String(style['--holo-x'] || '50').replace('%', '')) || 50) - 50) * 0.5}deg,
            transparent 40%,
            rgba(255,255,255,0.08) 45%,
            rgba(255,255,255,0.12) 50%,
            rgba(255,255,255,0.08) 55%,
            transparent 60%
          )`,
        }}
      />
    </div>
  )
}
