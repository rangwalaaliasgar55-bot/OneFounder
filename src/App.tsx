import { useState } from 'react';
import {
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  FolderKanban,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  X,
  Sparkles,
  Search,
  FileText,
  TrendingUp,
  Target,
  Brain,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import IdeaLab from './pages/IdeaLab';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import Finance from './pages/Finance';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'ideas', label: 'Idea Lab', icon: Lightbulb },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'finance', label: 'Finance', icon: DollarSign },
];

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <AIChat />;
      case 'ideas':
        return <IdeaLab />;
      case 'projects':
        return <Projects />;
      case 'crm':
        return <CRM />;
      case 'finance':
        return <Finance />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span
              className={`font-bold text-xl text-white whitespace-nowrap transition-opacity duration-200 ${
                sidebarOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              OneFounder
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'
                  }`}
                />
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/10">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">F</span>
            </div>
            <div
              className={`transition-opacity duration-200 ${
                sidebarOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <p className="text-sm font-medium text-white">Founder</p>
              <p className="text-xs text-slate-400">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="p-6">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;
