/**
 * Background ambient orbs — creates depth and atmosphere for the app.
 * Uses CSS animations for smooth, GPU-accelerated movement.
 * Colors are theme-aware via CSS variables.
 */
export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top-left brand orb */}
      <div
        className="absolute animate-float"
        style={{ top: '-5%', left: '-5%' }}
      >
        <div
          style={{
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'var(--orb-1)',
            filter: 'blur(100px)',
          }}
        />
      </div>
      {/* Bottom-right violet orb */}
      <div
        className="absolute animate-float"
        style={{ top: '60%', right: '-8%', animationDelay: '1.5s' }}
      >
        <div
          style={{
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'var(--orb-2)',
            filter: 'blur(90px)',
          }}
        />
      </div>
      {/* Bottom-left emerald orb */}
      <div
        className="absolute animate-float"
        style={{ bottom: '10%', left: '20%', animationDelay: '3s' }}
      >
        <div
          style={{
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'var(--orb-3)',
            filter: 'blur(70px)',
          }}
        />
      </div>
    </div>
  )
}
