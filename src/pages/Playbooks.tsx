import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  PlayCircle,
  Shield,
  Sparkles,
  TimerReset,
  TrendingUp,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import {
  calculateWorkflowScore,
  formatShortDate,
  getHoursUntil,
  getReminderTone,
} from '../lib/workspace';
import type { NavPage, WorkspaceAlert, WorkspaceData } from '../types';

interface PlaybooksProps {
  workspace: WorkspaceData;
  alerts: WorkspaceAlert[];
  onLaunchTemplate: (templateId: string) => void;
  onDismissAlert: (alertId: string) => void;
  onNavigate: (page: NavPage) => void;
  onAdvanceWorkflow: (runId: string) => void;
  onCompleteReminder: (reminderId: string) => void;
}

const templates = [
  {
    id: 'weekly-review',
    name: 'Weekly founder review',
    description:
      'Creates a recurring review cadence across finance, CRM, trust, and delivery so the team closes loops before drift builds up.',
    outcomes: ['Update board report', 'Review stale leads', 'Check AI trust gaps'],
    icon: ClipboardList,
    tone: 'cyan' as const,
  },
  {
    id: 'revenue-recovery',
    name: 'Revenue recovery sprint',
    description:
      'Focuses the week on stale opportunities, pricing follow-ups, and quick cashflow recovery actions.',
    outcomes: ['Re-open warm pipeline', 'Sequence finance actions', 'Prioritize fast wins'],
    icon: TrendingUp,
    tone: 'emerald' as const,
  },
  {
    id: 'ai-incident',
    name: 'AI incident response',
    description:
      'Creates a guided incident workflow for unsafe outputs, missing human review, or sensitive-data handling problems.',
    outcomes: ['Freeze risky automation', 'Review evidence', 'Assign security owner'],
    icon: Shield,
    tone: 'rose' as const,
  },
  {
    id: 'launch-readiness',
    name: 'Launch readiness check',
    description:
      'Sets up pre-launch checks across product, support, analytics, and automation readiness.',
    outcomes: ['Confirm owners', 'Verify telemetry', 'Review customer-facing AI'],
    icon: CheckCircle2,
    tone: 'amber' as const,
  },
  {
    id: 'shadow-ai-cleanup',
    name: 'Shadow AI cleanup',
    description:
      'Runs a governance sprint to find risky AI usage, force inventories, and migrate work into approved flows.',
    outcomes: ['Inventory tools', 'Gate risky actions', 'Document approved alternatives'],
    icon: TimerReset,
    tone: 'violet' as const,
  },
];

export default function Playbooks({
  workspace,
  alerts,
  onLaunchTemplate,
  onDismissAlert,
  onNavigate,
  onAdvanceWorkflow,
  onCompleteReminder,
}: PlaybooksProps) {
  const workflowScore = calculateWorkflowScore(workspace);
  const activeRuns = workspace.workflowRuns.filter((run) => run.status !== 'completed');
  const sortedReminders = [...workspace.reminders].sort(
    (left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Workflow playbooks</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Turn repeatable AI-era work into guided operational systems</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Great teams do not just use AI faster. They turn recurring work into clear playbooks with owners,
              review gates, incident paths, reminder loops, and outcome-focused templates that anyone can launch in seconds.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-slate-200">
            Workflow health score <span className="font-semibold text-white">{workflowScore}/100</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active workflow runs"
          value={String(activeRuns.length)}
          subtitle="Currently helping the team execute"
          icon={<PlayCircle className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="Live alerts"
          value={String(alerts.length)}
          subtitle="Actionable workflow friction detected"
          icon={<AlertTriangle className="h-5 w-5 text-rose-300" />}
          tone="rose"
        />
        <StatCard
          title="Pending approvals"
          value={String(workspace.approvalRequests.filter((request) => request.status === 'pending').length)}
          subtitle="Waiting for governed decisions"
          icon={<Shield className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
        <StatCard
          title="Due reminders"
          value={String(workspace.reminders.filter((reminder) => reminder.status === 'due').length)}
          subtitle="Scheduled follow-through waiting"
          icon={<Sparkles className="h-5 w-5 text-violet-300" />}
          tone="violet"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">Launchable templates</h2>
          <p className="mt-1 text-sm text-slate-400">Use one-click playbooks to create structure around recurring operating problems.</p>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {templates.map((template) => {
              const Icon = template.icon;
              const toneMap = {
                cyan: 'from-cyan-500/15 to-blue-600/10 border-cyan-500/20 text-cyan-300',
                emerald: 'from-emerald-500/15 to-teal-600/10 border-emerald-500/20 text-emerald-300',
                rose: 'from-rose-500/15 to-pink-600/10 border-rose-500/20 text-rose-300',
                amber: 'from-amber-500/15 to-orange-600/10 border-amber-500/20 text-amber-300',
                violet: 'from-violet-500/15 to-fuchsia-600/10 border-violet-500/20 text-violet-300',
              } as const;

              return (
                <div key={template.id} className={`rounded-3xl border bg-gradient-to-br ${toneMap[template.tone]} p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{template.description}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {template.outcomes.map((outcome) => (
                      <span key={outcome} className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-200">
                        {outcome}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onLaunchTemplate(template.id)}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                  >
                    Launch workflow
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">Alert inbox</h2>
          <p className="mt-1 text-sm text-slate-400">This queue turns observability and governance signals into fast actions.</p>
          <div className="mt-6 space-y-3">
            {alerts.length ? (
              alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${alert.severity === 'critical' ? 'bg-rose-500/15 text-rose-300' : alert.severity === 'warning' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                          {alert.severity}
                        </span>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{alert.category}</span>
                      </div>
                      <p className="mt-3 font-medium text-white">{alert.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{alert.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate(alert.page)}
                      className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                    >
                      {alert.actionLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismissAlert(alert.id)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                No active alerts right now. This is a good time to run a weekly review or launch-readiness playbook.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">Active runbooks</h2>
          <p className="mt-1 text-sm text-slate-400">Advance one step at a time so execution stays structured and visible.</p>
          <div className="mt-6 space-y-4">
            {activeRuns.length ? (
              activeRuns.map((run) => {
                const progress = run.steps.length ? Math.round((run.completedSteps / run.steps.length) * 100) : 0;
                const nextStep = run.steps[run.completedSteps] ?? 'Run complete';
                return (
                  <div key={run.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">{run.name}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{run.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {run.relatedPages.map((page) => (
                            <button
                              key={page}
                              type="button"
                              onClick={() => onNavigate(page)}
                              className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-cyan-500/30 hover:text-white"
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Progress</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{progress}%</p>
                      </div>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                      <div>
                        <p className="text-sm font-medium text-white">Next step</p>
                        <p className="mt-1 text-sm text-slate-400">{nextStep}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAdvanceWorkflow(run.id)}
                        className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
                      >
                        Advance step
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                No active workflows yet. Launch one above to turn repeated work into a guided system.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">Reminders</h2>
          <p className="mt-1 text-sm text-slate-400">Scheduled follow-through keeps AI output tied to real execution.</p>
          <div className="mt-6 space-y-3">
            {sortedReminders.map((reminder) => (
              <div key={reminder.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getReminderTone(reminder.status)}`}>
                        {reminder.status}
                      </span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                        {reminder.owner}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-white">{reminder.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{reminder.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Due {formatShortDate(reminder.dueAt)} · {getHoursUntil(reminder.dueAt)}h from now
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(reminder.linkedPage)}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    Open related page
                  </button>
                  {reminder.status !== 'done' ? (
                    <button
                      type="button"
                      onClick={() => onCompleteReminder(reminder.id)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Mark done
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-semibold text-white">Workflow history</h2>
        <p className="mt-1 text-sm text-slate-400">Keep a record of the guided workflows the team has launched.</p>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {workspace.workflowRuns.map((run) => (
            <div key={run.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{run.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{run.summary}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${run.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : run.status === 'active' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-700/60 text-slate-300'}`}>
                  {run.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-400">
                <span>{run.owner}</span>
                <span>{formatShortDate(run.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
