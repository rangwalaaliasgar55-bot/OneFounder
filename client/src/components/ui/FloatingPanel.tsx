import { type ReactNode, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FloatingPanelProps {
  children: ReactNode
  title?: string
  open: boolean
  onClose?: () => void
  className?: string
  width?: number | string
}

/**
 * Draggable floating panel with glass morphism.
 * Can be moved by dragging the title bar.
 */
export function FloatingPanel({
  children,
  title,
  open,
  onClose,
  className = '',
  width = 360,
}: FloatingPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: dragStart.current.posX + (e.clientX - dragStart.current.x),
        y: dragStart.current.posY + (e.clientY - dragStart.current.y),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [position])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`floating-panel fixed z-50 ${className}`}
          style={{
            width,
            left: '50%',
            top: '50%',
            x: position.x,
            y: position.y,
            cursor: isDragging ? 'grabbing' : 'default',
          }}
          initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
          animate={{ opacity: 1, scale: 1, x: `calc(-50% + ${position.x}px)`, y: `calc(-50% + ${position.y}px)` }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Title bar */}
          {title && (
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <span className="text-sm font-semibold text-white">{title}</span>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
