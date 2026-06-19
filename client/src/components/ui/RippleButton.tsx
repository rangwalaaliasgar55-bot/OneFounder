import { useRef, useCallback, type ReactNode, type MouseEvent } from 'react'

interface RippleButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  rippleColor?: string
}

/**
 * Button with material-design ripple effect on click.
 */
export function RippleButton({
  children,
  className = '',
  onClick,
  rippleColor = 'rgba(255,255,255,0.2)',
}: RippleButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = document.createElement('span')
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: ${rippleColor};
      pointer-events: none;
      width: 0; height: 0;
      left: ${x}px; top: ${y}px;
      transform: translate(-50%, -50%);
      animation: rippleEffect 0.6s ease-out forwards;
    `
    el.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)

    onClick?.()
  }, [onClick, rippleColor])

  return (
    <button
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
      <style>{`
        @keyframes rippleEffect {
          to { width: 300px; height: 300px; opacity: 0; }
        }
      `}</style>
    </button>
  )
}
