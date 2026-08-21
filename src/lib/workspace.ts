import type {
  AISystem,
  AITrace,
  ApprovalRequest,
  AuditEvent,
  Automation,
  DataSensitivity,
  DecisionLog,
  Idea,
  Lead,
  Reminder,
  Snapshot,
  Task,
  TaskPriority,
  TaskStatus,
  TeamRole,
  Transaction,
  WorkspaceAlert,
  WorkspaceData,
  WorkflowRun,
} from '../types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const weekdayDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

export function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return date.toISOString();
}

export function hoursFromNow(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours, 0, 0, 0);
  return date.toISOString();
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(value));
}

export function formatFullDate(value: string) {
  return fullDateFormatter.format(new Date(value));
}

export function formatWeekdayDate(value: string) {
  return weekdayDateFormatter.format(new Date(value));
}

export function getDaysUntil(value: string) {
  const today = new Date();
  const target = new Date(value);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function getHoursUntil(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60));
}

export function getDaysSince(value: string) {
  return -getDaysUntil(value);
}

export function isOverdue(value: string) {
  return getDaysUntil(value) < 0;
}

export function getRoleLabel(role: TeamRole) {
  return {
    founder: 'Founder',
    ops: 'Ops Lead',
    security: 'Security Lead',
    finance: 'Finance Lead',
    growth: 'Growth Lead',
  }[role];
}

export function canRolePerform(
  role: TeamRole,
  action:
    | 'export-workspace'
    | 'create-snapshot'
    | 'activate-restricted-automation'
    | 'approve-high-risk-ai'
    | 'approve-request'
    | 'verify-decision'
) {
  const roleMatrix: Record<TeamRole, string[]> = {
    founder: [
      'export-workspace',
      'create-snapshot',
      'activate-restricted-automation',
      'approve-high-risk-ai',
      'approve-request',
      'verify-decision',
    ],
    ops: ['create-snapshot'],
    security: [
      'create-snapshot',
      'activate-restricted-automation',
      'approve-high-risk-ai',
      'approve-request',
      'verify-decision',
    ],
    finance: ['export-workspace', 'approve-request', 'verify-decision'],
    growth: [],
  };

  return roleMatrix[role].includes(action);
}

export function calculateIdeaScore({
  title,
  category,
  market,
  tags,
}: Pick<Idea, 'title' | 'category' | 'market' | 'tags'>) {
  let score = 55;

  const titleLower = title.toLowerCase();
  const categoryLower = category.toLowerCase();
  const tagsLower = tags.map((tag) => tag.toLowerCase());

  if (market === 'Large') score += 16;
  if (market === 'Growing') score += 10;
  if (market === 'Medium') score += 8;
  if (tags.length >= 3) score += 6;
  if (tagsLower.includes('ai')) score += 7;
  if (tagsLower.includes('b2b')) score += 5;
  if (categoryLower.includes('saas')) score += 4;
  if (titleLower.includes('automation')) score += 5;
  if (titleLower.includes('assistant') || titleLower.includes('copilot')) score += 4;

  return Math.min(score, 96);
}

export function createSeedWorkspace(): WorkspaceData {
  const ideas: Idea[] = [
    {
      id: 'idea-1',
      title: 'AI-Powered Meeting Summarizer',
      description:
        'Automatic transcription and concise follow-up summaries with action items for remote teams.',
      score: 87,
      category: 'SaaS',
      tags: ['AI', 'Productivity', 'B2B'],
      market: 'Large',
      createdAt: daysAgo(12),
    },
    {
      id: 'idea-2',
      title: 'Subscription Analytics Dashboard',
      description:
        'Real-time monitoring of churn, expansion revenue, and retention cohorts for SaaS founders.',
      score: 78,
      category: 'Analytics',
      tags: ['Finance', 'SaaS', 'Metrics'],
      market: 'Medium',
      createdAt: daysAgo(21),
    },
    {
      id: 'idea-3',
      title: 'Remote Team Culture Platform',
      description:
        'A lightweight platform that helps distributed teams run rituals, feedback loops, and async celebrations.',
      score: 69,
      category: 'HR Tech',
      tags: ['Remote', 'Culture', 'People Ops'],
      market: 'Growing',
      createdAt: daysAgo(33),
    },
  ];

  const tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Review Q3 financial projections',
      assignee: 'Founder',
      dueDate: daysFromNow(1),
      priority: 'high',
      status: 'todo',
    },
    {
      id: 'task-2',
      title: 'Follow up with enterprise leads',
      assignee: 'Ava',
      dueDate: daysAgo(1),
      priority: 'high',
      status: 'todo',
    },
    {
      id: 'task-3',
      title: 'Launch onboarding checklist',
      assignee: 'Sam',
      dueDate: daysFromNow(3),
      priority: 'medium',
      status: 'in-progress',
    },
    {
      id: 'task-4',
      title: 'Prepare investor update',
      assignee: 'Founder',
      dueDate: daysFromNow(5),
      priority: 'medium',
      status: 'in-progress',
    },
    {
      id: 'task-5',
      title: 'QA mobile landing page fixes',
      assignee: 'Taylor',
      dueDate: daysAgo(4),
      priority: 'low',
      status: 'done',
    },
  ];

  const leads: Lead[] = [
    {
      id: 'lead-1',
      name: 'Sarah Johnson',
      email: 'sarah@techcorp.io',
      company: 'TechCorp',
      value: 24000,
      stage: 'negotiation',
      source: 'LinkedIn',
      lastContacted: daysAgo(3),
    },
    {
      id: 'lead-2',
      name: 'Michael Chen',
      email: 'm.chen@startup.co',
      company: 'StartupCo',
      value: 18500,
      stage: 'proposal',
      source: 'Referral',
      lastContacted: daysAgo(9),
    },
    {
      id: 'lead-3',
      name: 'Emily Davis',
      email: 'emily@enterprise.com',
      company: 'Enterprise Inc',
      value: 45000,
      stage: 'qualified',
      source: 'Website',
      lastContacted: daysAgo(6),
    },
    {
      id: 'lead-4',
      name: 'James Wilson',
      email: 'j.wilson@agency.io',
      company: 'Digital Agency',
      value: 12000,
      stage: 'won',
      source: 'Cold outreach',
      lastContacted: daysAgo(11),
    },
    {
      id: 'lead-5',
      name: 'Lisa Anderson',
      email: 'lisa@fintech.com',
      company: 'FinTech Solutions',
      value: 32000,
      stage: 'lead',
      source: 'Conference',
      lastContacted: daysAgo(13),
    },
  ];

  const transactions: Transaction[] = [
    { id: 'txn-1', description: 'Annual founder plan', amount: 4999, type: 'income', category: 'Revenue', date: daysAgo(2) },
    { id: 'txn-2', description: 'AWS infrastructure', amount: 892, type: 'expense', category: 'Infrastructure', date: daysAgo(4) },
    { id: 'txn-3', description: 'Customer success retainer', amount: 650, type: 'expense', category: 'People Ops', date: daysAgo(6) },
    { id: 'txn-4', description: 'Growth plan upgrade', amount: 1999, type: 'income', category: 'Revenue', date: daysAgo(10) },
    { id: 'txn-5', description: 'Stripe fees', amount: 156, type: 'expense', category: 'Payment Processing', date: daysAgo(12) },
    { id: 'txn-6', description: 'Content marketing sprint', amount: 740, type: 'expense', category: 'Marketing', date: daysAgo(19) },
    { id: 'txn-7', description: 'Team workspace licenses', amount: 289, type: 'expense', category: 'Tools & Services', date: daysAgo(31) },
    { id: 'txn-8', description: 'Enterprise onboarding fee', amount: 3500, type: 'income', category: 'Services', date: daysAgo(34) },
    { id: 'txn-9', description: 'Quarterly cloud credits', amount: 1100, type: 'expense', category: 'Infrastructure', date: daysAgo(48) },
    { id: 'txn-10', description: 'New subscription cohort', amount: 4200, type: 'income', category: 'Revenue', date: daysAgo(52) },
    { id: 'txn-11', description: 'Design contractor', amount: 950, type: 'expense', category: 'People Ops', date: daysAgo(63) },
    { id: 'txn-12', description: 'Pilot customer invoice', amount: 2800, type: 'income', category: 'Revenue', date: daysAgo(70) },
  ];

  const automations: Automation[] = [
    {
      id: 'auto-1',
      name: 'Stale lead nudger',
      description: 'Flags CRM leads with no activity for 7+ days and sends a follow-up task into the founder queue.',
      trigger: 'Daily at 9:00 AM',
      owner: 'Revenue Ops',
      status: 'active',
      approvalMode: 'human-review',
      sensitivity: 'internal',
      hoursSavedPerWeek: 3.5,
      reliability: 91,
      linkedMetric: 'Lead response time',
      fallback: 'Manual CRM review every Monday',
      lastRun: daysAgo(0),
      nextReview: daysFromNow(14),
    },
    {
      id: 'auto-2',
      name: 'Weekly founder digest',
      description: 'Compiles finance, project, and CRM summaries into a single board-ready update every Friday.',
      trigger: 'Friday at 4:30 PM',
      owner: 'Chief of Staff',
      status: 'active',
      approvalMode: 'human-review',
      sensitivity: 'confidential',
      hoursSavedPerWeek: 2.5,
      reliability: 94,
      linkedMetric: 'Leadership reporting time',
      fallback: 'Run export manually from each workspace section',
      lastRun: daysAgo(5),
      nextReview: daysFromNow(20),
    },
    {
      id: 'auto-3',
      name: 'Expense anomaly check',
      description: 'Highlights unusual spend spikes and asks for a human note before approval.',
      trigger: 'Whenever a new expense is added',
      owner: 'Finance Lead',
      status: 'draft',
      approvalMode: 'dual-review',
      sensitivity: 'restricted',
      hoursSavedPerWeek: 1.5,
      reliability: 79,
      linkedMetric: 'Unexpected spend',
      fallback: 'Weekly finance review meeting',
      lastRun: daysAgo(10),
      nextReview: daysFromNow(7),
    },
  ];

  const aiSystems: AISystem[] = [
    {
      id: 'ai-1',
      name: 'Founder copilot chat',
      purpose: 'Founder support for planning, prioritization, and quick drafting.',
      owner: 'Product',
      modelFamily: 'General-purpose LLM',
      deployment: 'production',
      riskLevel: 'medium',
      sensitivity: 'internal',
      humanReview: true,
      sourceRequired: true,
      piiAllowed: false,
      status: 'approved',
      lastAudit: daysAgo(8),
      incidents: 1,
      controls: ['Prompt guardrails', 'Manual review', 'Decision log required'],
    },
    {
      id: 'ai-2',
      name: 'Lead scoring assistant',
      purpose: 'Suggests lead priority using CRM context and sales heuristics.',
      owner: 'Revenue Ops',
      modelFamily: 'Rules + LLM summary',
      deployment: 'pilot',
      riskLevel: 'high',
      sensitivity: 'confidential',
      humanReview: true,
      sourceRequired: true,
      piiAllowed: false,
      status: 'monitoring',
      lastAudit: daysAgo(16),
      incidents: 0,
      controls: ['Human approval', 'Restricted inputs', 'Weekly drift review'],
    },
    {
      id: 'ai-3',
      name: 'Support reply draft bot',
      purpose: 'Creates first-draft replies for customer support and onboarding questions.',
      owner: 'Customer Success',
      modelFamily: 'LLM with templates',
      deployment: 'production',
      riskLevel: 'critical',
      sensitivity: 'restricted',
      humanReview: false,
      sourceRequired: false,
      piiAllowed: true,
      status: 'needs-review',
      lastAudit: daysAgo(27),
      incidents: 3,
      controls: ['Rate limiting', 'Escalation fallback'],
    },
  ];

  const decisionLogs: DecisionLog[] = [
    {
      id: 'decision-1',
      title: 'Move onboarding analytics ahead of referral feature',
      domain: 'product',
      confidence: 'medium',
      verificationStatus: 'partially-verified',
      recommendation: 'AI recommends prioritizing onboarding analytics because retention signals are weak after day 7.',
      owner: 'Founder',
      impact: 'Could improve activation and reduce blind spots in the funnel.',
      createdAt: daysAgo(6),
      nextCheck: daysFromNow(4),
    },
    {
      id: 'decision-2',
      title: 'Reduce unused SaaS subscriptions before next payroll cycle',
      domain: 'finance',
      confidence: 'high',
      verificationStatus: 'verified',
      recommendation: 'Pause low-usage tools and re-approve only those tied to acquisition, reliability, or close rate.',
      owner: 'Finance Lead',
      impact: 'Improves net cash movement without slowing shipping velocity.',
      createdAt: daysAgo(9),
      nextCheck: daysFromNow(12),
    },
    {
      id: 'decision-3',
      title: 'Let AI draft customer support replies only after human review',
      domain: 'ops',
      confidence: 'high',
      verificationStatus: 'unverified',
      recommendation: 'Remove full auto-send and enforce a human approval checkpoint for customer-facing answers.',
      owner: 'Customer Success',
      impact: 'Reduces hallucination and tone-risk in live customer interactions.',
      createdAt: daysAgo(2),
      nextCheck: daysFromNow(2),
    },
  ];

  const teamMembers: WorkspaceData['teamMembers'] = [
    { id: 'member-1', name: 'Founder', email: 'founder@onefounder.app', role: 'founder', status: 'active' },
    { id: 'member-2', name: 'Ava Patel', email: 'ava@onefounder.app', role: 'ops', status: 'active' },
    { id: 'member-3', name: 'Priya Shah', email: 'priya@onefounder.app', role: 'security', status: 'active' },
    { id: 'member-4', name: 'Noah Kim', email: 'noah@onefounder.app', role: 'finance', status: 'active' },
    { id: 'member-5', name: 'Maya Brooks', email: 'maya@onefounder.app', role: 'growth', status: 'observer' },
  ];

  const approvalRequests: ApprovalRequest[] = [
    {
      id: 'approval-1',
      title: 'Review support reply draft bot for production safety',
      type: 'ai-system',
      targetId: 'ai-3',
      requestedBy: 'Customer Success',
      approverRole: 'security',
      status: 'pending',
      createdAt: daysAgo(1),
      reason: 'Critical-risk system lacks human review and source requirements.',
      requestedAction: 'approve-ai-system',
      payload: JSON.stringify({
        updates: { humanReview: true, sourceRequired: true, status: 'monitoring' },
      }),
    },
  ];

  const auditEvents: AuditEvent[] = [
    {
      id: 'audit-1',
      actor: 'Founder',
      action: 'workspace-upgrade',
      target: 'OneFounder',
      summary: 'Initial AI-era workspace controls were enabled.',
      severity: 'info',
      createdAt: daysAgo(2),
    },
    {
      id: 'audit-2',
      actor: 'Priya Shah',
      action: 'risk-review',
      target: 'Support reply draft bot',
      summary: 'Flagged missing human review on a restricted, customer-facing system.',
      severity: 'critical',
      createdAt: daysAgo(1),
    },
  ];

  const workflowRuns: WorkflowRun[] = [
    {
      id: 'workflow-1',
      name: 'Weekly founder review cadence',
      templateId: 'weekly-review',
      owner: 'Founder',
      status: 'active',
      createdAt: daysAgo(3),
      summary: 'Recurring weekly workflow for finance, CRM, trust, and execution review.',
      steps: ['Review alerts', 'Clear stale leads', 'Audit AI trust', 'Export board report'],
      completedSteps: 2,
      nextAction: 'Audit AI trust',
      relatedPages: ['playbooks', 'crm', 'trust', 'control'],
    },
  ];

  const reminders: Reminder[] = [
    {
      id: 'reminder-1',
      title: 'Review pending approvals',
      description: 'Clear approval backlog before the weekly review ends.',
      owner: 'Founder',
      dueAt: hoursFromNow(8),
      status: 'due',
      linkedPage: 'control',
    },
    {
      id: 'reminder-2',
      title: 'Check lead follow-up queue',
      description: 'Warm leads older than 7 days need a human touch.',
      owner: 'Revenue Ops',
      dueAt: daysFromNow(1),
      status: 'upcoming',
      linkedPage: 'crm',
    },
    {
      id: 'reminder-3',
      title: 'Run weekly founder digest',
      description: 'Export board report and finance summary for the week.',
      owner: 'Chief of Staff',
      dueAt: daysFromNow(2),
      status: 'upcoming',
      linkedPage: 'playbooks',
    },
  ];

  const aiTraces: AITrace[] = [
    {
      id: 'trace-1',
      systemId: 'ai-1',
      title: 'Founder strategy answer with grounded notes',
      latencyMs: 1900,
      tokenCostUsd: 0.08,
      qualityScore: 92,
      safetyScore: 97,
      outcome: 'healthy',
      feedback: 'positive',
      createdAt: daysAgo(1),
      notes: 'Source-backed answer with strong user feedback and no policy violations.',
    },
    {
      id: 'trace-2',
      systemId: 'ai-2',
      title: 'Lead scoring recommendation for enterprise segment',
      latencyMs: 2450,
      tokenCostUsd: 0.11,
      qualityScore: 84,
      safetyScore: 95,
      outcome: 'warning',
      feedback: 'neutral',
      createdAt: daysAgo(2),
      notes: 'Output required manual override because account history was incomplete.',
    },
    {
      id: 'trace-3',
      systemId: 'ai-3',
      title: 'Support reply draft for refund complaint',
      latencyMs: 1600,
      tokenCostUsd: 0.06,
      qualityScore: 58,
      safetyScore: 49,
      outcome: 'critical',
      feedback: 'negative',
      createdAt: daysAgo(0),
      notes: 'Unsafe draft tone and missing human review created a policy concern.',
    },
  ];

  const snapshots: Snapshot[] = [
    {
      id: 'snapshot-1',
      name: 'Baseline restored upgrade',
      createdAt: daysAgo(0),
      summary: 'Snapshot after restoring the original zip and applying the first major workspace upgrade.',
      data: '',
    },
  ];

  const baseWorkspace: WorkspaceData = {
    ideas,
    tasks,
    leads,
    transactions,
    automations,
    aiSystems,
    decisionLogs,
    teamMembers,
    approvalRequests,
    auditEvents,
    snapshots,
    workflowRuns,
    reminders,
    aiTraces,
    dismissedAlertIds: [],
  };

  baseWorkspace.snapshots = [
    {
      ...snapshots[0],
      data: serializeSnapshotData(baseWorkspace),
    },
  ];

  return baseWorkspace;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeSensitivity(value: unknown): DataSensitivity {
  return value === 'public' || value === 'internal' || value === 'confidential' || value === 'restricted'
    ? value
    : 'internal';
}

function normalizeTeamRole(value: unknown): TeamRole {
  return value === 'founder' || value === 'ops' || value === 'security' || value === 'finance' || value === 'growth'
    ? value
    : 'founder';
}

export function normalizeWorkspaceData(input: unknown): WorkspaceData {
  const seed = createSeedWorkspace();
  const data = (input && typeof input === 'object' ? input : {}) as Partial<WorkspaceData>;

  return {
    ideas: Array.isArray(data.ideas)
      ? data.ideas.map((idea, index) => ({
          id: idea.id ?? `idea-import-${index}`,
          title: idea.title ?? 'Untitled idea',
          description: idea.description ?? '',
          score: typeof idea.score === 'number' ? idea.score : 60,
          category: idea.category ?? 'General',
          tags: Array.isArray(idea.tags) ? idea.tags.filter((tag): tag is string => typeof tag === 'string') : [],
          market: idea.market ?? 'Growing',
          createdAt: idea.createdAt ?? new Date().toISOString(),
        }))
      : seed.ideas,
    tasks: Array.isArray(data.tasks)
      ? data.tasks.map((task, index) => ({
          id: task.id ?? `task-import-${index}`,
          title: task.title ?? 'Untitled task',
          assignee: task.assignee ?? 'Unassigned',
          dueDate: task.dueDate ?? new Date().toISOString(),
          priority: task.priority ?? 'medium',
          status: task.status ?? 'todo',
        }))
      : seed.tasks,
    leads: Array.isArray(data.leads)
      ? data.leads.map((lead, index) => ({
          id: lead.id ?? `lead-import-${index}`,
          name: lead.name ?? 'Unknown lead',
          email: lead.email ?? '',
          company: lead.company ?? 'Unknown company',
          value: typeof lead.value === 'number' ? lead.value : 0,
          stage: lead.stage ?? 'lead',
          source: lead.source ?? 'Unknown',
          lastContacted: lead.lastContacted ?? new Date().toISOString(),
        }))
      : seed.leads,
    transactions: Array.isArray(data.transactions)
      ? data.transactions.map((transaction, index) => ({
          id: transaction.id ?? `txn-import-${index}`,
          description: transaction.description ?? 'Imported transaction',
          amount: typeof transaction.amount === 'number' ? transaction.amount : 0,
          type: transaction.type ?? 'expense',
          category: transaction.category ?? 'General',
          date: transaction.date ?? new Date().toISOString(),
        }))
      : seed.transactions,
    automations: Array.isArray(data.automations)
      ? data.automations.map((automation, index) => ({
          id: automation.id ?? `auto-import-${index}`,
          name: automation.name ?? 'Imported automation',
          description: automation.description ?? '',
          trigger: automation.trigger ?? 'Manual',
          owner: automation.owner ?? 'Unassigned',
          status: automation.status ?? 'draft',
          approvalMode: automation.approvalMode ?? 'human-review',
          sensitivity: normalizeSensitivity(automation.sensitivity),
          hoursSavedPerWeek: typeof automation.hoursSavedPerWeek === 'number' ? automation.hoursSavedPerWeek : 0,
          reliability: typeof automation.reliability === 'number' ? automation.reliability : 70,
          linkedMetric: automation.linkedMetric ?? 'Not set',
          fallback: automation.fallback ?? 'Manual fallback not documented',
          lastRun: automation.lastRun ?? new Date().toISOString(),
          nextReview: automation.nextReview ?? new Date().toISOString(),
        }))
      : seed.automations,
    aiSystems: Array.isArray(data.aiSystems)
      ? data.aiSystems.map((system, index) => ({
          id: system.id ?? `ai-import-${index}`,
          name: system.name ?? 'Imported AI system',
          purpose: system.purpose ?? '',
          owner: system.owner ?? 'Unassigned',
          modelFamily: system.modelFamily ?? 'Unknown',
          deployment: system.deployment ?? 'pilot',
          riskLevel: system.riskLevel ?? 'medium',
          sensitivity: normalizeSensitivity(system.sensitivity),
          humanReview: typeof system.humanReview === 'boolean' ? system.humanReview : true,
          sourceRequired: typeof system.sourceRequired === 'boolean' ? system.sourceRequired : true,
          piiAllowed: typeof system.piiAllowed === 'boolean' ? system.piiAllowed : false,
          status: system.status ?? 'monitoring',
          lastAudit: system.lastAudit ?? new Date().toISOString(),
          incidents: typeof system.incidents === 'number' ? system.incidents : 0,
          controls: toStringArray(system.controls),
        }))
      : seed.aiSystems,
    decisionLogs: Array.isArray(data.decisionLogs)
      ? data.decisionLogs.map((decision, index) => ({
          id: decision.id ?? `decision-import-${index}`,
          title: decision.title ?? 'Imported decision',
          domain: decision.domain ?? 'ops',
          confidence: decision.confidence ?? 'medium',
          verificationStatus: decision.verificationStatus ?? 'unverified',
          recommendation: decision.recommendation ?? '',
          owner: decision.owner ?? 'Unassigned',
          impact: decision.impact ?? '',
          createdAt: decision.createdAt ?? new Date().toISOString(),
          nextCheck: decision.nextCheck ?? new Date().toISOString(),
        }))
      : seed.decisionLogs,
    teamMembers: Array.isArray(data.teamMembers)
      ? data.teamMembers.map((member, index) => ({
          id: member.id ?? `member-import-${index}`,
          name: member.name ?? 'Imported member',
          email: member.email ?? '',
          role: normalizeTeamRole(member.role),
          status: member.status ?? 'active',
        }))
      : seed.teamMembers,
    approvalRequests: Array.isArray(data.approvalRequests)
      ? data.approvalRequests.map((request, index) => ({
          id: request.id ?? `approval-import-${index}`,
          title: request.title ?? 'Imported approval',
          type: request.type ?? 'workspace',
          targetId: request.targetId ?? '',
          requestedBy: request.requestedBy ?? 'System',
          approverRole: normalizeTeamRole(request.approverRole),
          status: request.status ?? 'pending',
          createdAt: request.createdAt ?? new Date().toISOString(),
          reason: request.reason ?? '',
          requestedAction: request.requestedAction ?? 'restore-snapshot',
          payload: typeof request.payload === 'string' ? request.payload : '{}',
        }))
      : seed.approvalRequests,
    auditEvents: Array.isArray(data.auditEvents)
      ? data.auditEvents.map((event, index) => ({
          id: event.id ?? `audit-import-${index}`,
          actor: event.actor ?? 'System',
          action: event.action ?? 'import',
          target: event.target ?? 'Workspace',
          summary: event.summary ?? '',
          severity: event.severity ?? 'info',
          createdAt: event.createdAt ?? new Date().toISOString(),
        }))
      : seed.auditEvents,
    snapshots: Array.isArray(data.snapshots)
      ? data.snapshots.map((snapshot, index) => ({
          id: snapshot.id ?? `snapshot-import-${index}`,
          name: snapshot.name ?? 'Imported snapshot',
          createdAt: snapshot.createdAt ?? new Date().toISOString(),
          summary: snapshot.summary ?? '',
          data: typeof snapshot.data === 'string' ? snapshot.data : '{}',
        }))
      : seed.snapshots,
    workflowRuns: Array.isArray(data.workflowRuns)
      ? data.workflowRuns.map((run, index) => ({
          id: run.id ?? `workflow-import-${index}`,
          name: run.name ?? 'Imported workflow run',
          templateId: run.templateId ?? 'custom',
          owner: run.owner ?? 'Founder',
          status: run.status ?? 'planned',
          createdAt: run.createdAt ?? new Date().toISOString(),
          summary: run.summary ?? '',
          steps: Array.isArray(run.steps) ? run.steps.filter((step): step is string => typeof step === 'string') : [],
          completedSteps: typeof run.completedSteps === 'number' ? run.completedSteps : 0,
          nextAction: run.nextAction ?? 'Review workflow',
          relatedPages: Array.isArray(run.relatedPages) ? run.relatedPages.filter((page): page is WorkflowRun['relatedPages'][number] => typeof page === 'string') : ['playbooks'],
        }))
      : seed.workflowRuns,
    reminders: Array.isArray(data.reminders)
      ? data.reminders.map((reminder, index) => {
          const dueAt = reminder.dueAt ?? new Date().toISOString();
          const computedStatus = reminder.status === 'done'
            ? 'done'
            : new Date(dueAt).getTime() <= Date.now()
              ? 'due'
              : 'upcoming';
          return {
            id: reminder.id ?? `reminder-import-${index}`,
            title: reminder.title ?? 'Imported reminder',
            description: reminder.description ?? '',
            owner: reminder.owner ?? 'Founder',
            dueAt,
            status: computedStatus,
            linkedPage: reminder.linkedPage ?? 'dashboard',
          };
        })
      : seed.reminders,
    aiTraces: Array.isArray(data.aiTraces)
      ? data.aiTraces.map((trace, index) => ({
          id: trace.id ?? `trace-import-${index}`,
          systemId: trace.systemId ?? 'unknown',
          title: trace.title ?? 'Imported trace',
          latencyMs: typeof trace.latencyMs === 'number' ? trace.latencyMs : 0,
          tokenCostUsd: typeof trace.tokenCostUsd === 'number' ? trace.tokenCostUsd : 0,
          qualityScore: typeof trace.qualityScore === 'number' ? trace.qualityScore : 0,
          safetyScore: typeof trace.safetyScore === 'number' ? trace.safetyScore : 0,
          outcome: trace.outcome ?? 'warning',
          feedback: trace.feedback ?? 'neutral',
          createdAt: trace.createdAt ?? new Date().toISOString(),
          notes: trace.notes ?? '',
        }))
      : seed.aiTraces,
    dismissedAlertIds: Array.isArray(data.dismissedAlertIds)
      ? data.dismissedAlertIds.filter((id): id is string => typeof id === 'string')
      : seed.dismissedAlertIds,
  };
}

export function createAuditEvent(
  actor: string,
  action: string,
  target: string,
  summary: string,
  severity: AuditEvent['severity'] = 'info'
): AuditEvent {
  return {
    id: makeId('audit'),
    actor,
    action,
    target,
    summary,
    severity,
    createdAt: new Date().toISOString(),
  };
}

export function appendAuditEvent(data: WorkspaceData, event: AuditEvent) {
  return {
    ...data,
    auditEvents: [event, ...data.auditEvents].slice(0, 200),
  };
}

export function serializeSnapshotData(workspace: WorkspaceData) {
  const snapshotSafeWorkspace: WorkspaceData = {
    ...workspace,
    snapshots: [],
  };

  return JSON.stringify(snapshotSafeWorkspace);
}

export function createSnapshot(workspace: WorkspaceData, name: string, summary: string): Snapshot {
  return {
    id: makeId('snapshot'),
    name,
    createdAt: new Date().toISOString(),
    summary,
    data: serializeSnapshotData(workspace),
  };
}

export function buildBoardReportMarkdown(workspace: WorkspaceData) {
  const monthlyIncome = workspace.transactions
    .filter((transaction) => transaction.type === 'income' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpenses = workspace.transactions
    .filter((transaction) => transaction.type === 'expense' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const trustScore = calculateAIReadinessScore(workspace.aiSystems, workspace.automations);
  const activeAutomations = workspace.automations.filter((automation) => automation.status === 'active');
  const staleLeads = workspace.leads.filter((lead) => lead.stage !== 'won' && getDaysSince(lead.lastContacted) >= 7);
  const overdueTasks = workspace.tasks.filter((task) => task.status !== 'done' && isOverdue(task.dueDate));
  const unresolvedDecisions = workspace.decisionLogs.filter((decision) => decision.verificationStatus !== 'verified');
  const workflowScore = calculateWorkflowScore(workspace);

  return `# OneFounder Board Report\n\nGenerated: ${new Date().toLocaleString()}\n\n## Operating Summary\n- Revenue (30d): ${formatCurrency(monthlyIncome)}\n- Expenses (30d): ${formatCurrency(monthlyExpenses)}\n- Net movement (30d): ${formatCurrency(monthlyIncome - monthlyExpenses)}\n- Active automations: ${activeAutomations.length}\n- Automation hours saved/week: ${calculateAutomationHours(workspace.automations).toFixed(1)}\n- AI readiness score: ${trustScore}/100\n- Workflow score: ${workflowScore}/100\n\n## Current Risks\n- Overdue tasks: ${overdueTasks.length}\n- Stale revenue follow-ups: ${staleLeads.length}\n- Unverified AI-influenced decisions: ${unresolvedDecisions.length}\n- High-risk AI systems: ${workspace.aiSystems.filter((system) => system.riskLevel === 'high' || system.riskLevel === 'critical').length}\n- Due reminders: ${workspace.reminders.filter((reminder) => reminder.status === 'due').length}\n\n## Governance Actions\n${workspace.approvalRequests
    .filter((request) => request.status === 'pending')
    .map((request) => `- Pending approval: ${request.title} (${request.requestedBy})`)
    .join('\n') || '- No pending approvals'}\n\n## Recent Audit Events\n${workspace.auditEvents
    .slice(0, 5)
    .map((event) => `- ${formatShortDate(event.createdAt)} · ${event.actor} · ${event.summary}`)
    .join('\n')}\n`;
}

export function getPriorityWeight(priority: TaskPriority) {
  return { high: 3, medium: 2, low: 1 }[priority];
}

export function getStatusLabel(status: TaskStatus) {
  return {
    todo: 'To do',
    'in-progress': 'In progress',
    done: 'Done',
  }[status];
}

export function getStageLabel(stage: Lead['stage']) {
  return stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ');
}

export function getRiskTone(level: AISystem['riskLevel']) {
  return {
    low: 'text-emerald-300 bg-emerald-500/15',
    medium: 'text-cyan-300 bg-cyan-500/15',
    high: 'text-amber-300 bg-amber-500/15',
    critical: 'text-rose-300 bg-rose-500/15',
  }[level];
}

export function getSensitivityTone(level: DataSensitivity) {
  return {
    public: 'text-slate-300 bg-slate-700/60',
    internal: 'text-cyan-300 bg-cyan-500/15',
    confidential: 'text-amber-300 bg-amber-500/15',
    restricted: 'text-rose-300 bg-rose-500/15',
  }[level];
}

export function getVerificationTone(status: DecisionLog['verificationStatus']) {
  return {
    verified: 'text-emerald-300 bg-emerald-500/15',
    'partially-verified': 'text-amber-300 bg-amber-500/15',
    unverified: 'text-rose-300 bg-rose-500/15',
  }[status];
}

export function getConfidenceTone(confidence: DecisionLog['confidence']) {
  return {
    high: 'text-emerald-300 bg-emerald-500/15',
    medium: 'text-cyan-300 bg-cyan-500/15',
    low: 'text-rose-300 bg-rose-500/15',
  }[confidence];
}

export function getAutomationStatusTone(status: Automation['status']) {
  return {
    active: 'text-emerald-300 bg-emerald-500/15',
    paused: 'text-amber-300 bg-amber-500/15',
    draft: 'text-slate-300 bg-slate-700/60',
  }[status];
}

export function getTraceTone(outcome: AITrace['outcome']) {
  return {
    healthy: 'text-emerald-300 bg-emerald-500/15',
    warning: 'text-amber-300 bg-amber-500/15',
    critical: 'text-rose-300 bg-rose-500/15',
  }[outcome];
}

export function getReminderTone(status: Reminder['status']) {
  return {
    upcoming: 'text-cyan-300 bg-cyan-500/15',
    due: 'text-amber-300 bg-amber-500/15',
    done: 'text-emerald-300 bg-emerald-500/15',
  }[status];
}

export function sortByNewest<T extends { date?: string; createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftValue = new Date(left.date ?? left.createdAt ?? 0).getTime();
    const rightValue = new Date(right.date ?? right.createdAt ?? 0).getTime();
    return rightValue - leftValue;
  });
}

export function calculateAutomationHours(automations: Automation[]) {
  return automations
    .filter((automation) => automation.status === 'active')
    .reduce((sum, automation) => sum + automation.hoursSavedPerWeek, 0);
}

export function calculateAIReadinessScore(aiSystems: AISystem[], automations: Automation[]) {
  if (!aiSystems.length) {
    return 0;
  }

  const systemScore = aiSystems.reduce((sum, system) => {
    let current = 40;
    if (system.humanReview) current += 15;
    if (system.sourceRequired) current += 10;
    if (!system.piiAllowed) current += 10;
    if (system.controls.length >= 3) current += 10;
    if (system.status === 'approved') current += 10;
    if (system.status === 'monitoring') current += 5;
    current -= system.incidents * 4;
    if (system.riskLevel === 'critical' && !system.humanReview) current -= 15;
    return sum + Math.max(0, Math.min(100, current));
  }, 0);

  const automationScore = automations.length
    ? automations.reduce((sum, automation) => {
        let current = automation.reliability;
        if (automation.approvalMode === 'auto' && automation.sensitivity === 'restricted') current -= 18;
        if (!automation.owner.trim()) current -= 10;
        if (!automation.fallback.trim()) current -= 8;
        return sum + Math.max(0, Math.min(100, current));
      }, 0) / automations.length
    : 80;

  return Math.round((systemScore / aiSystems.length) * 0.65 + automationScore * 0.35);
}

export function calculateWorkflowScore(workspace: WorkspaceData) {
  const activeRuns = workspace.workflowRuns.filter((run) => run.status !== 'completed').length;
  const overdueTasks = workspace.tasks.filter((task) => task.status !== 'done' && isOverdue(task.dueDate)).length;
  const unresolvedApprovals = workspace.approvalRequests.filter((request) => request.status === 'pending').length;
  const dueReminders = workspace.reminders.filter((reminder) => reminder.status === 'due').length;
  const automationHours = calculateAutomationHours(workspace.automations);
  const base = 60 + Math.min(20, Math.round(automationHours * 2)) + Math.min(10, activeRuns * 2);
  return Math.max(20, Math.min(100, base - overdueTasks * 6 - unresolvedApprovals * 4 - dueReminders * 3));
}

export function calculateTraceHealth(traces: AITrace[]) {
  if (!traces.length) return 0;
  return Math.round(
    traces.reduce((sum, trace) => sum + trace.qualityScore * 0.55 + trace.safetyScore * 0.45, 0) /
      traces.length
  );
}

export function getWorkspaceAlerts(workspace: WorkspaceData): WorkspaceAlert[] {
  const alerts: WorkspaceAlert[] = [];
  const overdueTasks = workspace.tasks.filter((task) => task.status !== 'done' && isOverdue(task.dueDate));
  const staleLeads = workspace.leads.filter((lead) => lead.stage !== 'won' && getDaysSince(lead.lastContacted) >= 7);
  const highRiskUngated = workspace.aiSystems.filter(
    (system) => (system.riskLevel === 'high' || system.riskLevel === 'critical') && !system.humanReview
  );
  const pendingApprovals = workspace.approvalRequests.filter((request) => request.status === 'pending');
  const restrictedAuto = workspace.automations.filter(
    (automation) => automation.sensitivity === 'restricted' && automation.approvalMode === 'auto'
  );
  const negativeNet = workspace.transactions
    .filter((transaction) => getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount), 0);
  const dueReminders = workspace.reminders.filter((reminder) => reminder.status === 'due');
  const criticalTraces = workspace.aiTraces.filter((trace) => trace.outcome === 'critical');

  if (highRiskUngated.length) {
    alerts.push({
      id: 'alert-ai-ungated',
      title: `${highRiskUngated.length} high-risk AI system(s) lack human review`,
      description: 'Add a human checkpoint before scaling more autonomous behavior.',
      severity: 'critical',
      category: 'governance',
      actionLabel: 'Open Trust Center',
      page: 'trust',
    });
  }

  if (pendingApprovals.length) {
    alerts.push({
      id: 'alert-approvals-pending',
      title: `${pendingApprovals.length} approval request(s) are waiting`,
      description: 'Pending approvals slow workflows and hide ownership if they stay unresolved.',
      severity: 'warning',
      category: 'governance',
      actionLabel: 'Open Control Room',
      page: 'control',
    });
  }

  if (overdueTasks.length) {
    alerts.push({
      id: 'alert-overdue-tasks',
      title: `${overdueTasks.length} overdue task(s) need attention`,
      description: 'Execution drift is increasing. Clear blockers before adding more work in progress.',
      severity: overdueTasks.length > 2 ? 'critical' : 'warning',
      category: 'delivery',
      actionLabel: 'Open Projects',
      page: 'projects',
    });
  }

  if (staleLeads.length) {
    alerts.push({
      id: 'alert-stale-leads',
      title: `${staleLeads.length} stale revenue follow-up(s) detected`,
      description: 'Warm pipeline activity is cooling. Route attention back to CRM.',
      severity: 'warning',
      category: 'revenue',
      actionLabel: 'Open CRM',
      page: 'crm',
    });
  }

  if (negativeNet < 0) {
    alerts.push({
      id: 'alert-negative-net',
      title: 'Net cash movement is negative over the last 30 days',
      description: 'Review expenses and consider a revenue recovery workflow this week.',
      severity: 'warning',
      category: 'finance',
      actionLabel: 'Open Finance',
      page: 'finance',
    });
  }

  if (restrictedAuto.length) {
    alerts.push({
      id: 'alert-restricted-automation',
      title: `${restrictedAuto.length} restricted automation(s) are set to auto-approve`,
      description: 'Sensitive automations should pause for human or dual review.',
      severity: 'critical',
      category: 'automation',
      actionLabel: 'Open Automations',
      page: 'automations',
    });
  }

  if (dueReminders.length) {
    alerts.push({
      id: 'alert-due-reminders',
      title: `${dueReminders.length} reminder(s) are due`,
      description: 'The team has scheduled follow-through waiting in the workflow inbox.',
      severity: 'info',
      category: 'delivery',
      actionLabel: 'Open Playbooks',
      page: 'playbooks',
    });
  }

  if (criticalTraces.length) {
    alerts.push({
      id: 'alert-critical-traces',
      title: `${criticalTraces.length} AI trace(s) show critical quality or safety issues`,
      description: 'Recent AI runs need immediate review in observability and trust workflows.',
      severity: 'critical',
      category: 'governance',
      actionLabel: 'Open Trust Center',
      page: 'trust',
    });
  }

  return alerts;
}

export function getVisibleWorkspaceAlerts(workspace: WorkspaceData) {
  return getWorkspaceAlerts(workspace).filter(
    (alert) => !workspace.dismissedAlertIds.includes(alert.id)
  );
}

export function getMonthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
