import { type ReactNode } from 'react'

interface GlowTextProps {
  children: ReactNode
  color?: string
  className?: string
  intensity?: number
}

/**
 * Text with animated glow effect — pulses softly.
 */
export function GlowText({
  children,
  color = '#6366f1',
  className = '',
  intensity = 0.4,
}: GlowTextProps) {
  return (
    <span
      className={`inline-block ${className}`}
      style={{
        color,
        textShadow: `0 0 10px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}, 0 0 20px ${color}${Math.round(intensity * 127).toString(16).padStart(2, '0')}`,
        animation: 'glowTextPulse 2s ease-in-out infinite',
      }}
    >
      {children}
      <style>{`
        @keyframes glowTextPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
      `}</style>
    </span>
  )
}
