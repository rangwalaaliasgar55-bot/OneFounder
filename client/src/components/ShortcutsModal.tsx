import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SHORTCUTS = [
  { section: 'Navigation', items: [
    { keys: ['⌘', 'K'], desc: 'Open command palette' },
    { keys: ['?'], desc: 'Show keyboard shortcuts' },
    { keys: ['Esc'], desc: 'Close any modal or palette' },
  ]},
  { section: 'Pages', items: [
    { keys: ['G', 'D'], desc: 'Go to Dashboard' },
    { keys: ['G', 'A'], desc: 'Go to AI Agents' },
    { keys: ['G', 'I'], desc: 'Go to Idea Lab' },
    { keys: ['G', 'F'], desc: 'Go to Finance' },
    { keys: ['G', 'C'], desc: 'Go to CRM' },
    { keys: ['G', 'P'], desc: 'Go to Projects' },
  ]},
  { section: 'Interface', items: [
    { keys: ['⌘', '/'], desc: 'Toggle sidebar collapse' },
    { keys: ['↑', '↓'], desc: 'Navigate command palette' },
    { keys: ['↵'], desc: 'Execute selected command' },
  ]},
]

interface Props {
  open: boolean
  onClose: () => void
}

export function ShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] shadow-2xl shadow-black/80 overflow-hidden"
            style={{ background: 'rgba(8,13,26,0.97)', backdropFilter: 'blur(24px)' }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-base">⌨️</span>
                <h2 className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors text-xs">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {SHORTCUTS.map(section => (
                <div key={section.section} className="space-y-2">
                  <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{section.section}</h3>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <div key={item.desc} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                        <span className="text-xs text-slate-400">{item.desc}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, i) => (
                            <kbd key={i} className="text-[11px] font-mono text-slate-400 bg-white/[0.06] border border-white/[0.1] rounded px-1.5 py-0.5">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-white/[0.06] flex justify-center">
              <span className="text-[10px] text-slate-700">Press <kbd className="font-mono text-[10px] bg-white/[0.06] border border-white/[0.08] rounded px-1 py-0.5 text-slate-500">?</kbd> anytime to show this</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
