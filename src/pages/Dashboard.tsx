import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  DollarSign,
  FolderKanban,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import {
  formatCompactCurrency,
  formatCurrency,
  formatShortDate,
  formatWeekdayDate,
  getDaysSince,
  getDaysUntil,
  getPriorityWeight,
  isOverdue,
} from '../lib/workspace';
import type { NavPage, WorkspaceData } from '../types';

interface DashboardProps {
  data: WorkspaceData;
  onNavigate: (page: NavPage) => void;
}

export default function Dashboard({ data, onNavigate }: DashboardProps) {
  const today = new Date().toISOString();
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const monthlyIncome = data.transactions
    .filter((transaction) => transaction.type === 'income' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpenses = data.transactions
    .filter((transaction) => transaction.type === 'expense' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const openLeads = data.leads.filter((lead) => lead.stage !== 'won');
  const wonDeals = data.leads.filter((lead) => lead.stage === 'won');
  const overdueTasks = data.tasks.filter((task) => task.status !== 'done' && isOverdue(task.dueDate));
  const activeTasks = data.tasks.filter((task) => task.status !== 'done');
  const completedTasks = data.tasks.filter((task) => task.status === 'done');
  const topIdea = [...data.ideas].sort((left, right) => right.score - left.score)[0];
  const tasksCompletion = data.tasks.length ? Math.round((completedTasks.length / data.tasks.length) * 100) : 0;
  const conversionRate = data.leads.length ? Math.round((wonDeals.length / data.leads.length) * 100) : 0;

  const focusTasks = [...activeTasks].sort((left, right) => {
    const overdueDiff = Number(isOverdue(right.dueDate)) - Number(isOverdue(left.dueDate));
    if (overdueDiff !== 0) {
      return overdueDiff;
    }

    const priorityDiff = getPriorityWeight(right.priority) - getPriorityWeight(left.priority);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
  }).slice(0, 4);

  const followUpLeads = data.leads
    .filter((lead) => lead.stage !== 'won' && getDaysSince(lead.lastContacted) >= 7)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);

  const autopilotItems = [
    overdueTasks.length
      ? {
          title: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} need immediate attention`,
          description: 'Clear the blockers first so execution momentum comes back quickly.',
          page: 'projects' as NavPage,
        }
      : {
          title: 'Project delivery is on track',
          description: 'No overdue work detected. This is a good window to pull the next high-impact task forward.',
          page: 'projects' as NavPage,
        },
    followUpLeads.length
      ? {
          title: `${followUpLeads.length} follow-up${followUpLeads.length > 1 ? 's' : ''} can unlock revenue`,
          description: 'Your warm pipeline is waiting on a nudge. Update CRM before the next work block ends.',
          page: 'crm' as NavPage,
        }
      : {
          title: 'CRM follow-ups look healthy',
          description: 'No stale leads detected in the current pipeline.',
          page: 'crm' as NavPage,
        },
    {
      title: `${formatCurrency(monthlyIncome - monthlyExpenses)} net movement in the last 30 days`,
      description: monthlyIncome >= monthlyExpenses
        ? 'You are operating above break-even. Keep watch on infrastructure and contractor spend.'
        : 'Your expenses are outpacing revenue. Review the finance board for cost-control actions.',
      page: 'finance' as NavPage,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Founder cockpit</p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              {greeting}, founder.
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              I restored the original app and turned it into a more useful founder workspace with persistent data,
              better responsive layouts, and lightweight automations that surface what matters next.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-cyan-300">
              <Calendar className="h-4 w-4" />
              <span>{formatWeekdayDate(today)}</span>
            </div>
            <p className="mt-2 text-slate-400">Synced across dashboard, CRM, projects, ideas, and finance.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Monthly revenue"
          value={formatCompactCurrency(monthlyIncome)}
          subtitle={`${data.transactions.filter((transaction) => transaction.type === 'income').length} income entries tracked`}
          icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
          trend={`${formatCurrency(monthlyIncome - monthlyExpenses)} net`}
        />
        <StatCard
          title="Active pipeline"
          value={formatCompactCurrency(openLeads.reduce((sum, lead) => sum + lead.value, 0))}
          subtitle={`${openLeads.length} open lead${openLeads.length === 1 ? '' : 's'} in motion`}
          icon={<Users className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
          trend={`${conversionRate}% close rate`}
        />
        <StatCard
          title="Execution health"
          value={`${tasksCompletion}%`}
          subtitle={`${completedTasks.length}/${data.tasks.length} tasks complete`}
          icon={<FolderKanban className="h-5 w-5 text-violet-300" />}
          tone="violet"
          trend={`${overdueTasks.length} overdue`}
        />
        <StatCard
          title="Best idea"
          value={topIdea ? `${topIdea.score}/100` : '—'}
          subtitle={topIdea ? topIdea.title : 'Add an idea to get started'}
          icon={<Lightbulb className="h-5 w-5 text-amber-300" />}
          tone="amber"
          trend={topIdea ? topIdea.category : undefined}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Autopilot agenda</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">The highest-leverage actions for today</h3>
            </div>
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {autopilotItems.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigate(item.page)}
                className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-cyan-500/30 hover:bg-white/10"
              >
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-500" />
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Jump to CRM', page: 'crm' as NavPage },
              { label: 'Review finance', page: 'finance' as NavPage },
              { label: 'Ship tasks', page: 'projects' as NavPage },
              { label: 'Brainstorm ideas', page: 'ideas' as NavPage },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onNavigate(action.page)}
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-500/30 hover:text-white"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Priority queue</p>
                <h3 className="mt-2 text-xl font-semibold text-white">What should move next</h3>
              </div>
              <Activity className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-5 space-y-3">
              {focusTasks.map((task) => {
                const daysUntil = getDaysUntil(task.dueDate);
                const dueLabel = daysUntil < 0
                  ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} overdue`
                  : daysUntil === 0
                    ? 'Due today'
                    : `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;

                return (
                  <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {task.assignee} · {task.priority} priority · {formatShortDate(task.dueDate)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isOverdue(task.dueDate)
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-cyan-500/15 text-cyan-300'
                        }`}
                      >
                        {dueLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Revenue follow-ups</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Warm leads to contact</h3>
              </div>
              <Target className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-5 space-y-3">
              {followUpLeads.length ? (
                followUpLeads.map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {lead.company} · {formatCompactCurrency(lead.value)} · {getDaysSince(lead.lastContacted)} days since touchpoint
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('crm')}
                        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                      >
                        Open CRM
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                  Your follow-up queue is clear. Nice work keeping the pipeline warm.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Cashflow pulse</h3>
              <p className="text-sm text-slate-400">Live summary from your finance entries.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Income</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactCurrency(monthlyIncome)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Expenses</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactCurrency(monthlyExpenses)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Net</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactCurrency(monthlyIncome - monthlyExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Momentum snapshot</h3>
              <p className="text-sm text-slate-400">A quick read on product, sales, and execution.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="font-medium text-white">Top idea:</span> {topIdea?.title ?? 'No idea saved yet'}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="font-medium text-white">Pipeline:</span> {openLeads.length} active opportunity{openLeads.length === 1 ? '' : 'ies'} worth {formatCompactCurrency(openLeads.reduce((sum, lead) => sum + lead.value, 0))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="font-medium text-white">Execution:</span> {completedTasks.length} completed task{completedTasks.length === 1 ? '' : 's'} with {overdueTasks.length} overdue right now.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
