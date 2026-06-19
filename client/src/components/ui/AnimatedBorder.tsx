import { type ReactNode } from 'react'

interface AnimatedBorderProps {
  children: ReactNode
  className?: string
  colors?: string[]
  duration?: number
}

/**
 * Card with animated gradient border that rotates around the edge.
 * Creates a stunning "living border" effect.
 */
export function AnimatedBorder({
  children,
  className = '',
  colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#6366f1'],
  duration = 4,
}: AnimatedBorderProps) {
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {/* Animated border */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `conic-gradient(from var(--border-angle, 0deg), ${colors.join(', ')})`,
          animation: `borderRotate ${duration}s linear infinite`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />
      {/* Content */}
      <div className="relative rounded-xl bg-surface-950">
        {children}
      </div>
      <style>{`
        @property --border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes borderRotate {
          to { --border-angle: 360deg; }
        }
      `}</style>
    </div>
  )
}
