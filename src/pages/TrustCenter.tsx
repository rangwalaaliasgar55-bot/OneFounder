import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  CheckCheck,
  FileCheck2,
  Plus,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import {
  calculateAIReadinessScore,
  formatShortDate,
  getConfidenceTone,
  getRiskTone,
  getSensitivityTone,
  getVerificationTone,
} from '../lib/workspace';
import type {
  AISystem,
  AISystemStatus,
  DataSensitivity,
  DecisionDomain,
  DecisionLog,
  DeploymentStage,
  RiskLevel,
  VerificationStatus,
  WorkspaceData,
} from '../types';

interface TrustCenterProps {
  workspace: WorkspaceData;
  onAddAISystem: (system: Omit<AISystem, 'id'>) => void;
  onUpdateAISystem: (systemId: string, updates: Partial<AISystem>) => void;
  onAddDecisionLog: (decision: Omit<DecisionLog, 'id'>) => void;
  onUpdateDecisionLog: (decisionId: string, updates: Partial<DecisionLog>) => void;
}

interface SystemFormState {
  name: string;
  purpose: string;
  owner: string;
  modelFamily: string;
  deployment: DeploymentStage;
  riskLevel: RiskLevel;
  sensitivity: DataSensitivity;
  humanReview: boolean;
  sourceRequired: boolean;
  piiAllowed: boolean;
  status: AISystemStatus;
  controls: string;
}

interface DecisionFormState {
  title: string;
  domain: DecisionDomain;
  confidence: 'low' | 'medium' | 'high';
  verificationStatus: VerificationStatus;
  recommendation: string;
  owner: string;
  impact: string;
}

const emptySystemForm: SystemFormState = {
  name: '',
  purpose: '',
  owner: 'Founder',
  modelFamily: 'General-purpose LLM',
  deployment: 'pilot',
  riskLevel: 'medium',
  sensitivity: 'internal',
  humanReview: true,
  sourceRequired: true,
  piiAllowed: false,
  status: 'monitoring',
  controls: 'Human review, logging, fallback owner',
};

const emptyDecisionForm: DecisionFormState = {
  title: '',
  domain: 'ops',
  confidence: 'medium',
  verificationStatus: 'unverified',
  recommendation: '',
  owner: 'Founder',
  impact: '',
};

export default function TrustCenter({
  workspace,
  onAddAISystem,
  onUpdateAISystem,
  onAddDecisionLog,
  onUpdateDecisionLog,
}: TrustCenterProps) {
  const [systemModalOpen, setSystemModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [systemForm, setSystemForm] = useState<SystemFormState>(emptySystemForm);
  const [decisionForm, setDecisionForm] = useState<DecisionFormState>(emptyDecisionForm);

  const readinessScore = useMemo(
    () => calculateAIReadinessScore(workspace.aiSystems, workspace.automations),
    [workspace.aiSystems, workspace.automations]
  );

  const governedSystems = workspace.aiSystems.filter(
    (system) => system.humanReview && system.sourceRequired && system.controls.length >= 2
  );
  const highRiskSystems = workspace.aiSystems.filter(
    (system) => system.riskLevel === 'high' || system.riskLevel === 'critical'
  );
  const unresolvedDecisions = workspace.decisionLogs.filter(
    (decision) => decision.verificationStatus !== 'verified'
  );
  const totalIncidents = workspace.aiSystems.reduce((sum, system) => sum + system.incidents, 0);

  const governancePillars = [
    {
      label: 'Govern',
      score: Math.round(
        (workspace.aiSystems.filter((system) => Boolean(system.owner) && system.controls.length >= 2).length /
          Math.max(workspace.aiSystems.length, 1)) *
          100
      ),
      description: 'Ownership, controls, and accountability are documented.',
    },
    {
      label: 'Map',
      score: Math.round(
        (workspace.aiSystems.filter((system) => Boolean(system.purpose) && Boolean(system.modelFamily)).length /
          Math.max(workspace.aiSystems.length, 1)) *
          100
      ),
      description: 'System purpose, model choice, and data sensitivity are known.',
    },
    {
      label: 'Measure',
      score: Math.round(
        (workspace.aiSystems.filter((system) => system.incidents >= 0 && Boolean(system.lastAudit)).length /
          Math.max(workspace.aiSystems.length, 1)) *
          100
      ),
      description: 'Incidents, audits, and review dates are being tracked.',
    },
    {
      label: 'Manage',
      score: Math.round(
        (workspace.aiSystems.filter((system) => system.humanReview || system.status !== 'approved').length /
          Math.max(workspace.aiSystems.length, 1)) *
          100
      ),
      description: 'Mitigations and human checkpoints are in place where needed.',
    },
  ];

  const submitSystem = () => {
    if (!systemForm.name.trim() || !systemForm.purpose.trim()) {
      return;
    }

    onAddAISystem({
      name: systemForm.name.trim(),
      purpose: systemForm.purpose.trim(),
      owner: systemForm.owner.trim() || 'Founder',
      modelFamily: systemForm.modelFamily.trim() || 'General-purpose LLM',
      deployment: systemForm.deployment,
      riskLevel: systemForm.riskLevel,
      sensitivity: systemForm.sensitivity,
      humanReview: systemForm.humanReview,
      sourceRequired: systemForm.sourceRequired,
      piiAllowed: systemForm.piiAllowed,
      status: systemForm.status,
      lastAudit: new Date().toISOString(),
      incidents: 0,
      controls: systemForm.controls
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });

    setSystemForm(emptySystemForm);
    setSystemModalOpen(false);
  };

  const submitDecision = () => {
    if (!decisionForm.title.trim() || !decisionForm.recommendation.trim()) {
      return;
    }

    onAddDecisionLog({
      title: decisionForm.title.trim(),
      domain: decisionForm.domain,
      confidence: decisionForm.confidence,
      verificationStatus: decisionForm.verificationStatus,
      recommendation: decisionForm.recommendation.trim(),
      owner: decisionForm.owner.trim() || 'Founder',
      impact: decisionForm.impact.trim() || 'Operational impact not documented',
      createdAt: new Date().toISOString(),
      nextCheck: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    });

    setDecisionForm(emptyDecisionForm);
    setDecisionModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Trust center</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Control hallucination, privacy, and governance risk before AI scales</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              This section turns AI from a collection of tools into a managed system. Track where human review exists,
              which systems touch sensitive data, where verification is missing, and which decisions still need evidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDecisionModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:text-white"
            >
              <FileCheck2 className="h-4 w-4" />
              Log decision
            </button>
            <button
              type="button"
              onClick={() => setSystemModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add AI system
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="AI readiness"
          value={`${readinessScore}/100`}
          subtitle="Governance maturity across systems and automations"
          icon={<Shield className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="Governed systems"
          value={String(governedSystems.length)}
          subtitle={`${workspace.aiSystems.length} total systems inventoried`}
          icon={<BadgeCheck className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
        />
        <StatCard
          title="High-risk systems"
          value={String(highRiskSystems.length)}
          subtitle="Need the strongest controls"
          icon={<ShieldAlert className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
        <StatCard
          title="Open verification"
          value={String(unresolvedDecisions.length)}
          subtitle={`${totalIncidents} total incident(s) logged`}
          icon={<AlertTriangle className="h-5 w-5 text-rose-300" />}
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
              <h2 className="text-xl font-semibold text-white">Readiness pillars</h2>
              <p className="text-sm text-slate-400">A practical adaptation of modern AI risk management expectations.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {governancePillars.map((pillar) => (
              <div key={pillar.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{pillar.label}</p>
                  <span className="text-sm text-cyan-300">{pillar.score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${pillar.score}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-400">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Top trust gaps</h2>
              <p className="text-sm text-slate-400">High-impact fixes for the current AI stack.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            {workspace.aiSystems.some((system) => !system.humanReview) ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                At least one AI system can operate without human review. Add a human checkpoint for customer-facing or high-risk work.
              </div>
            ) : null}
            {workspace.aiSystems.some((system) => system.piiAllowed) ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Some systems allow personally identifiable information. Confirm the business need and tighten inputs where possible.
              </div>
            ) : null}
            {unresolvedDecisions.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {unresolvedDecisions.length} decision(s) still depend on partially verified or unverified AI recommendations.
              </div>
            ) : null}
            {workspace.automations.some(
              (automation) => automation.sensitivity === 'restricted' && automation.approvalMode === 'auto'
            ) ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Restricted-data automations should not run with fully automatic approval.
              </div>
            ) : null}
            {!workspace.aiSystems.some((system) => !system.humanReview) &&
            !workspace.aiSystems.some((system) => system.piiAllowed) &&
            !unresolvedDecisions.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-slate-400">
                Your current trust posture looks strong. Keep auditing and logging decisions as the system grows.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">AI system inventory</h2>
            <p className="mt-1 text-sm text-slate-400">Every AI workflow should be visible, owned, and reviewable.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {workspace.aiSystems.map((system) => (
            <div key={system.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getRiskTone(system.riskLevel)}`}>
                      {system.riskLevel} risk
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getSensitivityTone(system.sensitivity)}`}>
                      {system.sensitivity}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{system.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{system.purpose}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/60 px-3 py-2 text-right">
                  <p className="text-xs text-slate-500">Incidents</p>
                  <p className="text-lg font-semibold text-white">{system.incidents}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Owner</p>
                  <p className="mt-2 text-sm text-white">{system.owner}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Model</p>
                  <p className="mt-2 text-sm text-white">{system.modelFamily}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Deployment</p>
                  <p className="mt-2 text-sm text-white">{system.deployment}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                  <p className="mt-2 text-sm text-white">{system.status}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${system.humanReview ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                  {system.humanReview ? 'Human review enabled' : 'No human review'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${system.sourceRequired ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {system.sourceRequired ? 'Source required' : 'Source optional'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${system.piiAllowed ? 'bg-rose-500/15 text-rose-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                  {system.piiAllowed ? 'PII allowed' : 'No PII'}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Controls</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {system.controls.map((control) => (
                    <span key={control} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                      {control}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">Last audit {formatShortDate(system.lastAudit)}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {!system.humanReview ? (
                  <button
                    type="button"
                    onClick={() => onUpdateAISystem(system.id, { humanReview: true, status: 'monitoring', lastAudit: new Date().toISOString() })}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    Enable review
                  </button>
                ) : null}
                {system.status !== 'approved' ? (
                  <button
                    type="button"
                    onClick={() => onUpdateAISystem(system.id, { status: 'approved', lastAudit: new Date().toISOString() })}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  >
                    Approve
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onUpdateAISystem(system.id, { lastAudit: new Date().toISOString() })}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  Audit now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">Decision verification log</h2>
            <p className="mt-1 text-sm text-slate-400">AI suggestions are useful only when important decisions stay attributable and reviewable.</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {workspace.decisionLogs.map((decision) => (
            <div key={decision.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getVerificationTone(decision.verificationStatus)}`}>
                      {decision.verificationStatus}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getConfidenceTone(decision.confidence)}`}>
                      {decision.confidence} confidence
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{decision.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{decision.recommendation}</p>
                  <p className="mt-3 text-sm text-slate-400">Impact: {decision.impact}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                  <p>Owner: {decision.owner}</p>
                  <p className="mt-1">Domain: {decision.domain}</p>
                  <p className="mt-1">Next check: {formatShortDate(decision.nextCheck)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {decision.verificationStatus !== 'verified' ? (
                  <button
                    type="button"
                    onClick={() => onUpdateDecisionLog(decision.id, { verificationStatus: 'verified', nextCheck: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() })}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark verified
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onUpdateDecisionLog(decision.id, { verificationStatus: 'partially-verified' })}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  Needs more evidence
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={systemModalOpen}
        title="Add an AI system"
        description="Inventory the system now so trust, privacy, and accountability do not become an afterthought later."
        onClose={() => setSystemModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">System name</span>
            <input
              value={systemForm.name}
              onChange={(event) => setSystemForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Purpose</span>
            <textarea
              value={systemForm.purpose}
              onChange={(event) => setSystemForm((current) => ({ ...current, purpose: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Owner</span>
            <input
              value={systemForm.owner}
              onChange={(event) => setSystemForm((current) => ({ ...current, owner: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Model family</span>
            <input
              value={systemForm.modelFamily}
              onChange={(event) => setSystemForm((current) => ({ ...current, modelFamily: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Deployment</span>
            <select
              value={systemForm.deployment}
              onChange={(event) => setSystemForm((current) => ({ ...current, deployment: event.target.value as DeploymentStage }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="pilot">Pilot</option>
              <option value="production">Production</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Risk level</span>
            <select
              value={systemForm.riskLevel}
              onChange={(event) => setSystemForm((current) => ({ ...current, riskLevel: event.target.value as RiskLevel }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Sensitivity</span>
            <select
              value={systemForm.sensitivity}
              onChange={(event) => setSystemForm((current) => ({ ...current, sensitivity: event.target.value as DataSensitivity }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Status</span>
            <select
              value={systemForm.status}
              onChange={(event) => setSystemForm((current) => ({ ...current, status: event.target.value as AISystemStatus }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="monitoring">Monitoring</option>
              <option value="approved">Approved</option>
              <option value="needs-review">Needs review</option>
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Controls (comma separated)</span>
            <input
              value={systemForm.controls}
              onChange={(event) => setSystemForm((current) => ({ ...current, controls: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={systemForm.humanReview}
              onChange={(event) => setSystemForm((current) => ({ ...current, humanReview: event.target.checked }))}
            />
            Human review required
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={systemForm.sourceRequired}
              onChange={(event) => setSystemForm((current) => ({ ...current, sourceRequired: event.target.checked }))}
            />
            Source evidence required
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 md:col-span-2">
            <input
              type="checkbox"
              checked={systemForm.piiAllowed}
              onChange={(event) => setSystemForm((current) => ({ ...current, piiAllowed: event.target.checked }))}
            />
            This system is allowed to handle personally identifiable information
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={submitSystem}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Save AI system
          </button>
        </div>
      </Modal>

      <Modal
        open={decisionModalOpen}
        title="Log an AI-influenced decision"
        description="Capture the recommendation, expected impact, and verification state so the team can trust the process."
        onClose={() => setDecisionModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Decision title</span>
            <input
              value={decisionForm.title}
              onChange={(event) => setDecisionForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Domain</span>
            <select
              value={decisionForm.domain}
              onChange={(event) => setDecisionForm((current) => ({ ...current, domain: event.target.value as DecisionDomain }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="ops">Ops</option>
              <option value="product">Product</option>
              <option value="growth">Growth</option>
              <option value="finance">Finance</option>
              <option value="hiring">Hiring</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Confidence</span>
            <select
              value={decisionForm.confidence}
              onChange={(event) => setDecisionForm((current) => ({ ...current, confidence: event.target.value as 'low' | 'medium' | 'high' }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Recommendation</span>
            <textarea
              value={decisionForm.recommendation}
              onChange={(event) => setDecisionForm((current) => ({ ...current, recommendation: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Verification status</span>
            <select
              value={decisionForm.verificationStatus}
              onChange={(event) => setDecisionForm((current) => ({ ...current, verificationStatus: event.target.value as VerificationStatus }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="unverified">Unverified</option>
              <option value="partially-verified">Partially verified</option>
              <option value="verified">Verified</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Owner</span>
            <input
              value={decisionForm.owner}
              onChange={(event) => setDecisionForm((current) => ({ ...current, owner: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Expected impact</span>
            <textarea
              value={decisionForm.impact}
              onChange={(event) => setDecisionForm((current) => ({ ...current, impact: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={submitDecision}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Save decision log
          </button>
        </div>
      </Modal>
    </div>
  );
}
