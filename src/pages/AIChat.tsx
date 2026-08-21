import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  BarChart3,
  Brain,
  Code,
  DollarSign,
  Eraser,
  Microscope,
  Puzzle,
  Rocket,
  Search,
  Send,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { researchInsights } from '../lib/aiResearch';
import { formatCompactCurrency, getDaysUntil } from '../lib/workspace';
import type { ChatMessage, WorkspaceData } from '../types';

interface ExpertMode {
  id: string;
  name: string;
  icon: ReactNode;
  triggers: string[];
  description: string;
}

interface AIChatProps {
  workspace: WorkspaceData;
}

const expertModes: ExpertMode[] = [
  {
    id: 'founder',
    name: 'Founder AI',
    icon: <Brain className="h-4 w-4" />,
    triggers: ['founder', 'strategy', 'priorities', 'startup'],
    description: 'Cross-functional startup guidance grounded in your workspace data.',
  },
  {
    id: 'code',
    name: 'Code Expert',
    icon: <Code className="h-4 w-4" />,
    triggers: ['code', 'bug', 'typescript', 'react', 'performance'],
    description: 'Product engineering, maintainability, and shipping quality.',
  },
  {
    id: 'seo',
    name: 'SEO Expert',
    icon: <Search className="h-4 w-4" />,
    triggers: ['seo', 'ranking', 'content', 'landing page', 'traffic'],
    description: 'Acquisition and content positioning ideas.',
  },
  {
    id: 'security',
    name: 'Security Expert',
    icon: <Shield className="h-4 w-4" />,
    triggers: ['security', 'auth', 'xss', 'vulnerability', 'risk'],
    description: 'App hardening, auth hygiene, and risk reduction.',
  },
  {
    id: 'data',
    name: 'Data Analyst',
    icon: <BarChart3 className="h-4 w-4" />,
    triggers: ['metrics', 'kpi', 'dashboard', 'analytics', 'data'],
    description: 'KPI diagnosis with practical decision support.',
  },
  {
    id: 'research',
    name: 'Research Expert',
    icon: <Microscope className="h-4 w-4" />,
    triggers: ['competitor', 'market', 'trend', 'research'],
    description: 'Market lens for idea selection and positioning.',
  },
  {
    id: 'finance',
    name: 'Finance Expert',
    icon: <DollarSign className="h-4 w-4" />,
    triggers: ['finance', 'revenue', 'burn', 'runway', 'pricing'],
    description: 'Cashflow, runway, pricing, and monetization support.',
  },
  {
    id: 'product',
    name: 'Product Expert',
    icon: <Puzzle className="h-4 w-4" />,
    triggers: ['product', 'ux', 'roadmap', 'retention', 'feature'],
    description: 'Product planning and user experience recommendations.',
  },
  {
    id: 'startup',
    name: 'Startup Advisor',
    icon: <Rocket className="h-4 w-4" />,
    triggers: ['gtm', 'scale', 'sales', 'pitch', 'fundraising'],
    description: 'Growth sequencing and founder-level next steps.',
  },
];

const suggestionPrompts = [
  'What should I focus on this week based on my workspace?',
  'Which AI systems or automations look risky right now?',
  'Which leads need follow-up and what message should I send?',
  'Give me a quick cost-control plan for the current month.',
];

function createWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    mode: 'founder',
    timestamp: new Date().toISOString(),
    content:
      'Welcome back to OneFounder AI. I can now read your workspace context, suggest priorities, detect the best expert mode automatically, and keep your chat history saved locally.',
  };
}

function detectMode(input: string, fallbackMode: string) {
  const lower = input.toLowerCase();
  const detected = expertModes.find((mode) => mode.triggers.some((trigger) => lower.includes(trigger)));
  return detected?.id ?? fallbackMode;
}

function buildSourceBackedNote() {
  return researchInsights
    .map(
      (insight) => `- ${insight.problem} Source: ${insight.sourceTitle} (${insight.sourceUrl})`
    )
    .join('\n');
}

function buildResponse(mode: string, input: string, workspace: WorkspaceData) {
  const openLeads = workspace.leads.filter((lead) => lead.stage !== 'won');
  const staleLeads = workspace.leads.filter((lead) => lead.stage !== 'won' && getDaysUntil(lead.lastContacted) <= -7);
  const overdueTasks = workspace.tasks.filter((task) => task.status !== 'done' && getDaysUntil(task.dueDate) < 0);
  const topIdea = [...workspace.ideas].sort((left, right) => right.score - left.score)[0];
  const income = workspace.transactions
    .filter((transaction) => transaction.type === 'income' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = workspace.transactions
    .filter((transaction) => transaction.type === 'expense' && getDaysUntil(transaction.date) >= -30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const completionRate = workspace.tasks.length
    ? Math.round((workspace.tasks.filter((task) => task.status === 'done').length / workspace.tasks.length) * 100)
    : 0;
  const highRiskSystems = workspace.aiSystems.filter(
    (system) => system.riskLevel === 'high' || system.riskLevel === 'critical'
  );
  const ungatedSystems = workspace.aiSystems.filter((system) => !system.humanReview);
  const activeAutomations = workspace.automations.filter((automation) => automation.status === 'active');
  const unresolvedDecisions = workspace.decisionLogs.filter(
    (decision) => decision.verificationStatus !== 'verified'
  );

  const sharedContext = `Workspace snapshot: ${openLeads.length} open leads, ${overdueTasks.length} overdue tasks, ${formatCompactCurrency(income)} income, ${formatCompactCurrency(expenses)} spend in the last 30 days, ${activeAutomations.length} active automations, and ${highRiskSystems.length} high-risk AI systems.`;
  const wantsSources = ['source', 'sources', 'citation', 'citations', 'research', 'evidence', 'trust', 'governance'].some((keyword) => input.toLowerCase().includes(keyword));

  if (wantsSources) {
    return `${sharedContext} Here is the source-backed version of the advice:\n${buildSourceBackedNote()}\n\nOperational move: combine automation speed with explicit approvals, human review for high-risk outputs, sensitivity labels, and a decision verification log.`;
  }

  switch (mode) {
    case 'code':
      return `${sharedContext} From a product engineering angle, keep the interface modular and data-driven. Your next code improvement should be extracting more shared UI patterns and validating forms before save. If you want, ask me for a specific refactor checklist for “${input}”.`;
    case 'seo':
      return `${sharedContext} I would turn ${topIdea?.title ?? 'your best idea'} into a category landing page with founder pain points, ROI proof, and a simple comparison table. Publish one customer story, one template article, and one “how it works” page to build topical depth.`;
    case 'security':
      return `${sharedContext} Security priority number one is protecting every data mutation path with validation and safe defaults. You currently have ${ungatedSystems.length} AI system(s) without human review, which is the first gap I would close. For this app, I would keep local persistence minimal, sanitize any future rich text inputs, and add backend auth plus row-level security before handling real customer data.`;
    case 'data':
      return `${sharedContext} Your completion rate is ${completionRate}% and the healthiest growth lever looks like pipeline activation. I would track five leading indicators next: stale leads older than 7 days, overdue task count, net cash movement by month, automation hours saved, and the number of unverified AI-influenced decisions.`;
    case 'research':
      return `${sharedContext} The strongest opportunity in your current workspace is ${topIdea?.title ?? 'idea discovery'}. I would validate it with five founder interviews, pricing sensitivity checks, and a competitor teardown focused on implementation speed and switching friction.`;
    case 'finance':
      return `${sharedContext} Net movement over the last 30 days is ${formatCompactCurrency(income - expenses)}. If you want a quick win, reduce the top expense categories that are not tied directly to acquisition or product reliability, then create one upsell offer for leads already in proposal or negotiation.`;
    case 'product':
      return `${sharedContext} Product-wise, I would prioritize improvements that remove friction from onboarding and follow-up workflows. Your top idea should evolve into a clearer problem statement, success metric, and smallest lovable scope before any larger roadmap bet.`;
    case 'startup':
      return `${sharedContext} Founder advice: keep your next two weeks centered on revenue, execution, and trust. Close stale follow-ups first, clear overdue tasks second, and review ${unresolvedDecisions.length} AI-influenced decision(s) before turning more workflows fully autonomous.`;
    default:
      return `${sharedContext} My founder recommendation for “${input}” is to align sales, product, cashflow, and trust around one outcome at a time. Right now that means reviving ${staleLeads.length} stale lead${staleLeads.length === 1 ? '' : 's'}, protecting focus against ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}, and reducing risk from ${ungatedSystems.length} ungated AI system(s) before scaling more automation.`;
  }
}

export default function AIChat({ workspace }: AIChatProps) {
  const [messages, setMessages] = usePersistentState<ChatMessage[]>('onefounder.chat', () => [createWelcomeMessage()]);
  const [activeMode, setActiveMode] = usePersistentState('onefounder.chat-mode', 'founder');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const activeModeData = useMemo(
    () => expertModes.find((mode) => mode.id === activeMode) ?? expertModes[0],
    [activeMode]
  );

  const suggestedMode = input.trim() ? detectMode(input, activeMode) : activeMode;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const resolvedMode = detectMode(trimmed, activeMode);
    const nextTimestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      mode: resolvedMode,
      timestamp: nextTimestamp,
    };

    setMessages((current) => [...current, userMessage]);
    setActiveMode(resolvedMode);
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        mode: resolvedMode,
        timestamp: new Date().toISOString(),
        content: buildResponse(resolvedMode, trimmed, workspace),
      };

      setMessages((current) => [...current, assistantMessage]);
      setIsTyping(false);
    }, 650);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([createWelcomeMessage()]);
    setIsTyping(false);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Expert modes</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Pick your copilot</h2>
          </div>
          <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {expertModes.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveMode(mode.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2 ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-950/60 text-slate-400'}`}>
                    {mode.icon}
                  </div>
                  <div>
                    <p className="font-medium">{mode.name}</p>
                    <p className="text-xs text-slate-400">{mode.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Smart routing</p>
          <p className="mt-2 text-sm text-slate-400">
            Suggested mode for your current message:
            <span className="ml-1 font-medium text-cyan-300">
              {expertModes.find((mode) => mode.id === suggestedMode)?.name}
            </span>
          </p>
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-3xl border border-white/10 bg-slate-900/60">
        <div className="border-b border-white/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 text-white">
                  {activeModeData.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{activeModeData.name}</h2>
                  <p className="text-sm text-slate-400">{activeModeData.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestionPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-cyan-500/30 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
            >
              <Eraser className="h-4 w-4" />
              Clear chat
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message) => {
            const modeName = expertModes.find((mode) => mode.id === message.mode)?.name ?? 'Founder AI';
            return (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' ? (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                ) : null}
                <div
                  className={`max-w-3xl rounded-3xl border p-4 ${
                    message.role === 'user'
                      ? 'border-cyan-500/20 bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                      : 'border-white/10 bg-white/5 text-slate-100'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-300/80">
                    <span>{message.role === 'assistant' ? modeName : 'You'}</span>
                    <span>•</span>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-7">{message.content}</p>
                </div>
                {message.role === 'user' ? (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white">
                    <User className="h-4 w-4" />
                  </div>
                ) : null}
              </div>
            );
          })}

          {isTyping ? (
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-2.5 w-2.5 rounded-full bg-cyan-300 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="Ask for strategy, product advice, finance guidance, code cleanup ideas, or follow-up suggestions..."
              className="w-full resize-none bg-transparent text-white placeholder-slate-500 focus:outline-none"
            />
            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">Press Enter to send · Shift+Enter for a new line</p>
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send message
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
