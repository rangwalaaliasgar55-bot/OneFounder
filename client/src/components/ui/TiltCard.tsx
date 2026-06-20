import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface TiltCardProps {
  children: ReactNode
  className?: string
  tiltAmount?: number
  glareOpacity?: number
  scale?: number
}

/**
 * 3D tilt card that follows mouse position with realistic perspective,
 * glare effect, and smooth spring transitions. Uses Framer Motion
 * motion values for GPU-accelerated transforms (bypasses React re-renders).
 */
export function TiltCard({
  children,
  className = '',
  tiltAmount = 15,
  glareOpacity = 0.15,
  scale = 1.02,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // Motion values — update without React re-renders
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring-smoothed values for fluid animation
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 }
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [tiltAmount, -tiltAmount]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-tiltAmount, tiltAmount]), springConfig)
  const glareX = useSpring(mouseX, { stiffness: 100, damping: 25 })
  const glareY = useSpring(mouseY, { stiffness: 100, damping: 25 })
  const glareOpacityMV = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    mouseX.set(x)
    mouseY.set(y)
    glareOpacityMV.set(1)
  }

  const handleMouseLeave = () => {
    mouseX.set(0.5)
    mouseY.set(0.5)
    glareOpacityMV.set(0)
  }

  // Transform values for the glare gradient position
  const glareBgX = useTransform(glareX, (v) => `${v * 100}%`)
  const glareBgY = useTransform(glareY, (v) => `${v * 100}%`)

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
        scale: reducedMotion ? 1 : scale,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Glare overlay */}
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          opacity: reducedMotion ? 0 : glareOpacityMV,
          background: useTransform(
            [glareBgX, glareBgY],
            ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,${glareOpacity}) 0%, transparent 60%)`
          ),
        }}
      />
    </motion.div>
  )
}
