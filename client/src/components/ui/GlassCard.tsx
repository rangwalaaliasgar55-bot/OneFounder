import { type ReactNode, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'flat' | 'raised' | 'elevated'
  interactive?: boolean
  glow?: string
  onClick?: () => void
}

const variantStyles = {
  flat: 'shadow-sm',
  raised: 'shadow-md',
  elevated: 'shadow-lg',
}

/**
 * Unified glass card component with Framer Motion hover/tap.
 * Combines card, card-3d, and card-hover into one flexible component.
 */
export function GlassCard({
  children,
  className = '',
  variant = 'raised',
  interactive = false,
  glow,
  onClick,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // Spotlight effect on hover
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const spotlightX = useSpring(mouseX, { stiffness: 100, damping: 25 })
  const spotlightY = useSpring(mouseY, { stiffness: 100, damping: 25 })

  const spotlightBg = useTransform(
    [spotlightX, spotlightY],
    ([x, y]: number[]) => `radial-gradient(circle at ${(x as number) * 100}% ${(y as number) * 100}%, ${glow || 'rgba(99,102,241,0.06)'} 0%, transparent 50%)`
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !interactive) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  const interactiveProps = interactive
    ? {
        whileHover: reducedMotion ? {} : { y: -2, scale: 1.005 },
        whileTap: reducedMotion ? {} : { scale: 0.995 },
        transition: { type: 'spring' as const, stiffness: 200, damping: 20 },
      }
    : {}

  return (
    <motion.div
      ref={ref}
      className={`
        card ${variantStyles[variant]}
        ${interactive ? 'cursor-pointer' : ''}
        ${className}
      `}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      {...interactiveProps}
    >
      {interactive && glow && !reducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{ background: spotlightBg }}
        />
      )}
      {children}
    </motion.div>
  )
}
