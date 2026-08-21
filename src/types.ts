export type NavPage =
  | 'dashboard'
  | 'chat'
  | 'ideas'
  | 'projects'
  | 'crm'
  | 'finance'
  | 'automations'
  | 'trust'
  | 'control';

export type MarketSize = 'Niche' | 'Growing' | 'Medium' | 'Large';

export interface Idea {
  id: string;
  title: string;
  description: string;
  score: number;
  category: string;
  tags: string[];
  market: MarketSize;
  createdAt: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export type LeadStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  value: number;
  stage: LeadStage;
  source: string;
  lastContacted: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'restricted';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AutomationStatus = 'draft' | 'active' | 'paused';
export type ApprovalMode = 'auto' | 'human-review' | 'dual-review';

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  owner: string;
  status: AutomationStatus;
  approvalMode: ApprovalMode;
  sensitivity: DataSensitivity;
  hoursSavedPerWeek: number;
  reliability: number;
  linkedMetric: string;
  fallback: string;
  lastRun: string;
  nextReview: string;
}

export type AISystemStatus = 'approved' | 'monitoring' | 'needs-review';
export type DeploymentStage = 'pilot' | 'production';

export interface AISystem {
  id: string;
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
  lastAudit: string;
  incidents: number;
  controls: string[];
}

export type VerificationStatus = 'unverified' | 'partially-verified' | 'verified';
export type DecisionDomain = 'product' | 'growth' | 'ops' | 'finance' | 'hiring';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface DecisionLog {
  id: string;
  title: string;
  domain: DecisionDomain;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  recommendation: string;
  owner: string;
  impact: string;
  createdAt: string;
  nextCheck: string;
}

export type TeamRole = 'founder' | 'ops' | 'security' | 'finance' | 'growth';
export type TeamStatus = 'active' | 'observer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
}

export type ApprovalRequestType = 'automation' | 'ai-system' | 'decision' | 'workspace';
export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalAction =
  | 'activate-automation'
  | 'approve-ai-system'
  | 'verify-decision'
  | 'restore-snapshot';

export interface ApprovalRequest {
  id: string;
  title: string;
  type: ApprovalRequestType;
  targetId: string;
  requestedBy: string;
  approverRole: TeamRole;
  status: ApprovalRequestStatus;
  createdAt: string;
  reason: string;
  requestedAction: ApprovalAction;
  payload: string;
}

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  summary: string;
  severity: AuditSeverity;
  createdAt: string;
}

export interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  summary: string;
  data: string;
}

export interface WorkspaceData {
  ideas: Idea[];
  tasks: Task[];
  leads: Lead[];
  transactions: Transaction[];
  automations: Automation[];
  aiSystems: AISystem[];
  decisionLogs: DecisionLog[];
  teamMembers: TeamMember[];
  approvalRequests: ApprovalRequest[];
  auditEvents: AuditEvent[];
  snapshots: Snapshot[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: string;
  timestamp: string;
}
