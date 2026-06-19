import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const COMMANDS = [
  { id: 'dashboard',  label: 'Dashboard',         icon: '⚡', path: '/',          section: 'Navigate' },
  { id: 'journey',   label: 'Founder Journey',    icon: '🗺️', path: '/journey',   section: 'Navigate' },
  { id: 'chat',      label: 'AI Agents',           icon: '🤖', path: '/chat',      section: 'Navigate' },
  { id: 'investor',  label: 'Investor Mode',       icon: '💎', path: '/investor',  section: 'Navigate' },
  { id: 'ideas',     label: 'Idea Lab',            icon: '💡', path: '/ideas',     section: 'Navigate' },
  { id: 'research',  label: 'Market Research',     icon: '🔍', path: '/research',  section: 'Navigate' },
  { id: 'planner',   label: 'Business Planner',    icon: '📋', path: '/planner',   section: 'Navigate' },
  { id: 'projects',  label: 'Projects',            icon: '🎯', path: '/projects',  section: 'Navigate' },
  { id: 'content',   label: 'Content Studio',      icon: '✍️', path: '/content',   section: 'Navigate' },
  { id: 'social',    label: 'Social Media',        icon: '📱', path: '/social',    section: 'Navigate' },
  { id: 'seo',       label: 'SEO OS',              icon: '🔎', path: '/seo',       section: 'Navigate' },
  { id: 'crm',       label: 'CRM',                 icon: '👥', path: '/crm',       section: 'Navigate' },
  { id: 'wordpress', label: 'Website Manager',     icon: '🌐', path: '/wordpress', section: 'Navigate' },
  { id: 'finance',   label: 'Finance Tracker',     icon: '💰', path: '/finance',   section: 'Navigate' },
  { id: 'knowledge', label: 'Knowledge Base',      icon: '📚', path: '/knowledge', section: 'Navigate' },
  { id: 'settings',  label: 'Settings',            icon: '⚙️', path: '/settings',  section: 'Navigate' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const filtered = query.trim()
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.section.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const execute = useCallback((cmd: typeof COMMANDS[0]) => {
    navigate(cmd.path)
    onClose()
  }, [navigate, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') { e.preventDefault(); if (filtered[selected]) execute(filtered[selected]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, selected, execute, onClose])

  useEffect(() => { setSelected(0) }, [query])

  if (!open) return null

  const sections = [...new Set(filtered.map(c => c.section))]

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(99,102,241,0.05), rgba(0,0,0,0.6))', backdropFilter: 'blur(12px)' }}
      />
      {/* Panel — 3D glass */}
      <div
        className="w-full max-w-xl animate-scale-in relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(8,13,26,0.99) 100%)',
          backdropFilter: 'blur(40px) saturate(1.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: `
            0 24px 64px rgba(0,0,0,0.5),
            0 8px 24px rgba(0,0,0,0.3),
            0 0 0 1px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 60px rgba(99,102,241,0.08)
          `,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }} />

        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, actions…"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
          />
          <kbd className="text-[10px] text-slate-400 border border-white/[0.08] rounded px-1.5 py-0.5 font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-xs text-slate-400">No results for "{query}"</div>
            </div>
          )}
          {sections.map(section => (
            <div key={section}>
              <div className="px-5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{section}</div>
              {filtered.filter(c => c.section === section).map((cmd, idx) => {
                const globalIdx = filtered.indexOf(cmd)
                return (
                  <button
                    key={cmd.id}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelected(globalIdx)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 ${
                      selected === globalIdx
                        ? 'bg-brand-600/15 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                    style={selected === globalIdx ? {
                      boxShadow: 'inset 0 0 20px rgba(99,102,241,0.05)',
                    } : undefined}
                  >
                    <span className="text-base w-5 text-center flex-shrink-0">{cmd.icon}</span>
                    <span className="text-sm font-medium">{cmd.label}</span>
                    {selected === globalIdx && (
                      <kbd className="ml-auto text-[10px] text-brand-400 border border-brand-500/20 rounded px-1.5 py-0.5 font-mono bg-brand-500/10">↵</kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-white/[0.06]">
          <span className="text-[10px] text-slate-500 flex items-center gap-1"><kbd className="text-[10px] border border-white/[0.08] rounded px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1"><kbd className="text-[10px] border border-white/[0.08] rounded px-1 py-0.5 font-mono">↵</kbd> open</span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1"><kbd className="text-[10px] border border-white/[0.08] rounded px-1 py-0.5 font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
