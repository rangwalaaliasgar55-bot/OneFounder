import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface AnimatedPageProps {
  children: ReactNode
  className?: string
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15 },
  },
}

const reducedVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.05 } },
}

/**
 * Page wrapper with Framer Motion enter/exit animations.
 * Wraps each route's content for smooth page transitions.
 */
export function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={reducedMotion ? reducedVariants : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}
