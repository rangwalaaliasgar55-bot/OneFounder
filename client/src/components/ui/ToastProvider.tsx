import { useState, useCallback, useRef } from 'react'
import { ToastContext, type Toast, type ToastType } from '../../hooks/useToast'

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/40 bg-red-500/10 text-red-300',
  info:    'border-brand-500/40 bg-brand-500/10 text-brand-300',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-500/20 text-emerald-400',
  error:   'bg-red-500/20 text-red-400',
  info:    'bg-brand-500/20 text-brand-400',
  warning: 'bg-amber-500/20 text-amber-400',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl animate-slide-up max-w-sm w-full ${STYLES[toast.type]}`}
      style={{ background: 'rgba(8,13,26,0.92)' }}
    >
      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${ICON_STYLES[toast.type]}`}>
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
    const timer = setTimeout(() => dismiss(id), duration)
    timers.current.set(id, timer)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
