import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  Bot,
  Download,
  FolderKanban,
  LayoutDashboard,
  LibraryBig,
  Lightbulb,
  Menu,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Users,
  Wallet,
  Workflow,
  X,
} from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import CommandPalette, { type CommandAction } from './components/CommandPalette';
import Modal from './components/Modal';
import { useWorkspaceCloudSync } from './hooks/useWorkspaceCloudSync';
import AIChat from './pages/AIChat';
import Automations from './pages/Automations';
import ControlRoom from './pages/ControlRoom';
import CRM from './pages/CRM';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import IdeaLab from './pages/IdeaLab';
import KnowledgeVault from './pages/KnowledgeVault';
import Playbooks from './pages/Playbooks';
import Projects from './pages/Projects';
import TrustCenter from './pages/TrustCenter';
import { usePersistentState } from './hooks/usePersistentState';
import {
  appendAuditEvent,
  appendDeliveryEvents,
  buildBoardReportMarkdown,
  calculateAIReadinessScore,
  calculateAutomationHours,
  calculateWorkflowScore,
  canRolePerform,
  createAuditEvent,
  createSeedWorkspace,
  createSnapshot,
  daysFromNow,
  formatCompactCurrency,
  formatCurrency,
  getDaysUntil,
  getRoleLabel,
  getVisibleWorkspaceAlerts,
  isOverdue,
  makeId,
  normalizeWorkspaceData,
} from './lib/workspace';
import type {
  AISystem,
  ApprovalRequest,
  AuditEvent,
  Automation,
  DecisionLog,
  Idea,
  KnowledgeSource,
  Lead,
  NavPage,
  ShadowAIEntry,
  Task,
  Transaction,
  WorkspaceData,
} from './types';

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
    icon: Wallet,
  },
  {
    id: 'automations',
    label: 'Automations',
    description: 'Run time-saving workflows with owners, fallbacks, and review dates.',
    icon: Bot,
  },
  {
    id: 'trust',
    label: 'Trust Center',
    description: 'Audit AI systems, verification, privacy, and human oversight.',
    icon: ShieldCheck,
  },
  {
    id: 'control',
    label: 'Control Room',
    description: 'Approve, snapshot, audit, and govern the AI operating layer.',
    icon: SlidersHorizontal,
  },
  {
    id: 'playbooks',
    label: 'Playbooks',
    description: 'Launch guided workflows, alert handling, and repeatable operating templates.',
    icon: Workflow,
  },
  {
    id: 'knowledge',
    label: 'Knowledge Vault',
    description: 'Manage canonical sources, stale knowledge, and shadow AI exposure.',
    icon: LibraryBig,
  },
];

interface ChangeMeta {
  action: string;
  target: string;
  summary: string;
  severity?: AuditEvent['severity'];
}

function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = usePersistentState('onefounder.sidebar-open', true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = usePersistentState('onefounder.authenticated', false);
  const [storedWorkspace, setStoredWorkspace] = usePersistentState<WorkspaceData>(
    'onefounder.workspace',
    createSeedWorkspace
  );
  const [currentActorId, setCurrentActorId] = usePersistentState(
    'onefounder.current-actor',
    'member-1'
  );
  const workspace = useMemo(() => normalizeWorkspaceData(storedWorkspace), [storedWorkspace]);
  const importFileRef = useRef<HTMLInputElement>(null);
  const {
    cloudAvailable,
    syncStatus,
    lastSyncedAt,
    pullFromCloud,
    pushToCloud,
  } = useWorkspaceCloudSync({
    workspace,
    setWorkspace: setStoredWorkspace,
  });

  const currentActor =
    workspace.teamMembers.find((member) => member.id === currentActorId) ?? workspace.teamMembers[0];

  const commitWorkspace = (
    updater: (current: WorkspaceData) => WorkspaceData,
    meta?: ChangeMeta
  ) => {
    setStoredWorkspace((current) => {
      const normalized = normalizeWorkspaceData(current);
      let next = normalizeWorkspaceData(updater(normalized));

      if (meta) {
        next = appendAuditEvent(
          next,
          createAuditEvent(
            currentActor.name,
            meta.action,
            meta.target,
            meta.summary,
            meta.severity ?? 'info'
          )
        );

        if (
          meta.severity === 'critical' ||
          meta.severity === 'warning' ||
          meta.action === 'workflow-launch' ||
          meta.action === 'export-board-report' ||
          meta.action === 'approval-approved'
        ) {
          next = appendDeliveryEvents(next, meta.target, meta.summary);
        }
      }

      return next;
    });
  };

  const queueApprovalRequest = (
    current: WorkspaceData,
    request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status' | 'requestedBy'>
  ) => {
    const approval: ApprovalRequest = {
      ...request,
      id: makeId('approval'),
      requestedBy: currentActor.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return appendAuditEvent(
      {
        ...current,
        approvalRequests: [approval, ...current.approvalRequests],
      },
      createAuditEvent(
        currentActor.name,
        'approval-request',
        request.title,
        `Approval request created: ${request.reason}`,
        'warning'
      )
    );
  };

  const activeNavItem = navItems.find((item) => item.id === activePage) ?? navItems[0];

  const monthlyIncome = workspace.transactions
    .filter((transaction) => transaction.type === 'income' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpenses = workspace.transactions
    .filter((transaction) => transaction.type === 'expense' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const visibleAlerts = useMemo(() => getVisibleWorkspaceAlerts(workspace), [workspace]);

  const workspaceHealth = useMemo(() => {
    const overdueTasks = workspace.tasks.filter(
      (task) => task.status !== 'done' && isOverdue(task.dueDate)
    ).length;
    const followUps = workspace.leads.filter(
      (lead) => lead.stage !== 'won' && getDaysUntil(lead.lastContacted) <= -7
    ).length;
    const net = monthlyIncome - monthlyExpenses;
    const automationHours = calculateAutomationHours(workspace.automations);
    const trustScore = calculateAIReadinessScore(workspace.aiSystems, workspace.automations);
    const riskySystems = workspace.aiSystems.filter(
      (system) => (system.riskLevel === 'high' || system.riskLevel === 'critical') && !system.humanReview
    ).length;
    const workflowScore = calculateWorkflowScore(workspace);

    return {
      overdueTasks,
      followUps,
      net,
      automationHours,
      trustScore,
      riskySystems,
      workflowScore,
      alertCount: visibleAlerts.length,
    };
  }, [monthlyExpenses, monthlyIncome, visibleAlerts.length, workspace]);

  const addIdea = (idea: Omit<Idea, 'id' | 'createdAt' | 'score'> & { score: number }) => {
    commitWorkspace(
      (current) => ({
        ...current,
        ideas: [
          {
            ...idea,
            id: makeId('idea'),
            createdAt: new Date().toISOString(),
          },
          ...current.ideas,
        ],
      }),
      {
        action: 'idea-create',
        target: idea.title,
        summary: `Added new idea: ${idea.title}`,
      }
    );
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        tasks: [{ ...task, id: makeId('task') }, ...current.tasks],
      }),
      {
        action: 'task-create',
        target: task.title,
        summary: `Created task: ${task.title}`,
      }
    );
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
      }),
      {
        action: 'task-update',
        target: taskId,
        summary: 'Updated task status or metadata.',
      }
    );
  };

  const addLead = (lead: Omit<Lead, 'id' | 'lastContacted'>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        leads: [
          {
            ...lead,
            id: makeId('lead'),
            lastContacted: new Date().toISOString(),
          },
          ...current.leads,
        ],
      }),
      {
        action: 'lead-create',
        target: lead.name,
        summary: `Added new lead: ${lead.name}`,
      }
    );
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        leads: current.leads.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead)),
      }),
      {
        action: 'lead-update',
        target: leadId,
        summary: 'Updated lead stage or follow-up metadata.',
      }
    );
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        transactions: [{ ...transaction, id: makeId('txn') }, ...current.transactions],
      }),
      {
        action: 'transaction-create',
        target: transaction.description,
        summary: `Added transaction: ${transaction.description}`,
      }
    );
  };

  const addAutomation = (automation: Omit<Automation, 'id'>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        automations: [{ ...automation, id: makeId('auto') }, ...current.automations],
      }),
      {
        action: 'automation-create',
        target: automation.name,
        summary: `Added automation: ${automation.name}`,
      }
    );
  };

  const updateAutomation = (automationId: string, updates: Partial<Automation>) => {
    commitWorkspace(
      (current) => {
        const target = current.automations.find((automation) => automation.id === automationId);
        if (!target) {
          return current;
        }

        const wantsActivation = updates.status === 'active';
        const needsApproval =
          wantsActivation &&
          (target.sensitivity === 'restricted' || target.approvalMode === 'dual-review');

        if (needsApproval && !canRolePerform(currentActor.role, 'activate-restricted-automation')) {
          return queueApprovalRequest(current, {
            title: `Activate automation: ${target.name}`,
            type: 'automation',
            targetId: target.id,
            approverRole: 'security',
            reason: `${getRoleLabel(currentActor.role)} cannot activate restricted or dual-review automations directly.`,
            requestedAction: 'activate-automation',
            payload: JSON.stringify({ updates }),
          });
        }

        return {
          ...current,
          automations: current.automations.map((automation) =>
            automation.id === automationId ? { ...automation, ...updates } : automation
          ),
        };
      },
      {
        action: 'automation-update',
        target: automationId,
        summary: 'Updated automation state or review data.',
        severity: updates.status === 'active' ? 'warning' : 'info',
      }
    );
  };

  const addAISystem = (system: Omit<AISystem, 'id'>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        aiSystems: [{ ...system, id: makeId('ai') }, ...current.aiSystems],
      }),
      {
        action: 'ai-system-create',
        target: system.name,
        summary: `Added AI system inventory entry: ${system.name}`,
      }
    );
  };

  const updateAISystem = (systemId: string, updates: Partial<AISystem>) => {
    commitWorkspace(
      (current) => {
        const target = current.aiSystems.find((system) => system.id === systemId);
        if (!target) {
          return current;
        }

        const effectiveHumanReview = updates.humanReview ?? target.humanReview;
        const effectiveSourceRequired = updates.sourceRequired ?? target.sourceRequired;
        const wantsApproval = updates.status === 'approved';
        const isHighRisk = target.riskLevel === 'high' || target.riskLevel === 'critical';

        if (wantsApproval && isHighRisk && !canRolePerform(currentActor.role, 'approve-high-risk-ai')) {
          return queueApprovalRequest(current, {
            title: `Approve AI system: ${target.name}`,
            type: 'ai-system',
            targetId: target.id,
            approverRole: 'security',
            reason: `${getRoleLabel(currentActor.role)} cannot approve high-risk AI systems directly.`,
            requestedAction: 'approve-ai-system',
            payload: JSON.stringify({ updates }),
          });
        }

        if (wantsApproval && isHighRisk && (!effectiveHumanReview || !effectiveSourceRequired)) {
          return appendAuditEvent(
            current,
            createAuditEvent(
              currentActor.name,
              'ai-system-blocked',
              target.name,
              'Approval was blocked because a high-risk system is missing human review or source requirements.',
              'critical'
            )
          );
        }

        return {
          ...current,
          aiSystems: current.aiSystems.map((system) =>
            system.id === systemId ? { ...system, ...updates } : system
          ),
        };
      },
      {
        action: 'ai-system-update',
        target: systemId,
        summary: 'Updated AI system governance or risk data.',
        severity: updates.status === 'approved' ? 'warning' : 'info',
      }
    );
  };

  const addDecisionLog = (decision: Omit<DecisionLog, 'id'>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        decisionLogs: [{ ...decision, id: makeId('decision') }, ...current.decisionLogs],
      }),
      {
        action: 'decision-log-create',
        target: decision.title,
        summary: `Logged AI-influenced decision: ${decision.title}`,
      }
    );
  };

  const updateDecisionLog = (decisionId: string, updates: Partial<DecisionLog>) => {
    commitWorkspace(
      (current) => {
        const target = current.decisionLogs.find((decision) => decision.id === decisionId);
        if (!target) {
          return current;
        }

        if (
          updates.verificationStatus === 'verified' &&
          !canRolePerform(currentActor.role, 'verify-decision')
        ) {
          return queueApprovalRequest(current, {
            title: `Verify decision: ${target.title}`,
            type: 'decision',
            targetId: target.id,
            approverRole: 'security',
            reason: `${getRoleLabel(currentActor.role)} cannot mark AI-influenced decisions as verified directly.`,
            requestedAction: 'verify-decision',
            payload: JSON.stringify({ updates }),
          });
        }

        return {
          ...current,
          decisionLogs: current.decisionLogs.map((decision) =>
            decision.id === decisionId ? { ...decision, ...updates } : decision
          ),
        };
      },
      {
        action: 'decision-log-update',
        target: decisionId,
        summary: 'Updated decision verification or follow-up state.',
        severity: updates.verificationStatus === 'verified' ? 'warning' : 'info',
      }
    );
  };

  const addKnowledgeSource = (source: Omit<KnowledgeSource, 'id'>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        knowledgeSources: [{ ...source, id: makeId('knowledge') }, ...current.knowledgeSources],
      }),
      {
        action: 'knowledge-add',
        target: source.title,
        summary: `Added knowledge source: ${source.title}`,
      }
    );
  };

  const updateKnowledgeSource = (sourceId: string, updates: Partial<KnowledgeSource>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        knowledgeSources: current.knowledgeSources.map((source) =>
          source.id === sourceId ? { ...source, ...updates } : source
        ),
      }),
      {
        action: 'knowledge-update',
        target: sourceId,
        summary: 'Updated source-of-truth metadata or freshness state.',
      }
    );
  };

  const addShadowAIEntry = (entry: Omit<ShadowAIEntry, 'id'>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        shadowAIEntries: [{ ...entry, id: makeId('shadow') }, ...current.shadowAIEntries],
      }),
      {
        action: 'shadow-ai-add',
        target: entry.toolName,
        summary: `Tracked AI tool usage: ${entry.toolName}`,
        severity: entry.status === 'approved' ? 'info' : 'warning',
      }
    );
  };

  const updateShadowAIEntry = (entryId: string, updates: Partial<ShadowAIEntry>) => {
    commitWorkspace(
      (current) => ({
        ...current,
        shadowAIEntries: current.shadowAIEntries.map((entry) =>
          entry.id === entryId ? { ...entry, ...updates } : entry
        ),
      }),
      {
        action: 'shadow-ai-update',
        target: entryId,
        summary: 'Updated shadow AI tool approval or risk state.',
        severity: updates.status === 'restricted' ? 'critical' : 'warning',
      }
    );
  };

  const dismissAlert = (alertId: string) => {
    commitWorkspace(
      (current) => ({
        ...current,
        dismissedAlertIds: current.dismissedAlertIds.includes(alertId)
          ? current.dismissedAlertIds
          : [...current.dismissedAlertIds, alertId],
      }),
      {
        action: 'alert-dismiss',
        target: alertId,
        summary: `Dismissed workspace alert: ${alertId}`,
      }
    );
  };

  const selectActor = (memberId: string) => {
    setCurrentActorId(memberId);
  };

  const signInAs = (memberId: string) => {
    setCurrentActorId(memberId);
    setIsAuthenticated(true);
    const member = workspace.teamMembers.find((item) => item.id === memberId);
    if (member) {
      setStoredWorkspace((current) =>
        appendAuditEvent(
          normalizeWorkspaceData(current),
          createAuditEvent(member.name, 'sign-in', 'Workspace session', `${member.name} signed into the workspace.`, 'info')
        )
      );
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setNotificationsOpen(false);
    setCommandPaletteOpen(false);
    commitWorkspace(
      (current) => current,
      {
        action: 'sign-out',
        target: 'Workspace session',
        summary: `${currentActor.name} signed out of the workspace.`,
      }
    );
  };

  const createWorkspaceSnapshot = () => {
    if (!canRolePerform(currentActor.role, 'create-snapshot')) {
      window.alert(`${getRoleLabel(currentActor.role)} cannot create snapshots directly.`);
      commitWorkspace(
        (current) => current,
        {
          action: 'snapshot-denied',
          target: 'Workspace snapshot',
          summary: 'Snapshot creation was denied due to role restrictions.',
          severity: 'warning',
        }
      );
      return;
    }

    commitWorkspace(
      (current) => ({
        ...current,
        snapshots: [
          createSnapshot(
            current,
            `Snapshot ${new Date().toLocaleString()}`,
            'Manual restore point captured from the control room.'
          ),
          ...current.snapshots,
        ].slice(0, 20),
      }),
      {
        action: 'snapshot-create',
        target: 'Workspace snapshot',
        summary: 'Created a new workspace restore point.',
      }
    );
  };

  const restoreWorkspaceSnapshot = (snapshotId: string) => {
    if (!canRolePerform(currentActor.role, 'create-snapshot')) {
      commitWorkspace((current) => {
        const snapshot = current.snapshots.find((item) => item.id === snapshotId);
        if (!snapshot) {
          return current;
        }

        return queueApprovalRequest(current, {
          title: `Restore snapshot: ${snapshot.name}`,
          type: 'workspace',
          targetId: snapshot.id,
          approverRole: 'founder',
          reason: `${getRoleLabel(currentActor.role)} cannot restore snapshots directly.`,
          requestedAction: 'restore-snapshot',
          payload: JSON.stringify({ snapshotId }),
        });
      });
      return;
    }

    commitWorkspace(
      (current) => {
        const snapshot = current.snapshots.find((item) => item.id === snapshotId);
        if (!snapshot) {
          return current;
        }

        try {
          const restored = normalizeWorkspaceData(JSON.parse(snapshot.data));
          return {
            ...restored,
            snapshots: current.snapshots,
          };
        } catch {
          return appendAuditEvent(
            current,
            createAuditEvent(
              currentActor.name,
              'snapshot-restore-failed',
              snapshot.name,
              'Snapshot restore failed because the snapshot data was invalid.',
              'critical'
            )
          );
        }
      },
      {
        action: 'snapshot-restore',
        target: snapshotId,
        summary: 'Restored workspace state from a saved snapshot.',
        severity: 'warning',
      }
    );
  };

  const launchWorkflowTemplate = (templateId: string) => {
    commitWorkspace(
      (current) => {
        const workflowRunBase = {
          id: makeId('workflow'),
          templateId,
          owner: currentActor.name,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
        };

        switch (templateId) {
          case 'weekly-review':
            return {
              ...current,
              workflowRuns: [
                {
                  ...workflowRunBase,
                  name: 'Weekly founder review',
                  summary: 'Weekly operating cadence across CRM, finance, trust, and execution.',
                  steps: ['Review stale leads', 'Clear approvals', 'Audit trust posture', 'Export board report'],
                  completedSteps: 0,
                  nextAction: 'Review stale leads',
                  relatedPages: ['crm', 'control', 'trust', 'playbooks'],
                },
                ...current.workflowRuns,
              ],
              tasks: [
                {
                  id: makeId('task'),
                  title: 'Review stale leads and assign next contact owner',
                  assignee: currentActor.name,
                  dueDate: daysFromNow(1),
                  priority: 'high',
                  status: 'todo',
                },
                {
                  id: makeId('task'),
                  title: 'Check pending approvals and clear blockers',
                  assignee: currentActor.name,
                  dueDate: daysFromNow(1),
                  priority: 'medium',
                  status: 'todo',
                },
                {
                  id: makeId('task'),
                  title: 'Export board report and finance summary',
                  assignee: currentActor.name,
                  dueDate: daysFromNow(2),
                  priority: 'medium',
                  status: 'todo',
                },
                ...current.tasks,
              ],
              reminders: [
                {
                  id: makeId('reminder'),
                  title: 'Finish weekly founder review',
                  description: 'Complete the weekly cadence and export the board report.',
                  owner: currentActor.name,
                  dueAt: daysFromNow(2),
                  status: 'upcoming',
                  linkedPage: 'playbooks',
                },
                ...current.reminders,
              ],
            };
          case 'revenue-recovery':
            return {
              ...current,
              workflowRuns: [
                {
                  ...workflowRunBase,
                  name: 'Revenue recovery sprint',
                  summary: 'Focus the week on stale opportunities and cash-moving actions.',
                  steps: ['Re-open warm deals', 'Review objections', 'Update pricing path'],
                  completedSteps: 0,
                  nextAction: 'Re-open warm deals',
                  relatedPages: ['crm', 'finance', 'playbooks'],
                },
                ...current.workflowRuns,
              ],
              tasks: [
                {
                  id: makeId('task'),
                  title: 'Contact all stale proposal and negotiation leads',
                  assignee: 'Revenue Ops',
                  dueDate: daysFromNow(1),
                  priority: 'high',
                  status: 'todo',
                },
                {
                  id: makeId('task'),
                  title: 'Review pricing objections and prepare counter-offers',
                  assignee: currentActor.name,
                  dueDate: daysFromNow(2),
                  priority: 'high',
                  status: 'todo',
                },
                ...current.tasks,
              ],
              decisionLogs: [
                {
                  id: makeId('decision'),
                  title: 'Revenue recovery sprint launched',
                  domain: 'growth',
                  confidence: 'medium',
                  verificationStatus: 'partially-verified',
                  recommendation:
                    'Prioritize warm pipeline before spending on new acquisition this week.',
                  owner: currentActor.name,
                  impact: 'Shortens time-to-cash and prevents near-term pipeline decay.',
                  createdAt: new Date().toISOString(),
                  nextCheck: daysFromNow(5),
                },
                ...current.decisionLogs,
              ],
              reminders: [
                {
                  id: makeId('reminder'),
                  title: 'Revenue sprint follow-up',
                  description: 'Check recovery impact and confirm warm pipeline movement.',
                  owner: currentActor.name,
                  dueAt: daysFromNow(3),
                  status: 'upcoming',
                  linkedPage: 'crm',
                },
                ...current.reminders,
              ],
            };
          case 'ai-incident':
            return {
              ...current,
              workflowRuns: [
                {
                  ...workflowRunBase,
                  name: 'AI incident response',
                  summary: 'Runbook for trust, safety, or automation incidents involving AI systems.',
                  steps: ['Freeze risky scope', 'Collect evidence', 'Review trust controls', 'Approve remediation'],
                  completedSteps: 0,
                  nextAction: 'Freeze risky scope',
                  relatedPages: ['trust', 'control', 'automations'],
                },
                ...current.workflowRuns,
              ],
              tasks: [
                {
                  id: makeId('task'),
                  title: 'Freeze the affected automation or AI system scope',
                  assignee: 'Security Lead',
                  dueDate: daysFromNow(0),
                  priority: 'high',
                  status: 'todo',
                },
                {
                  id: makeId('task'),
                  title: 'Collect incident evidence and user-visible impact notes',
                  assignee: currentActor.name,
                  dueDate: daysFromNow(1),
                  priority: 'high',
                  status: 'todo',
                },
                ...current.tasks,
              ],
              reminders: [
                {
                  id: makeId('reminder'),
                  title: 'AI incident follow-up review',
                  description: 'Confirm remediation and close the incident with a decision log update.',
                  owner: 'Security Lead',
                  dueAt: daysFromNow(1),
                  status: 'due',
                  linkedPage: 'trust',
                },
                ...current.reminders,
              ],
            };
          case 'launch-readiness':
            return {
              ...current,
              workflowRuns: [
                {
                  ...workflowRunBase,
                  name: 'Launch readiness check',
                  summary: 'Pre-launch checklist spanning telemetry, support, trust, and execution.',
                  steps: ['Verify telemetry', 'Review support path', 'Check trust controls'],
                  completedSteps: 0,
                  nextAction: 'Verify telemetry',
                  relatedPages: ['projects', 'trust', 'playbooks'],
                },
                ...current.workflowRuns,
              ],
              tasks: [
                {
                  id: makeId('task'),
                  title: 'Verify launch metrics and alerts are live',
                  assignee: 'Ops Lead',
                  dueDate: daysFromNow(1),
                  priority: 'high',
                  status: 'todo',
                },
                {
                  id: makeId('task'),
                  title: 'Review customer-facing AI and support escalation path',
                  assignee: 'Security Lead',
                  dueDate: daysFromNow(1),
                  priority: 'high',
                  status: 'todo',
                },
                ...current.tasks,
              ],
              reminders: [
                {
                  id: makeId('reminder'),
                  title: 'Launch readiness sign-off',
                  description: 'Confirm launch is ready across monitoring, support, and AI trust controls.',
                  owner: 'Ops Lead',
                  dueAt: daysFromNow(1),
                  status: 'due',
                  linkedPage: 'projects',
                },
                ...current.reminders,
              ],
            };
          case 'shadow-ai-cleanup':
            return {
              ...current,
              workflowRuns: [
                {
                  ...workflowRunBase,
                  name: 'Shadow AI cleanup sprint',
                  summary: 'Find risky usage, inventory workflows, and migrate work into approved channels.',
                  steps: ['Inventory tools', 'Map risky flows', 'Publish approved alternatives'],
                  completedSteps: 0,
                  nextAction: 'Inventory tools',
                  relatedPages: ['trust', 'control', 'playbooks'],
                },
                ...current.workflowRuns,
              ],
              tasks: [
                {
                  id: makeId('task'),
                  title: 'Inventory unofficial AI tools and undocumented workflows',
                  assignee: 'Security Lead',
                  dueDate: daysFromNow(2),
                  priority: 'high',
                  status: 'todo',
                },
                {
                  id: makeId('task'),
                  title: 'Document approved alternatives and role-based review rules',
                  assignee: currentActor.name,
                  dueDate: daysFromNow(3),
                  priority: 'medium',
                  status: 'todo',
                },
                ...current.tasks,
              ],
              decisionLogs: [
                {
                  id: makeId('decision'),
                  title: 'Shadow AI cleanup initiated',
                  domain: 'ops',
                  confidence: 'medium',
                  verificationStatus: 'unverified',
                  recommendation:
                    'Map risky usage first, then provide governed alternatives instead of trying to ban behavior blindly.',
                  owner: currentActor.name,
                  impact: 'Reduces data leakage, trust fragmentation, and invisible operational risk.',
                  createdAt: new Date().toISOString(),
                  nextCheck: daysFromNow(7),
                },
                ...current.decisionLogs,
              ],
              reminders: [
                {
                  id: makeId('reminder'),
                  title: 'Shadow AI cleanup checkpoint',
                  description: 'Review inventory and agree on approved tools and workflows.',
                  owner: 'Security Lead',
                  dueAt: daysFromNow(4),
                  status: 'upcoming',
                  linkedPage: 'control',
                },
                ...current.reminders,
              ],
            };
          default:
            return current;
        }
      },
      {
        action: 'workflow-launch',
        target: templateId,
        summary: `Launched workflow template: ${templateId}`,
        severity: 'warning',
      }
    );
  };

  const advanceWorkflowRun = (runId: string) => {
    commitWorkspace(
      (current) => ({
        ...current,
        workflowRuns: current.workflowRuns.map((run) => {
          if (run.id !== runId) {
            return run;
          }

          const nextCompleted = Math.min(run.completedSteps + 1, run.steps.length);
          return {
            ...run,
            completedSteps: nextCompleted,
            status: nextCompleted >= run.steps.length ? 'completed' : run.status,
            nextAction: run.steps[nextCompleted] ?? 'Run complete',
          };
        }),
      }),
      {
        action: 'workflow-advance',
        target: runId,
        summary: 'Advanced workflow run progress.',
        severity: 'info',
      }
    );
  };

  const completeReminder = (reminderId: string) => {
    commitWorkspace(
      (current) => ({
        ...current,
        reminders: current.reminders.map((reminder) =>
          reminder.id === reminderId ? { ...reminder, status: 'done' } : reminder
        ),
      }),
      {
        action: 'reminder-complete',
        target: reminderId,
        summary: 'Marked reminder as done.',
      }
    );
  };

  const toggleNotificationChannel = (channelId: string) => {
    commitWorkspace(
      (current) => ({
        ...current,
        notificationChannels: current.notificationChannels.map((channel) =>
          channel.id === channelId
            ? {
                ...channel,
                enabled: !channel.enabled,
                lastTested: new Date().toISOString(),
              }
            : channel
        ),
      }),
      {
        action: 'notification-channel-toggle',
        target: channelId,
        summary: 'Updated notification channel delivery state.',
      }
    );
  };

  const pauseAllAutomations = () => {
    commitWorkspace(
      (current) => ({
        ...current,
        automations: current.automations.map((automation) =>
          automation.status === 'active' ? { ...automation, status: 'paused' } : automation
        ),
      }),
      {
        action: 'automation-emergency-pause',
        target: 'All automations',
        summary: 'Paused all active automations using the emergency control.',
        severity: 'critical',
      }
    );
  };

  const lockdownHighRiskAI = () => {
    commitWorkspace(
      (current) => ({
        ...current,
        aiSystems: current.aiSystems.map((system) =>
          system.riskLevel === 'high' || system.riskLevel === 'critical'
            ? {
                ...system,
                humanReview: true,
                sourceRequired: true,
                status: 'needs-review',
                lastAudit: new Date().toISOString(),
              }
            : system
        ),
      }),
      {
        action: 'ai-lockdown',
        target: 'High-risk AI systems',
        summary: 'Applied emergency lockdown controls to all high-risk AI systems.',
        severity: 'critical',
      }
    );
  };

  const resetAlerts = () => {
    commitWorkspace(
      (current) => ({
        ...current,
        dismissedAlertIds: [],
      }),
      {
        action: 'alerts-reset',
        target: 'Workspace alerts',
        summary: 'Reset all dismissed workspace alerts.',
      }
    );
  };

  const approveRequest = (requestId: string) => {
    commitWorkspace((current) => {
      const request = current.approvalRequests.find((item) => item.id === requestId);
      if (!request) {
        return current;
      }

      if (!(currentActor.role === request.approverRole || currentActor.role === 'founder')) {
        return appendAuditEvent(
          current,
          createAuditEvent(
            currentActor.name,
            'approval-denied',
            request.title,
            'Approval was denied because the actor does not have the required role.',
            'warning'
          )
        );
      }

      let next: WorkspaceData = {
        ...current,
        approvalRequests: current.approvalRequests.map((item) =>
          item.id === requestId ? { ...item, status: 'approved' } : item
        ),
      };

      const payload = JSON.parse(request.payload || '{}') as {
        updates?: Partial<Automation & AISystem & DecisionLog>;
        snapshotId?: string;
      };

      if (request.requestedAction === 'activate-automation') {
        next = {
          ...next,
          automations: next.automations.map((automation) =>
            automation.id === request.targetId ? { ...automation, ...(payload.updates ?? {}) } : automation
          ),
        };
      }

      if (request.requestedAction === 'approve-ai-system') {
        next = {
          ...next,
          aiSystems: next.aiSystems.map((system) =>
            system.id === request.targetId
              ? { ...system, ...(payload.updates ?? {}), lastAudit: new Date().toISOString() }
              : system
          ),
        };
      }

      if (request.requestedAction === 'verify-decision') {
        next = {
          ...next,
          decisionLogs: next.decisionLogs.map((decision) =>
            decision.id === request.targetId ? { ...decision, ...(payload.updates ?? {}) } : decision
          ),
        };
      }

      if (request.requestedAction === 'restore-snapshot' && payload.snapshotId) {
        const snapshot = next.snapshots.find((item) => item.id === payload.snapshotId);
        if (snapshot) {
          try {
            const restored = normalizeWorkspaceData(JSON.parse(snapshot.data));
            next = {
              ...restored,
              approvalRequests: next.approvalRequests,
              auditEvents: next.auditEvents,
              snapshots: next.snapshots,
            };
          } catch {
            return appendAuditEvent(
              current,
              createAuditEvent(
                currentActor.name,
                'snapshot-restore-failed',
                request.title,
                'Approved snapshot restore failed because the snapshot data was invalid.',
                'critical'
              )
            );
          }
        }
      }

      return appendAuditEvent(
        next,
        createAuditEvent(
          currentActor.name,
          'approval-approved',
          request.title,
          `Approved request: ${request.title}`,
          'warning'
        )
      );
    });
  };

  const rejectRequest = (requestId: string) => {
    commitWorkspace((current) => {
      const request = current.approvalRequests.find((item) => item.id === requestId);
      if (!request) {
        return current;
      }

      if (!(currentActor.role === request.approverRole || currentActor.role === 'founder')) {
        return current;
      }

      return appendAuditEvent(
        {
          ...current,
          approvalRequests: current.approvalRequests.map((item) =>
            item.id === requestId ? { ...item, status: 'rejected' } : item
          ),
        },
        createAuditEvent(
          currentActor.name,
          'approval-rejected',
          request.title,
          `Rejected request: ${request.title}`,
          'warning'
        )
      );
    });
  };

  const navigateTo = (page: NavPage) => {
    setActivePage(page);
    setMobileSidebarOpen(false);
    setNotificationsOpen(false);
  };

  const exportWorkspace = () => {
    if (!canRolePerform(currentActor.role, 'export-workspace')) {
      window.alert(`${getRoleLabel(currentActor.role)} cannot export workspace data directly.`);
      commitWorkspace(
        (current) => current,
        {
          action: 'export-denied',
          target: 'Workspace export',
          summary: 'Workspace export was denied due to role restrictions.',
          severity: 'warning',
        }
      );
      return;
    }

    const blob = new Blob([JSON.stringify(workspace, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onefounder-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    commitWorkspace(
      (current) => current,
      {
        action: 'export-workspace',
        target: 'Workspace export',
        summary: 'Exported workspace JSON.',
      }
    );
  };

  const exportBoardReport = () => {
    if (!canRolePerform(currentActor.role, 'export-workspace')) {
      window.alert(`${getRoleLabel(currentActor.role)} cannot export board reports directly.`);
      return;
    }

    const markdown = buildBoardReportMarkdown(workspace);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onefounder-board-report-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);

    commitWorkspace(
      (current) => current,
      {
        action: 'export-board-report',
        target: 'Board report',
        summary: 'Exported board-ready markdown report.',
      }
    );
  };

  const importWorkspace = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const imported = normalizeWorkspaceData(parsed);
      const next = appendAuditEvent(
        imported,
        createAuditEvent(
          currentActor.name,
          'workspace-import',
          file.name,
          `Imported workspace data from ${file.name}.`,
          'warning'
        )
      );
      setStoredWorkspace(next);
      setActivePage('dashboard');
    } catch {
      window.alert('Could not import workspace JSON. Please check the file format.');
    } finally {
      event.target.value = '';
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commandActions: CommandAction[] = [
    ...navItems.map((item) => ({
      id: `page-${item.id}`,
      title: item.label,
      description: item.description,
      group: 'Pages',
      onSelect: () => navigateTo(item.id),
    })),
    {
      id: 'action-snapshot',
      title: 'Create snapshot',
      description: 'Save a restore point before a big change.',
      group: 'Actions',
      onSelect: createWorkspaceSnapshot,
    },
    {
      id: 'action-board-report',
      title: 'Export board report',
      description: 'Download a markdown summary for leadership or investors.',
      group: 'Actions',
      onSelect: exportBoardReport,
    },
    {
      id: 'action-weekly-review',
      title: 'Launch weekly founder review',
      description: 'Create a guided weekly operating cadence.',
      group: 'Playbooks',
      onSelect: () => launchWorkflowTemplate('weekly-review'),
    },
    {
      id: 'action-ai-incident',
      title: 'Launch AI incident response',
      description: 'Start a guided AI trust and incident workflow.',
      group: 'Playbooks',
      onSelect: () => launchWorkflowTemplate('ai-incident'),
    },
    {
      id: 'action-revenue-recovery',
      title: 'Launch revenue recovery sprint',
      description: 'Focus the team on stale deals and short-term cash movement.',
      group: 'Playbooks',
      onSelect: () => launchWorkflowTemplate('revenue-recovery'),
    },
    {
      id: 'action-pause-automations',
      title: 'Pause all automations',
      description: 'Emergency stop for all active automation flows.',
      group: 'Safety',
      onSelect: pauseAllAutomations,
    },
    {
      id: 'action-lockdown-ai',
      title: 'Lock down high-risk AI',
      description: 'Force human review and needs-review state on high-risk AI systems.',
      group: 'Safety',
      onSelect: lockdownHighRiskAI,
    },
    {
      id: 'action-reset-alerts',
      title: 'Reset dismissed alerts',
      description: 'Bring all workspace alerts back into view.',
      group: 'Safety',
      onSelect: resetAlerts,
    },
    ...visibleAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      description: alert.description,
      group: 'Alerts',
      onSelect: () => navigateTo(alert.page),
    })),
  ];

  if (!isAuthenticated) {
    return <AuthScreen members={workspace.teamMembers} onSignIn={signInAs} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard data={workspace} onNavigate={navigateTo} />;
      case 'chat':
        return <AIChat workspace={workspace} />;
      case 'ideas':
        return <IdeaLab ideas={workspace.ideas} onAddIdea={addIdea} />;
      case 'projects':
        return (
          <Projects tasks={workspace.tasks} onAddTask={addTask} onUpdateTask={updateTask} />
        );
      case 'crm':
        return <CRM leads={workspace.leads} onAddLead={addLead} onUpdateLead={updateLead} />;
      case 'finance':
        return (
          <Finance transactions={workspace.transactions} onAddTransaction={addTransaction} />
        );
      case 'automations':
        return (
          <Automations
            automations={workspace.automations}
            onAddAutomation={addAutomation}
            onUpdateAutomation={updateAutomation}
          />
        );
      case 'trust':
        return (
          <TrustCenter
            workspace={workspace}
            onAddAISystem={addAISystem}
            onUpdateAISystem={updateAISystem}
            onAddDecisionLog={addDecisionLog}
            onUpdateDecisionLog={updateDecisionLog}
          />
        );
      case 'control':
        return (
          <ControlRoom
            workspace={workspace}
            currentActorId={currentActor.id}
            currentActor={currentActor}
            cloudAvailable={cloudAvailable}
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
            onPullFromCloud={() => {
              void pullFromCloud();
            }}
            onPushToCloud={() => {
              void pushToCloud();
            }}
            onSelectActor={selectActor}
            onApproveRequest={approveRequest}
            onRejectRequest={rejectRequest}
            onCreateSnapshot={createWorkspaceSnapshot}
            onRestoreSnapshot={restoreWorkspaceSnapshot}
            onExportBoardReport={exportBoardReport}
            onToggleNotificationChannel={toggleNotificationChannel}
            onPauseAllAutomations={pauseAllAutomations}
            onLockdownHighRiskAI={lockdownHighRiskAI}
            onResetAlerts={resetAlerts}
          />
        );
      case 'playbooks':
        return (
          <Playbooks
            workspace={workspace}
            alerts={visibleAlerts}
            onLaunchTemplate={launchWorkflowTemplate}
            onDismissAlert={dismissAlert}
            onNavigate={navigateTo}
            onAdvanceWorkflow={advanceWorkflowRun}
            onCompleteReminder={completeReminder}
          />
        );
      case 'knowledge':
        return (
          <KnowledgeVault
            knowledgeSources={workspace.knowledgeSources}
            shadowAIEntries={workspace.shadowAIEntries}
            onAddKnowledgeSource={addKnowledgeSource}
            onUpdateKnowledgeSource={updateKnowledgeSource}
            onAddShadowAIEntry={addShadowAIEntry}
            onUpdateShadowAIEntry={updateShadowAIEntry}
          />
        );
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
              <p className="text-xs text-slate-400">Founder OS restored, upgraded, and governed</p>
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
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-white/5 text-slate-400 group-hover:text-cyan-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div
                  className={`min-w-0 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                >
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
              <p>{workspaceHealth.automationHours.toFixed(1)} automation hours saved weekly</p>
              <p>Trust score {workspaceHealth.trustScore}/100</p>
              <p>Workflow score {workspaceHealth.workflowScore}/100</p>
              <p>{workspaceHealth.alertCount} live alert(s)</p>
              <p>
                {workspaceHealth.net >= 0 ? 'Net positive' : 'Net negative'}{' '}
                {formatCompactCurrency(Math.abs(workspaceHealth.net))}
              </p>
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
                <h1 className="text-xl font-semibold text-white sm:text-2xl">
                  {activeNavItem.description}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 xl:flex">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Search and actions <span className="ml-2 text-slate-500">Ctrl/Cmd + K</span>
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current actor</p>
                <p className="text-sm font-medium text-white">{currentActor.name}</p>
                <p className="text-xs text-slate-400">{getRoleLabel(currentActor.role)}</p>
              </div>
              <select
                value={currentActor.id}
                onChange={(event) => selectActor(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
              >
                {workspace.teamMembers.map((member) => (
                  <option key={member.id} value={member.id} className="bg-slate-900">
                    {member.name} · {getRoleLabel(member.role)}
                  </option>
                ))}
              </select>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">This month</p>
                <p className="text-sm font-medium text-white">
                  Revenue {formatCurrency(monthlyIncome)} · Spend {formatCurrency(monthlyExpenses)}
                </p>
              </div>
              <button
                type="button"
                onClick={exportWorkspace}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                aria-label="Export workspace"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                aria-label="Import workspace"
              >
                <Upload className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition-colors hover:border-cyan-500/30 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {visibleAlerts.length ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {visibleAlerts.length}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{renderPage()}</main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        actions={commandActions}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <Modal
        open={notificationsOpen}
        title="Live alerts and actions"
        description="Signals generated from your current workspace state. Use them as an action inbox instead of letting risk hide in dashboards."
        onClose={() => setNotificationsOpen(false)}
      >
        <div className="space-y-3">
          {visibleAlerts.length ? (
            visibleAlerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${alert.severity === 'critical' ? 'bg-rose-500/15 text-rose-300' : alert.severity === 'warning' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                        {alert.severity}
                      </span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                        {alert.category}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-white">{alert.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{alert.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo(alert.page)}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    {alert.actionLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
              No live alerts right now.
            </div>
          )}
        </div>
      </Modal>

      <input
        ref={importFileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={importWorkspace}
      />
    </div>
  );
}

export default App;
