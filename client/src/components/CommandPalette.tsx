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
      <div
        className="w-full max-w-xl glass-card border border-white/[0.12] shadow-2xl shadow-black/60 overflow-hidden rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="px-4 py-8 text-center text-xs text-slate-400">No results for "{query}"</div>
          )}
          {sections.map(section => (
            <div key={section}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{section}</div>
              {filtered.filter(c => c.section === section).map((cmd, idx) => {
                const globalIdx = filtered.indexOf(cmd)
                return (
                  <button
                    key={cmd.id}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelected(globalIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selected === globalIdx ? 'bg-brand-600/20 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base w-5 text-center flex-shrink-0">{cmd.icon}</span>
                    <span className="text-sm font-medium">{cmd.label}</span>
                    {selected === globalIdx && (
                      <kbd className="ml-auto text-[10px] text-slate-400 border border-white/[0.08] rounded px-1.5 py-0.5 font-mono">↵</kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.06]">
          <span className="text-[10px] text-slate-400">↑↓ navigate</span>
          <span className="text-[10px] text-slate-400">↵ open</span>
          <span className="text-[10px] text-slate-400">esc close</span>
        </div>
      </div>
    </div>
  )
}
