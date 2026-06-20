interface MeshGradientProps {
  className?: string
  colors?: string[]
  speed?: number
}

/**
 * Animated mesh gradient background — creates a living, breathing backdrop.
 * Uses CSS animation for smooth color transitions.
 * Default colors are theme-aware via CSS variables.
 */
export function MeshGradient({
  className = '',
  colors,
  speed = 20,
}: MeshGradientProps) {
  // Use theme-aware defaults if no custom colors provided
  const defaultColors = [
    'var(--bg-gradient-1)',
    'var(--bg-gradient-2)',
    'var(--orb-3)',
    'rgba(244,63,94,0.04)',
  ]
  const c = colors || defaultColors
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20% ${c[0]} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20% ${c[1]} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80% ${c[2]} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80% ${c[3]} 0%, transparent 50%)
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
