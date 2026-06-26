import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  FolderKanban,
  Users,
  DollarSign,
  Menu,
  X,
  Sparkles,
  Search,
  Bell,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import IdeaLab from './pages/IdeaLab';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import Finance from './pages/Finance';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { isSupabaseConfigured } from './lib/supabase';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/ideas', label: 'Idea Lab', icon: Lightbulb },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/crm', label: 'CRM', icon: Users },
  { path: '/finance', label: 'Finance', icon: DollarSign },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/chat': 'AI Chat',
  '/ideas': 'Idea Lab',
  '/projects': 'Projects',
  '/crm': 'CRM',
  '/finance': 'Finance',
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const pageTitle = pageTitles[location.pathname] ?? 'OneFounder';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 w-64 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 group hover:shadow-glow transition-shadow">
                <Sparkles className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-bold text-xl text-white whitespace-nowrap">OneFounder</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group border-l-2 ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-500/10 text-white'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">F</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Founder</p>
                <p className="text-xs text-slate-400">Pro Plan</p>
              </div>
            </div>

            {/* Status strip */}
            <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
              <span
                className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-slate-500'}`}
              />
              <span className="text-xs text-slate-400">
                {isSupabaseConfigured ? 'Connected' : 'Offline mode'}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
          {/* Top header bar */}
          <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors w-40 md:w-64"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Search...</span>
              </button>
              <button className="relative p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">F</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 p-4 md:p-6">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<AIChat />} />
                <Route path="/ideas" element={<IdeaLab />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/finance" element={<Finance />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>

        {/* Command palette / search modal */}
        {searchOpen && (
          <div className="fixed inset-0 z-[80] flex items-start justify-center pt-24 px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <div className="relative w-full max-w-lg rounded-2xl bg-slate-800 border border-white/10 shadow-2xl animate-slide-up overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search pages..."
                  className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                />
                <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-left"
                  >
                    <item.icon className="w-5 h-5 text-cyan-400" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
