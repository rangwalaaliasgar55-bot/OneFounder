import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound } from '../../lib/sounds'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      playSound('pop')
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with animated blur */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
              backdropFilter: 'blur(8px) saturate(0.8)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          {/* Modal panel — 3D glass */}
          <motion.div
            className={`relative w-full ${sizes[size]}`}
            style={{
              background: 'linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(8,13,26,0.99) 100%)',
              backdropFilter: 'blur(40px) saturate(1.5)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '1rem',
              boxShadow: `
                0 24px 64px rgba(0,0,0,0.5),
                0 8px 24px rgba(0,0,0,0.3),
                0 0 0 1px rgba(0,0,0,0.2),
                inset 0 1px 0 rgba(255,255,255,0.08),
                0 0 80px rgba(99,102,241,0.06)
              `,
            }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Top highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
            />
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
