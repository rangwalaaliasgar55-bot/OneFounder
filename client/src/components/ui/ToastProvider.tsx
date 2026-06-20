import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ToastContext, type Toast, type ToastType } from '../../hooks/useToast'
import { playSound } from '../../lib/sounds'

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const GLOW_COLORS: Record<ToastType, string> = {
  success: 'rgba(16,185,129,0.15)',
  error: 'rgba(239,68,68,0.15)',
  info: 'rgba(99,102,241,0.15)',
  warning: 'rgba(245,158,11,0.15)',
}

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'rgba(16,185,129,0.3)',
  error: 'rgba(239,68,68,0.3)',
  info: 'rgba(99,102,241,0.3)',
  warning: 'rgba(245,158,11,0.3)',
}

const ICON_BG: Record<ToastType, string> = {
  success: 'bg-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-brand-500/20 text-brand-400',
  warning: 'bg-amber-500/20 text-amber-400',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl max-w-sm w-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(8,13,26,0.98) 100%)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        border: `1px solid ${BORDER_COLORS[toast.type]}`,
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.4),
          0 0 0 1px rgba(0,0,0,0.2),
          inset 0 1px 0 rgba(255,255,255,0.06),
          0 0 20px ${GLOW_COLORS[toast.type]}
        `,
      }}
    >
      {/* Top highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${BORDER_COLORS[toast.type]} 50%, transparent 100%)` }}
      />
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${ICON_BG[toast.type]}`}>
        {ICONS[toast.type]}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-slate-200">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5 text-xs"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }])
    // Play sound based on toast type
    if (type === 'success') playSound('success')
    else if (type === 'error') playSound('error')
    else playSound('notification')
    const timer = setTimeout(() => dismiss(id), duration)
    timers.current.set(id, timer)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className="pointer-events-auto"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              layout
            >
              <ToastItem toast={t} onDismiss={dismiss} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
