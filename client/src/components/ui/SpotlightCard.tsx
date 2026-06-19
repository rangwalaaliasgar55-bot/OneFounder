import { useRef, useState, useCallback, type ReactNode } from 'react'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  spotlightColor?: string
}

/**
 * Card with a spotlight effect that follows the mouse.
 * The spotlight illuminates the area around the cursor.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(99,102,241,0.08)',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 50, y: 50 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle 200px at ${position.x}% ${position.y}%, ${spotlightColor} 0%, transparent 100%)`,
        }}
      />
      {children}
    </div>
  )
}
