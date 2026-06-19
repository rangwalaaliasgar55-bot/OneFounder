interface GlowOrbProps {
  color?: string
  size?: number
  className?: string
  blur?: number
}

/**
 * Ambient glow orb — creates depth and atmosphere.
 * Place behind content for a subtle lighting effect.
 */
export function GlowOrb({
  color = 'rgba(99,102,241,0.15)',
  size = 300,
  className = '',
  blur = 80,
}: GlowOrbProps) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: `blur(${blur}px)`,
        willChange: 'transform',
      }}
    />
  )
}
