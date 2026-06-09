import { useState } from 'react'
import type { User } from '../../hooks/useAuth'
import { useAuth } from '../../hooks/useAuth'

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { id: 'dashboard', icon: '⚡', label: 'Dashboard' },
      { id: 'chat', icon: '🤖', label: 'AI Agents' },
    ],
  },
  {
    label: 'Build',
    items: [
      { id: 'ideas', icon: '💡', label: 'Idea Lab' },
      { id: 'research', icon: '🔍', label: 'Research' },
      { id: 'planner', icon: '📋', label: 'Business Plan' },
      { id: 'projects', icon: '🎯', label: 'Projects' },
    ],
  },
  {
    label: 'Grow',
    items: [
      { id: 'content', icon: '✍️', label: 'Content Studio' },
      { id: 'social', icon: '📱', label: 'Social Media' },
      { id: 'seo', icon: '🔎', label: 'SEO OS' },
      { id: 'crm', icon: '👥', label: 'CRM' },
    ],
  },
  {
    label: 'Operate',
    items: [
      { id: 'finance', icon: '💰', label: 'Finance' },
      { id: 'knowledge', icon: '📚', label: 'Knowledge Base' },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
    ],
  },
]

interface AppShellProps {
  currentPage: string
  navigate: (page: any) => void
  user: User
  children: React.ReactNode
}

export function AppShell({ currentPage, navigate, user, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { signOut } = useAuth()

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:relative z-50 lg:z-auto flex flex-col h-full
        border-r border-white/5 bg-surface-900/50 backdrop-blur-xl
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-base flex-shrink-0">
            🚀
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">OneFounder</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex btn-ghost p-1.5 ml-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label} className={si > 0 ? 'mt-3' : ''}>
              {!collapsed && (
                <div className="text-xs text-slate-600 font-medium uppercase tracking-wider px-3 mb-1">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.id); setMobileOpen(false) }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${currentPage === item.id
                        ? 'text-white bg-brand-600/20 border border-brand-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-white/5">
          <button
            onClick={signOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <span className="text-base">🚪</span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-surface-900/30 backdrop-blur-sm lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center text-sm">🚀</div>
            <span className="text-sm font-bold text-white">OneFounder</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
