export type NavPage = 'dashboard' | 'chat' | 'ideas' | 'projects' | 'crm' | 'finance';

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

export interface WorkspaceData {
  ideas: Idea[];
  tasks: Task[];
  leads: Lead[];
  transactions: Transaction[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: string;
  timestamp: string;
}
