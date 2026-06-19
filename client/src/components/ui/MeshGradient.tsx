import { useEffect, useRef } from 'react'

interface MeshGradientProps {
  className?: string
  colors?: string[]
  speed?: number
}

/**
 * Animated mesh gradient background — creates a living, breathing backdrop.
 * Uses CSS @property animation for smooth color transitions.
 */
export function MeshGradient({
  className = '',
  colors = ['rgba(99,102,241,0.12)', 'rgba(139,92,246,0.08)', 'rgba(16,185,129,0.06)', 'rgba(244,63,94,0.04)'],
  speed = 20,
}: MeshGradientProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20% ${colors[0]} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20% ${colors[1]} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80% ${colors[2]} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80% ${colors[3]} 0%, transparent 50%)
          `,
          animation: `meshMove ${speed}s ease-in-out infinite alternate`,
        }}
      />
      <style>{`
        @keyframes meshMove {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-2%, 3%) scale(1.02); }
          50% { transform: translate(3%, -2%) scale(0.98); }
          75% { transform: translate(-1%, -3%) scale(1.01); }
          100% { transform: translate(2%, 1%) scale(1); }
        }
      `}</style>
    </div>
  )
}
