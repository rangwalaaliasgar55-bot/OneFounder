import { useRef, useState, useCallback, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  tiltAmount?: number
  glareOpacity?: number
  scale?: number
}

/**
 * 3D tilt card that follows mouse position with realistic perspective,
 * glare effect, and smooth transitions. Creates a "holographic" feel.
 */
export function TiltCard({
  children,
  className = '',
  tiltAmount = 15,
  glareOpacity = 0.15,
  scale = 1.02,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({})

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * -tiltAmount
    const rotateY = ((x - centerX) / centerX) * tiltAmount

    // Glare position
    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.1s ease-out',
    })

    setGlareStyle({
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,${glareOpacity}) 0%, transparent 60%)`,
      opacity: 1,
    })
  }, [tiltAmount, glareOpacity, scale])

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    })
    setGlareStyle({ opacity: 0 })
  }, [])

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{ transformStyle: 'preserve-3d', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Glare overlay */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300"
        style={glareStyle}
      />
    </div>
  )
}
