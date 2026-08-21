import {
  AlertTriangle,
  CheckCheck,
  Download,
  FileStack,
  History,
  Shield,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { researchInsights } from '../lib/aiResearch';
import { getBackendReadiness } from '../lib/cloud';
import {
  formatShortDate,
  getRoleLabel,
  getVerificationTone,
} from '../lib/workspace';
import type {
  ApprovalRequest,
  Snapshot,
  SyncConflict,
  TeamMember,
  WorkspaceData,
  WorkspaceProfile,
} from '../types';

interface ControlRoomProps {
  workspace: WorkspaceData;
  workspaceProfiles: WorkspaceProfile[];
  activeWorkspaceProfileId: string;
  currentActorId: string;
  currentActor: TeamMember;
  cloudAvailable: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'disabled';
  lastSyncedAt: string | null;
  syncConflict: SyncConflict | null;
  onPullFromCloud: () => void;
  onPushToCloud: () => void;
  onAcceptRemoteConflict: () => void;
  onKeepLocalConflict: () => void;
  onCreateWorkspaceProfile: () => void;
  onSwitchWorkspaceProfile: (profileId: string) => void;
  onDeleteWorkspaceProfile: (profileId: string) => void;
  onSelectActor: (memberId: string) => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onExportBoardReport: () => void;
  onToggleNotificationChannel: (channelId: string) => void;
  onSendTestDelivery: () => void;
  onRunPolicyEnforcement: () => void;
  onPauseAllAutomations: () => void;
  onLockdownHighRiskAI: () => void;
  onResetAlerts: () => void;
}

function PolicyCard({
  title,
  status,
  description,
}: {
  title: string;
  status: 'passing' | 'warning' | 'failing';
  description: string;
}) {
  const tone = {
    passing: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    failing: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  }[status];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-white">{title}</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
          {status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function ApprovalCard({
  request,
  canApprove,
  onApprove,
  onReject,
}: {
  request: ApprovalRequest;
  canApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-medium text-white">{request.title}</p>
          <p className="mt-1 text-sm text-slate-400">
            Requested by {request.requestedBy} · {formatShortDate(request.createdAt)}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{request.reason}</p>
        </div>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
          {getRoleLabel(request.approverRole)} approval
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={!canApprove}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCheck className="h-4 w-4" />
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={!canApprove}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
      </div>
    </div>
  );
}

function SnapshotCard({
  snapshot,
  onRestore,
}: {
  snapshot: Snapshot;
  onRestore: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-white">{snapshot.name}</p>
          <p className="mt-1 text-sm text-slate-400">{formatShortDate(snapshot.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={onRestore}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
        >
          Restore
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{snapshot.summary}</p>
    </div>
  );
}

export default function ControlRoom({
  workspace,
  workspaceProfiles,
  activeWorkspaceProfileId,
  currentActorId,
  currentActor,
  cloudAvailable,
  syncStatus,
  lastSyncedAt,
  syncConflict,
  onPullFromCloud,
  onPushToCloud,
  onAcceptRemoteConflict,
  onKeepLocalConflict,
  onCreateWorkspaceProfile,
  onSwitchWorkspaceProfile,
  onDeleteWorkspaceProfile,
  onSelectActor,
  onApproveRequest,
  onRejectRequest,
  onCreateSnapshot,
  onRestoreSnapshot,
  onExportBoardReport,
  onToggleNotificationChannel,
  onSendTestDelivery,
  onRunPolicyEnforcement,
  onPauseAllAutomations,
  onLockdownHighRiskAI,
  onResetAlerts,
}: ControlRoomProps) {
  const pendingApprovals = workspace.approvalRequests.filter(
    (request) => request.status === 'pending'
  );
  const activeAutomations = workspace.automations.filter((automation) => automation.status === 'active');
  const dueReminders = workspace.reminders.filter((reminder) => reminder.status === 'due');
  const failingPolicies = workspace.aiSystems.filter(
    (system) => (system.riskLevel === 'high' || system.riskLevel === 'critical') && !system.humanReview
  ).length;
  const warningPolicies = workspace.decisionLogs.filter(
    (decision) => decision.verificationStatus !== 'verified'
  ).length;
  const restrictedAutomations = workspace.automations.filter(
    (automation) => automation.sensitivity === 'restricted'
  );
  const criticalAudits = workspace.auditEvents.filter(
    (event) => event.severity === 'critical'
  );
  const staleKnowledgeCount = workspace.knowledgeSources.filter((source) => source.status === 'stale').length;
  const riskyShadowCount = workspace.shadowAIEntries.filter(
    (entry) => entry.status !== 'approved' && (entry.riskLevel === 'high' || entry.riskLevel === 'critical')
  ).length;
  const warningOrCriticalTraces = workspace.aiTraces.filter(
    (trace) => trace.outcome === 'warning' || trace.outcome === 'critical'
  ).length;
  const enabledChannelCount = workspace.notificationChannels.filter((channel) => channel.enabled).length;
  const backendReadiness = getBackendReadiness();

  const policyCards: Array<{
    title: string;
    status: 'passing' | 'warning' | 'failing';
    description: string;
  }> = [
    {
      title: 'Human review on high-risk AI',
      status: failingPolicies ? 'failing' : 'passing',
      description: failingPolicies
        ? `${failingPolicies} high-risk AI system(s) still operate without a human review checkpoint.`
        : 'All currently high-risk AI systems have a visible human review checkpoint.',
    },
    {
      title: 'Decision verification hygiene',
      status: warningPolicies ? 'warning' : 'passing',
      description: warningPolicies
        ? `${warningPolicies} decision(s) still need verification or stronger evidence.`
        : 'Decision logs are fully verified right now.',
    },
    {
      title: 'Restricted automation controls',
      status: restrictedAutomations.some((automation) => automation.approvalMode === 'auto')
        ? 'failing'
        : restrictedAutomations.length
          ? 'warning'
          : 'passing',
      description: restrictedAutomations.length
        ? `${restrictedAutomations.length} automation(s) handle restricted data and should stay under explicit approval rules.`
        : 'No restricted-data automations are registered yet.',
    },
  ];

  const endpointCards = [
    {
      name: 'Workspace Sync API',
      status: cloudAvailable ? 'ready' : 'local fallback',
      description: cloudAvailable
        ? `Cloud sync is ${syncStatus}. Use pull/push controls to validate shared persistence.`
        : 'Local-first mode is active. Cloud endpoint contracts are scaffolded but not configured.',
    },
    {
      name: 'Approval Queue Endpoint',
      status: pendingApprovals.length > 4 ? 'under load' : 'healthy',
      description: `${pendingApprovals.length} request(s) are waiting in the governed approval queue.`,
    },
    {
      name: 'Trace Ingestion Endpoint',
      status: warningOrCriticalTraces ? 'attention needed' : 'healthy',
      description: `${warningOrCriticalTraces} warning/critical AI trace(s) currently need review.`,
    },
    {
      name: 'Knowledge Registry Endpoint',
      status: staleKnowledgeCount || riskyShadowCount ? 'degraded' : 'healthy',
      description: `${staleKnowledgeCount} stale source(s) and ${riskyShadowCount} risky shadow AI tool(s) are affecting trust.`,
    },
    {
      name: 'Delivery Router Endpoint',
      status: enabledChannelCount ? 'active' : 'inactive',
      description: `${enabledChannelCount} delivery channel(s) currently enabled for alerts and board updates.`,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Control room</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Run AI like an operating system, not a loose collection of tools</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              This room brings together approvals, snapshots, policy health, audit history, team roles, and a
              source-backed AI risk brief so you can scale responsibly without slowing to a crawl.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCreateSnapshot}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:text-white"
            >
              <FileStack className="h-4 w-4" />
              Create snapshot
            </button>
            <button
              type="button"
              onClick={onExportBoardReport}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Export board report
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending approvals"
          value={String(pendingApprovals.length)}
          subtitle="Requests waiting for governed action"
          icon={<Shield className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="Critical audit flags"
          value={String(criticalAudits.length)}
          subtitle="Recent high-severity events"
          icon={<AlertTriangle className="h-5 w-5 text-rose-300" />}
          tone="rose"
        />
        <StatCard
          title="Snapshots"
          value={String(workspace.snapshots.length)}
          subtitle="Restore points for safe experimentation"
          icon={<History className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
        <StatCard
          title="Team members"
          value={String(workspace.teamMembers.length)}
          subtitle={`${workspace.teamMembers.filter((member) => member.status === 'active').length} active actors`}
          icon={<Users className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Acting operator</h2>
              <p className="text-sm text-slate-400">Switch roles to test who can approve, export, or govern higher-risk changes.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {workspace.teamMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectActor(member.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  currentActorId === member.id
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{getRoleLabel(member.role)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${member.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/60 text-slate-300'}`}>
                    {member.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Current actor: {currentActor.name}</p>
            <p className="mt-1 text-slate-400">Role: {getRoleLabel(currentActor.role)}</p>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-white">Workspace profiles</p>
              <button
                type="button"
                onClick={onCreateWorkspaceProfile}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
              >
                Clone current
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {workspaceProfiles.map((profile) => (
                <div key={profile.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{profile.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{profile.description}</p>
                    <p className="mt-1 text-xs text-slate-500">Last modified {formatShortDate(profile.lastModified)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSwitchWorkspaceProfile(profile.id)}
                      className={`rounded-xl px-3 py-2 text-sm transition-colors ${activeWorkspaceProfileId === profile.id ? 'bg-emerald-500/15 text-emerald-300' : 'border border-white/10 text-slate-300 hover:border-white/20 hover:text-white'}`}
                    >
                      {activeWorkspaceProfileId === profile.id ? 'Active' : 'Switch'}
                    </button>
                    {workspaceProfiles.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => onDeleteWorkspaceProfile(profile.id)}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Source-backed AI risk brief</h2>
              <p className="text-sm text-slate-400">Research distilled into practical founder controls.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {researchInsights.map((insight) => (
              <div key={insight.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">{insight.problem}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{insight.whyItMatters}</p>
                <p className="mt-3 text-sm text-slate-200">Solution: {insight.solution}</p>
                <a
                  href={insight.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
                >
                  {insight.sourceTitle}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Cloud and delivery readiness</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${backendReadiness.supabaseConfigured ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
              {backendReadiness.mode}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400">{backendReadiness.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${cloudAvailable ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-700/60 text-slate-300'}`}>
              Cloud sync {syncStatus}
            </span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              Last sync {lastSyncedAt ? formatShortDate(lastSyncedAt) : 'never'}
            </span>
            {syncConflict ? (
              <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-300">
                Sync conflict detected
              </span>
            ) : null}
          </div>
          {syncConflict ? (
            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="font-medium text-white">Cloud conflict requires resolution</p>
              <p className="mt-2 text-sm text-slate-300">
                Remote workspace updated {syncConflict.remoteUpdatedAt ? formatShortDate(syncConflict.remoteUpdatedAt) : 'recently'} while local unsynced changes existed.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onAcceptRemoteConflict}
                  className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                >
                  Accept remote version
                </button>
                <button
                  type="button"
                  onClick={onKeepLocalConflict}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300 transition-colors hover:bg-amber-500/20"
                >
                  Keep local and re-push
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Project URL</p>
              <p className="mt-2 text-sm text-white">{backendReadiness.projectUrlPresent ? 'Configured' : 'Missing'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Anon key</p>
              <p className="mt-2 text-sm text-white">{backendReadiness.anonKeyPresent ? 'Configured' : 'Missing'}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPullFromCloud}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
            >
              Pull from cloud
            </button>
            <button
              type="button"
              onClick={onPushToCloud}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
            >
              Push to cloud
            </button>
            <button
              type="button"
              onClick={onSendTestDelivery}
              className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-300 transition-colors hover:bg-violet-500/20"
            >
              Send test delivery
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {workspace.notificationChannels.map((channel) => (
              <div key={channel.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{channel.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{channel.type} · {channel.target}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleNotificationChannel(channel.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${channel.enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/60 text-slate-300'}`}
                  >
                    {channel.enabled ? 'enabled' : 'disabled'}
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500">Last tested {formatShortDate(channel.lastTested)} · Delivery rate {channel.deliveryRate}%</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {workspace.deliveryEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">{event.title}</p>
                <p className="mt-1 text-slate-400">{event.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Policy health</h2>
          <div className="mt-5 space-y-3">
            {policyCards.map((card) => (
              <PolicyCard key={card.title} {...card} />
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {workspace.policyRules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{rule.name}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${rule.status === 'pass' ? 'bg-emerald-500/15 text-emerald-300' : rule.status === 'warn' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'}`}>
                    {rule.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{rule.description}</p>
                <p className="mt-2 text-xs text-slate-500">Target: {rule.target} · {rule.autoEnforced ? 'Auto-enforced' : 'Manual review'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Core endpoints and service contracts</h2>
          <div className="mt-5 grid gap-3">
            {endpointCards.map((endpoint) => (
              <div key={endpoint.name} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{endpoint.name}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${endpoint.status === 'healthy' || endpoint.status === 'ready' || endpoint.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : endpoint.status === 'local fallback' || endpoint.status === 'under load' || endpoint.status === 'attention needed' || endpoint.status === 'degraded' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-700/60 text-slate-300'}`}>
                    {endpoint.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Emergency controls</h2>
            <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300">
              Runtime safety
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Active automations</p>
              <p className="mt-2 text-2xl font-semibold text-white">{activeAutomations.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Due reminders</p>
              <p className="mt-2 text-2xl font-semibold text-white">{dueReminders.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Pending approvals</p>
              <p className="mt-2 text-2xl font-semibold text-white">{pendingApprovals.length}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={onPauseAllAutomations}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-left text-sm text-amber-300 transition-colors hover:bg-amber-500/20"
            >
              Pause all active automations
            </button>
            <button
              type="button"
              onClick={onLockdownHighRiskAI}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/20"
            >
              Lock down high-risk AI systems
            </button>
            <button
              type="button"
              onClick={onRunPolicyEnforcement}
              className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-4 text-left text-sm text-violet-300 transition-colors hover:bg-violet-500/20"
            >
              Run policy enforcement
            </button>
            <button
              type="button"
              onClick={onResetAlerts}
              className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-4 text-left text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
            >
              Reset dismissed alerts
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            These controls are designed for the ultimate AI-world failure mode: systems that keep acting after humans lose confidence.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-white">Pending approvals</h2>
        <div className="mt-5 space-y-3">
          {pendingApprovals.length ? (
            pendingApprovals.map((request) => (
              <ApprovalCard
                key={request.id}
                request={request}
                canApprove={currentActor.role === request.approverRole || currentActor.role === 'founder'}
                onApprove={() => onApproveRequest(request.id)}
                onReject={() => onRejectRequest(request.id)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              No approvals are pending right now.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Snapshots</h2>
          <p className="mt-1 text-sm text-slate-400">Restore points protect you from bad experiments, broken imports, or over-eager automation changes.</p>
          <div className="mt-5 space-y-3">
            {workspace.snapshots.map((snapshot) => (
              <SnapshotCard
                key={snapshot.id}
                snapshot={snapshot}
                onRestore={() => onRestoreSnapshot(snapshot.id)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Recent audit trail</h2>
          <div className="mt-5 space-y-3">
            {workspace.auditEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{event.summary}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {event.actor} · {event.action} · {formatShortDate(event.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${event.severity === 'critical' ? 'bg-rose-500/15 text-rose-300' : event.severity === 'warning' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                    {event.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-white">Open verification workload</h2>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {workspace.decisionLogs
            .filter((decision) => decision.verificationStatus !== 'verified')
            .map((decision) => (
              <div key={decision.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{decision.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{decision.recommendation}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getVerificationTone(decision.verificationStatus)}`}>
                    {decision.verificationStatus}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-400">
                  <span>{decision.owner}</span>
                  <span>Check by {formatShortDate(decision.nextCheck)}</span>
                </div>
              </div>
            ))}
          {!workspace.decisionLogs.some((decision) => decision.verificationStatus !== 'verified') ? (
            <div className="xl:col-span-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              All logged AI-influenced decisions are currently verified.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
