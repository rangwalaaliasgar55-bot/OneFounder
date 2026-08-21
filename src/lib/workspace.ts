import type {
  Idea,
  Lead,
  Task,
  TaskPriority,
  TaskStatus,
  Transaction,
  WorkspaceData,
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

export function getDaysSince(value: string) {
  return -getDaysUntil(value);
}

export function isOverdue(value: string) {
  return getDaysUntil(value) < 0;
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

  return { ideas, tasks, leads, transactions };
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

export function sortByNewest<T extends { date?: string; createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftValue = new Date(left.date ?? left.createdAt ?? 0).getTime();
    const rightValue = new Date(right.date ?? right.createdAt ?? 0).getTime();
    return rightValue - leftValue;
  });
}

export function getMonthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
