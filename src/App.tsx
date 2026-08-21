import { useMemo, useState } from 'react';
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
  Activity,
  Bell,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import IdeaLab from './pages/IdeaLab';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import Finance from './pages/Finance';
import { usePersistentState } from './hooks/usePersistentState';
import { createSeedWorkspace, formatCompactCurrency, formatCurrency, getDaysUntil, isOverdue, makeId } from './lib/workspace';
import type { Idea, Lead, NavPage, Task, Transaction, WorkspaceData } from './types';

const navItems: Array<{
  id: NavPage;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Live founder overview and automation insights.',
    icon: LayoutDashboard,
  },
  {
    id: 'chat',
    label: 'AI Chat',
    description: 'Context-aware startup copilot with expert modes.',
    icon: MessageSquare,
  },
  {
    id: 'ideas',
    label: 'Idea Lab',
    description: 'Validate ideas, score them, and add fresh concepts.',
    icon: Lightbulb,
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Track delivery, priorities, and overdue work.',
    icon: FolderKanban,
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Move leads through your pipeline with follow-up nudges.',
    icon: Users,
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Monitor revenue, expenses, and runway signals.',
    icon: DollarSign,
  },
];

function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = usePersistentState('onefounder.sidebar-open', true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [workspace, setWorkspace] = usePersistentState<WorkspaceData>('onefounder.workspace', createSeedWorkspace);

  const activeNavItem = navItems.find((item) => item.id === activePage) ?? navItems[0];

  const monthlyIncome = workspace.transactions
    .filter((transaction) => transaction.type === 'income' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpenses = workspace.transactions
    .filter((transaction) => transaction.type === 'expense' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const workspaceHealth = useMemo(() => {
    const overdueTasks = workspace.tasks.filter(
      (task) => task.status !== 'done' && isOverdue(task.dueDate)
    ).length;
    const followUps = workspace.leads.filter(
      (lead) => lead.stage !== 'won' && getDaysUntil(lead.lastContacted) <= -7
    ).length;
    const net = monthlyIncome - monthlyExpenses;

    return {
      overdueTasks,
      followUps,
      net,
    };
  }, [monthlyExpenses, monthlyIncome, workspace.leads, workspace.tasks]);

  const addIdea = (idea: Omit<Idea, 'id' | 'createdAt' | 'score'> & { score: number }) => {
    setWorkspace((current) => ({
      ...current,
      ideas: [
        {
          ...idea,
          id: makeId('idea'),
          createdAt: new Date().toISOString(),
        },
        ...current.ideas,
      ],
    }));
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    setWorkspace((current) => ({
      ...current,
      tasks: [{ ...task, id: makeId('task') }, ...current.tasks],
    }));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    }));
  };

  const addLead = (lead: Omit<Lead, 'id' | 'lastContacted'>) => {
    setWorkspace((current) => ({
      ...current,
      leads: [
        {
          ...lead,
          id: makeId('lead'),
          lastContacted: new Date().toISOString(),
        },
        ...current.leads,
      ],
    }));
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    setWorkspace((current) => ({
      ...current,
      leads: current.leads.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead)),
    }));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setWorkspace((current) => ({
      ...current,
      transactions: [{ ...transaction, id: makeId('txn') }, ...current.transactions],
    }));
  };

  const navigateTo = (page: NavPage) => {
    setActivePage(page);
    setMobileSidebarOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard data={workspace} onNavigate={navigateTo} />;
      case 'chat':
        return <AIChat workspace={workspace} />;
      case 'ideas':
        return <IdeaLab ideas={workspace.ideas} onAddIdea={addIdea} />;
      case 'projects':
        return <Projects tasks={workspace.tasks} onAddTask={addTask} onUpdateTask={updateTask} />;
      case 'crm':
        return <CRM leads={workspace.leads} onAddLead={addLead} onUpdateLead={updateLead} />;
      case 'finance':
        return <Finance transactions={workspace.transactions} onAddTransaction={addTransaction} />;
      default:
        return <Dashboard data={workspace} onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_24%)]" />

      {mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-slate-900/85 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-24'
        } ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-950/40">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className={`${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
              <p className="text-lg font-semibold text-white">OneFounder</p>
              <p className="text-xs text-slate-400">Founder OS restored & upgraded</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            className="hidden rounded-xl border border-white/10 p-2 text-slate-400 transition-colors hover:text-white lg:block"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-xl border border-white/10 p-2 text-slate-400 transition-colors hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activePage;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                  isActive
                    ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-white shadow-lg shadow-cyan-950/25'
                    : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div
                  className={`rounded-xl p-2 ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400 group-hover:text-cyan-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className={`min-w-0 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                  <p className="font-medium">{item.label}</p>
                  <p className="truncate text-xs text-slate-400">{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <Activity className="h-4 w-4" />
              <p className={`text-sm font-medium ${sidebarOpen ? 'block' : 'hidden'}`}>
                Workspace pulse
              </p>
            </div>
            <div className={`mt-3 space-y-2 text-sm text-slate-300 ${sidebarOpen ? 'block' : 'hidden'}`}>
              <p>{workspaceHealth.overdueTasks} overdue task(s)</p>
              <p>{workspaceHealth.followUps} follow-up(s) waiting</p>
              <p>{workspaceHealth.net >= 0 ? 'Net positive' : 'Net negative'} {formatCompactCurrency(Math.abs(workspaceHealth.net))}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-24'}`}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-xl border border-white/10 p-2 text-slate-300 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm text-cyan-300">{activeNavItem.label}</p>
                <h1 className="text-xl font-semibold text-white sm:text-2xl">{activeNavItem.description}</h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">This month</p>
                <p className="text-sm font-medium text-white">
                  Revenue {formatCurrency(monthlyIncome)} · Spend {formatCurrency(monthlyExpenses)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition-colors hover:border-cyan-500/30 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
