import { useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Clock3,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import {
  calculateAutomationHours,
  formatShortDate,
  getAutomationStatusTone,
  getSensitivityTone,
} from '../lib/workspace';
import type {
  ApprovalMode,
  Automation,
  AutomationStatus,
  DataSensitivity,
} from '../types';

interface AutomationsProps {
  automations: Automation[];
  onAddAutomation: (automation: Omit<Automation, 'id'>) => void;
  onUpdateAutomation: (automationId: string, updates: Partial<Automation>) => void;
}

interface AutomationFormState {
  name: string;
  description: string;
  trigger: string;
  owner: string;
  status: AutomationStatus;
  approvalMode: ApprovalMode;
  sensitivity: DataSensitivity;
  hoursSavedPerWeek: string;
  reliability: string;
  linkedMetric: string;
  fallback: string;
}

const emptyForm: AutomationFormState = {
  name: '',
  description: '',
  trigger: 'Daily at 9:00 AM',
  owner: 'Founder',
  status: 'draft',
  approvalMode: 'human-review',
  sensitivity: 'internal',
  hoursSavedPerWeek: '2',
  reliability: '85',
  linkedMetric: '',
  fallback: 'Manual process if automation fails',
};

const templates: Array<Omit<Automation, 'id' | 'lastRun' | 'nextReview'>> = [
  {
    name: 'Founder weekly briefing',
    description: 'Summarize pipeline, shipping risks, and cash movement into one digest for Monday planning.',
    trigger: 'Every Monday at 8:30 AM',
    owner: 'Chief of Staff',
    status: 'draft',
    approvalMode: 'human-review',
    sensitivity: 'confidential',
    hoursSavedPerWeek: 2,
    reliability: 90,
    linkedMetric: 'Planning overhead',
    fallback: 'Manual review across dashboard and finance pages',
  },
  {
    name: 'Invoice chase assistant',
    description: 'Create reminders for unpaid invoices before they become revenue drag.',
    trigger: 'Every weekday at 10:00 AM',
    owner: 'Finance Lead',
    status: 'draft',
    approvalMode: 'human-review',
    sensitivity: 'confidential',
    hoursSavedPerWeek: 1.5,
    reliability: 88,
    linkedMetric: 'Days sales outstanding',
    fallback: 'Manual accounts receivable review',
  },
  {
    name: 'Support risk escalator',
    description: 'Flag support drafts that mention refunds, contracts, or cancellations before they go out.',
    trigger: 'On high-risk support response',
    owner: 'Customer Success',
    status: 'draft',
    approvalMode: 'dual-review',
    sensitivity: 'restricted',
    hoursSavedPerWeek: 4,
    reliability: 82,
    linkedMetric: 'Customer risk incidents',
    fallback: 'Route directly to senior support lead',
  },
];

export default function Automations({
  automations,
  onAddAutomation,
  onUpdateAutomation,
}: AutomationsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<AutomationFormState>(emptyForm);

  const activeAutomations = automations.filter((automation) => automation.status === 'active');
  const riskyAutomations = automations.filter(
    (automation) =>
      automation.sensitivity === 'restricted' && automation.approvalMode === 'auto'
  );
  const reviewSoon = automations.filter((automation) => {
    const diff = new Date(automation.nextReview).getTime() - Date.now();
    return diff <= 1000 * 60 * 60 * 24 * 10;
  });

  const totalHours = useMemo(() => calculateAutomationHours(automations), [automations]);

  const saveTemplate = (template: Omit<Automation, 'id' | 'lastRun' | 'nextReview'>) => {
    onAddAutomation({
      ...template,
      lastRun: new Date().toISOString(),
      nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    });
  };

  const submitAutomation = () => {
    if (!formState.name.trim() || !formState.description.trim() || !formState.trigger.trim()) {
      return;
    }

    onAddAutomation({
      name: formState.name.trim(),
      description: formState.description.trim(),
      trigger: formState.trigger.trim(),
      owner: formState.owner.trim() || 'Founder',
      status: formState.status,
      approvalMode: formState.approvalMode,
      sensitivity: formState.sensitivity,
      hoursSavedPerWeek: Number(formState.hoursSavedPerWeek) || 0,
      reliability: Number(formState.reliability) || 0,
      linkedMetric: formState.linkedMetric.trim() || 'Operational efficiency',
      fallback: formState.fallback.trim() || 'Manual process fallback',
      lastRun: new Date().toISOString(),
      nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    });

    setFormState(emptyForm);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Automation lab</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Build automations that save time without losing human control</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              In the AI era, speed without guardrails becomes expensive. This workspace now treats automation as an
              operating system: every flow has an owner, fallback, review date, sensitivity label, and approval mode.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New automation
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active automations"
          value={String(activeAutomations.length)}
          subtitle="Currently running in the workspace"
          icon={<Bot className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="Hours saved/week"
          value={totalHours.toFixed(1)}
          subtitle="From active automations"
          icon={<Clock3 className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
        />
        <StatCard
          title="Review due soon"
          value={String(reviewSoon.length)}
          subtitle="Need governance refresh"
          icon={<RefreshCcw className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
        <StatCard
          title="Risky by design"
          value={String(riskyAutomations.length)}
          subtitle="Restricted data with auto-approval"
          icon={<ShieldAlert className="h-5 w-5 text-rose-300" />}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">High-value templates</h2>
              <p className="text-sm text-slate-400">Start with flows that reduce founder overhead without hiding risk.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {templates.map((template) => (
              <div key={template.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{template.name}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{template.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-white/10 px-2.5 py-1">{template.trigger}</span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1">{template.approvalMode}</span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1">{template.hoursSavedPerWeek}h/week</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveTemplate(template)}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Automation policy stack</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              'Every automation needs an owner and fallback path.',
              'Restricted or customer-facing flows should not auto-send without review.',
              'Reliability below 85% needs explicit monitoring before scale-up.',
              'Review dates prevent “set-and-forget” automations from drifting.',
            ].map((rule) => (
              <div key={rule} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {rule}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-semibold text-white">Automation registry</h2>
        <p className="mt-1 text-sm text-slate-400">This is your operating inventory for AI-enabled workflows and recurring automations.</p>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {automations.map((automation) => (
            <div key={automation.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getAutomationStatusTone(automation.status)}`}>
                      {automation.status}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getSensitivityTone(automation.sensitivity)}`}>
                      {automation.sensitivity}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{automation.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{automation.description}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/60 px-3 py-2 text-right">
                  <p className="text-xs text-slate-500">Reliability</p>
                  <p className="text-lg font-semibold text-white">{automation.reliability}%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trigger</p>
                  <p className="mt-2 text-sm text-white">{automation.trigger}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Approval</p>
                  <p className="mt-2 text-sm text-white">{automation.approvalMode}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Owner</p>
                  <p className="mt-2 text-sm text-white">{automation.owner}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hours saved</p>
                  <p className="mt-2 text-sm text-white">{automation.hoursSavedPerWeek} per week</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fallback & review</p>
                <p className="mt-2 text-sm text-slate-300">{automation.fallback}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Last run {formatShortDate(automation.lastRun)} · Review by {formatShortDate(automation.nextReview)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {automation.status !== 'active' ? (
                  <button
                    type="button"
                    onClick={() => onUpdateAutomation(automation.id, { status: 'active', lastRun: new Date().toISOString() })}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Activate
                  </button>
                ) : null}
                {automation.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => onUpdateAutomation(automation.id, { status: 'paused' })}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300 transition-colors hover:bg-amber-500/20"
                  >
                    <PauseCircle className="h-4 w-4" />
                    Pause
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onUpdateAutomation(automation.id, { nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString() })}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Activity className="h-4 w-4" />
                  Extend review
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={isModalOpen}
        title="Create an automation"
        description="Document what it does, who owns it, how risky it is, and what happens if the AI flow fails."
        onClose={() => setIsModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Name</span>
            <input
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Description</span>
            <textarea
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Trigger</span>
            <input
              value={formState.trigger}
              onChange={(event) => setFormState((current) => ({ ...current, trigger: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Owner</span>
            <input
              value={formState.owner}
              onChange={(event) => setFormState((current) => ({ ...current, owner: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Status</span>
            <select
              value={formState.status}
              onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as AutomationStatus }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Approval mode</span>
            <select
              value={formState.approvalMode}
              onChange={(event) => setFormState((current) => ({ ...current, approvalMode: event.target.value as ApprovalMode }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="auto">Auto</option>
              <option value="human-review">Human review</option>
              <option value="dual-review">Dual review</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Sensitivity</span>
            <select
              value={formState.sensitivity}
              onChange={(event) => setFormState((current) => ({ ...current, sensitivity: event.target.value as DataSensitivity }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Hours saved / week</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formState.hoursSavedPerWeek}
              onChange={(event) => setFormState((current) => ({ ...current, hoursSavedPerWeek: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Reliability %</span>
            <input
              type="number"
              min="0"
              max="100"
              value={formState.reliability}
              onChange={(event) => setFormState((current) => ({ ...current, reliability: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Linked metric</span>
            <input
              value={formState.linkedMetric}
              onChange={(event) => setFormState((current) => ({ ...current, linkedMetric: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Fallback</span>
            <textarea
              value={formState.fallback}
              onChange={(event) => setFormState((current) => ({ ...current, fallback: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={submitAutomation}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Save automation
          </button>
        </div>
      </Modal>
    </div>
  );
}
