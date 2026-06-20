import { motion } from 'framer-motion'
import { useReducedMotion } from '../../motion/scroll'

interface EmptyStateAnimatedProps {
  icon: string
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

const containerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
}

/**
 * Animated empty state — icon floats, text fades in with Framer Motion stagger.
 */
export function EmptyStateAnimated({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateAnimatedProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
      variants={reducedMotion ? undefined : containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className="text-6xl mb-6"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
        animate={reducedMotion ? {} : { y: [0, -6, 0] }}
        transition={reducedMotion ? {} : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>
      <motion.h3
        className="text-lg font-semibold text-white mb-2"
        variants={reducedMotion ? undefined : itemVariants}
      >
        {title}
      </motion.h3>
      <motion.p
        className="text-sm text-slate-400 text-center max-w-sm mb-6"
        variants={reducedMotion ? undefined : itemVariants}
      >
        {description}
      </motion.p>
      {action && (
        <motion.button
          className="btn-primary"
          variants={reducedMotion ? undefined : itemVariants}
          onClick={action.onClick}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}
