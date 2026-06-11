import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { path: '/', icon: '⚡', label: 'Dashboard' },
      { path: '/journey', icon: '🗺️', label: 'Founder Journey' },
      { path: '/chat', icon: '🤖', label: 'AI Agents' },
    ],
  },
  {
    label: 'Build',
    items: [
      { path: '/ideas', icon: '💡', label: 'Idea Lab' },
      { path: '/research', icon: '🔍', label: 'Research' },
      { path: '/planner', icon: '📋', label: 'Business Plan' },
      { path: '/projects', icon: '🎯', label: 'Projects' },
    ],
  },
  {
    label: 'Grow',
    items: [
      { path: '/content', icon: '✍️', label: 'Content Studio' },
      { path: '/social', icon: '📱', label: 'Social Media' },
      { path: '/seo', icon: '🔎', label: 'SEO OS' },
      { path: '/crm', icon: '👥', label: 'CRM' },
      { path: '/wordpress', icon: '🌐', label: 'Website Manager' },
    ],
  },
  {
    label: 'Operate',
    items: [
      { path: '/finance', icon: '💰', label: 'Finance' },
      { path: '/knowledge', icon: '📚', label: 'Knowledge Base' },
      { path: '/settings', icon: '⚙️', label: 'Settings' },
    ],
  },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard'
    return location.pathname === path
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#060b18' }}>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:relative z-50 lg:z-auto flex flex-col h-full
        border-r border-white/[0.06]
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[52px]' : 'w-[210px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: 'rgba(8,13,26,0.95)', backdropFilter: 'blur(24px)' }}>

        {/* Logo row */}
        <div className={`flex items-center gap-2.5 py-4 border-b border-white/[0.06] ${collapsed ? 'px-3 justify-center' : 'px-4'}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0 shadow-lg shadow-brand-900/50">
            🚀
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-white tracking-tight">OneFounder</div>
              <div className="text-[10px] text-slate-600 truncate leading-tight">OS for Founders</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-5 h-5 rounded text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all ml-auto flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-4">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="section-label px-2 mb-1.5">{section.label}</div>
              )}
              {collapsed && si > 0 && (
                <div className="h-px bg-white/[0.05] mx-1 mb-2" />
              )}
              <div className="space-y-px">
                {section.items.map(item => {
                  const active = isActive(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-0 py-2' : ''}`}
                    >
                      <span className={`text-sm flex-shrink-0 leading-none ${active ? 'drop-shadow-[0_0_6px_rgba(129,140,248,0.6)]' : ''}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User row */}
        <div className="p-1.5 border-t border-white/[0.06] space-y-px">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-300 truncate">{user?.name || 'Founder'}</div>
                <div className="text-[10px] text-slate-600 truncate">{user?.email}</div>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className={`nav-item text-slate-600 hover:text-red-400 hover:bg-red-500/8 w-full ${collapsed ? 'justify-center px-0 py-2' : ''}`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] lg:hidden"
          style={{ background: 'rgba(8,13,26,0.9)', backdropFilter: 'blur(16px)' }}>
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-1.5 -ml-1">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs">🚀</div>
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
