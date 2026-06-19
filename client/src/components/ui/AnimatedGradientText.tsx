import { type ReactNode } from 'react'

interface AnimatedGradientTextProps {
  children: ReactNode
  className?: string
  colors?: string[]
  speed?: number
}

/**
 * Text with animated gradient that shifts colors.
 */
export function AnimatedGradientText({
  children,
  className = '',
  colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#6366f1'],
  speed = 3,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: '200% 100%',
        animation: `gradientTextShift ${speed}s linear infinite`,
      }}
    >
      {children}
      <style>{`
        @keyframes gradientTextShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </span>
  )
}
