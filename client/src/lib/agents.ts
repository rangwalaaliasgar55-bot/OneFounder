/**
 * Shared agent constants used across AgentPage, AgentCollaborationView, and dashboard.
 */

export interface AgentDef {
  id: string
  icon: string
  name: string
  desc: string
  color: string
  hex: string
}

export const SPECIALIST_AGENTS: AgentDef[] = [
  { id: 'research',  icon: '🔬', name: 'Research Agent',      desc: 'Market intelligence & competitive analysis',          color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', hex: '#facc15' },
  { id: 'code',      icon: '💻', name: 'Engineering Agent',    desc: 'Architecture, code review & production implementation', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', hex: '#60a5fa' },
  { id: 'marketing', icon: '📣', name: 'Marketing Agent',      desc: 'Growth strategy, channels & campaign execution',      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', hex: '#fb7185' },
  { id: 'seo',       icon: '🔍', name: 'SEO Command Center',   desc: 'Search visibility, keywords & content strategy',      color: 'text-green-400 bg-green-500/10 border-green-500/20', hex: '#4ade80' },
  { id: 'finance',   icon: '💰', name: 'Finance Agent',        desc: 'Unit economics, fundraising & financial modeling',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', hex: '#34d399' },
  { id: 'sales',     icon: '💼', name: 'Sales Agent',          desc: 'Pipeline, outbound sequences & deal closing',        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', hex: '#22d3ee' },
  { id: 'security',  icon: '🔒', name: 'Security Agent',       desc: 'Threat modeling, OWASP & vulnerability analysis',     color: 'text-red-400 bg-red-500/10 border-red-500/20', hex: '#f87171' },
  { id: 'devops',    icon: '☁️', name: 'DevOps Agent',        desc: 'Infrastructure, CI/CD, IaC & reliability engineering', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', hex: '#94a3b8' },
  { id: 'product',   icon: '🧩', name: 'Product Agent',        desc: 'Roadmap, prioritization & product-market fit',        color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', hex: '#f472b6' },
  { id: 'data',      icon: '📊', name: 'Data Agent',           desc: 'Analytics, KPIs, SQL & business intelligence',        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', hex: '#c084fc' },
  { id: 'legal',     icon: '⚖️', name: 'Legal Ops Agent',     desc: 'Contracts, compliance, IP & risk assessment',         color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', hex: '#fbbf24' },
  { id: 'startup',   icon: '🚀', name: 'Founder Agent',        desc: 'Strategy, PMF, fundraising & startup frameworks',     color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', hex: '#fb923c' },
  { id: 'social',    icon: '📱', name: 'Social Media Agent',   desc: 'Platform-native content, hooks & algorithm tactics',  color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', hex: '#a78bfa' },
  { id: 'content',   icon: '✍️', name: 'Content Agent',        desc: 'Blog posts, copy, scripts & publish-ready drafts',    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', hex: '#2dd4bf' },
  { id: 'hiring',    icon: '🎯', name: 'Talent Agent',         desc: 'JDs, interview scorecards, comp benchmarks & onboarding', color: 'text-lime-400 bg-lime-500/10 border-lime-500/20', hex: '#a3e635' },
  { id: 'design',    icon: '🎨', name: 'Design Agent',         desc: 'UI/UX, design systems, hex codes & conversion-first design', color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20', hex: '#e879f9' },
]

export function getAgentById(id: string): AgentDef | undefined {
  return SPECIALIST_AGENTS.find(a => a.id === id)
}

export function getAgentHex(id: string): string {
  return SPECIALIST_AGENTS.find(a => a.id === id)?.hex ?? '#6366f1'
}
