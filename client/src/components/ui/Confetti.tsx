import { useEffect, useRef, useState, useCallback } from 'react'
import { playSound } from '../../lib/sounds'

interface ConfettiPiece {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  color: string
  size: number
  shape: 'rect' | 'circle'
  opacity: number
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

/**
 * Celebration confetti burst — triggered on achievements, milestones, task completion.
 * Uses Canvas 2D for 60fps performance.
 */
export function Confetti({ active, duration = 3000, particleCount = 80 }: {
  active: boolean
  duration?: number
  particleCount?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return
    setVisible(true)
    playSound('celebrate')

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const pieces: ConfettiPiece[] = Array.from({ length: particleCount }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -18 - 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      opacity: 1,
    }))

    let animId: number
    const startTime = Date.now()

    const draw = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of pieces) {
        p.vy += 0.25 // gravity
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99 // air resistance
        p.rotation += p.rotationSpeed
        p.opacity = Math.max(0, 1 - progress)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      if (elapsed < duration) {
        animId = requestAnimationFrame(draw)
      } else {
        setVisible(false)
      }
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [active, duration, particleCount])

  if (!visible) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[300]"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

/**
 * Hook to trigger confetti on demand.
 */
export function useConfetti() {
  const [active, setActive] = useState(false)

  const celebrate = useCallback(() => {
    setActive(true)
    setTimeout(() => setActive(false), 3500)
  }, [])

  return { active, celebrate }
}
