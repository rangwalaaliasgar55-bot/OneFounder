import { useEffect, useRef } from 'react'

/**
 * Cursor glow follower — a soft light that follows the mouse.
 * Creates depth and atmosphere. Uses requestAnimationFrame for smooth 60fps.
 */
export function CursorGlow({ color = '99,102,241', size = 300, opacity = 0.06 }: {
  color?: string
  size?: number
  opacity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let animId: number
    let mouseX = 0
    let mouseY = 0
    let currentX = 0
    let currentY = 0

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const animate = () => {
      // Smooth lerp
      currentX += (mouseX - currentX) * 0.08
      currentY += (mouseY - currentY) * 0.08

      el.style.transform = `translate(${currentX - size / 2}px, ${currentY - size / 2}px)`
      animId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    animId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(animId)
    }
  }, [size])

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 pointer-events-none z-[1] hidden lg:block"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${color},${opacity}) 0%, transparent 70%)`,
        filter: 'blur(40px)',
        willChange: 'transform',
      }}
    />
  )
}
