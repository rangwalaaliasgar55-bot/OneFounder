import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  spotlightColor?: string
}

/**
 * Card with a spotlight effect that follows the mouse.
 * Uses Framer Motion motion values for GPU-accelerated tracking.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(99,102,241,0.08)',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  const mouseX = useMotionValue(50)
  const mouseY = useMotionValue(50)

  const springConfig = { stiffness: 100, damping: 25 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const spotlightBg = useTransform(
    [x, y],
    ([px, py]) => `radial-gradient(circle 200px at ${px}% ${py}%, ${spotlightColor} 0%, transparent 100%)`
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mouseX.set(((e.clientX - rect.left) / rect.width) * 100)
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100)
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: reducedMotion ? 'none' : spotlightBg }}
      />
      {children}
    </div>
  )
}
