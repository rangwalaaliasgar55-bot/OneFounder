import { useState, useRef, useCallback, lazy, Suspense } from 'react'
import { api } from '../lib/api'
import { v4 as uuidv4 } from 'uuid'
import { MeshGradient } from '../components/ui/MeshGradient'
import { SPECIALIST_AGENTS } from '../lib/agents'
import { createLazy3D, isWebGLAvailable, isMobile } from '../components/3d/Lazy3D'

const LazyAgentCollab = createLazy3D<{ activeAgents?: string[]; completedAgents?: string[] }>(
  () => import('../components/3d/AgentCollaborationView')
)

interface AgentResult {
  agent: string
  response: string
  confidence: number
  executionTimeMs: number
}

interface ExecutionResult {
  synthesis: string
  agentsUsed: string[]
  agentResults: AgentResult[]
  totalTimeMs: number
  memoryUsed: boolean
  ragUsed: boolean
}

function renderMarkdown(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/)
      const lang = match?.[1] || ''
      const code = match?.[2] || part.replace(/```\w*\n?/, '').replace(/```$/, '')
      return (
        <div key={i} className="my-3 rounded-xl overflow-hidden border border-white/10">
          {lang && <div className="px-3 py-1 bg-white/5 text-xs text-slate-400 font-mono border-b border-white/10">{lang}</div>}
          <pre className="p-4 text-xs overflow-x-auto bg-black/40 text-green-300 font-mono leading-relaxed"><code>{code}</code></pre>
        </div>
      )
    }
    const escaped = part.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    const formatted = escaped
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,'<em>$1</em>')
      .replace(/^### (.+)$/gm,'<h3 class="text-sm font-semibold text-white mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm,'<h2 class="text-base font-bold text-white mt-5 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm,'<h1 class="text-lg font-bold text-white mt-5 mb-2">$1</h1>')
    return <span key={i} className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
  })
}

export function AgentPage() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [autoSelect, setAutoSelect] = useState(true)
  const [query, setQuery] = useState('')
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [activeAgents, setActiveAgents] = useState<string[]>([])
  const [completedAgents, setCompletedAgents] = useState<string[]>([])
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [view3D, setView3D] = useState(false)

  const EXAMPLE_QUERIES = [
    'Analyze the market opportunity for an AI-powered project management tool targeting startups',
    'Build a full go-to-market strategy for my SaaS — 0 users, $5k budget, B2B focus',
    'Write a complete landing page with copy, design spec, and SEO metadata for my product',
    'What are the biggest security vulnerabilities in my Express + PostgreSQL app? Give me exact fixes',
    'Create a 30-day sprint to get my first 100 paying customers — include content, social, and outreach',
    'Model my unit economics and tell me what I need to raise a Series A',
    'Design an end-to-end hiring process for a senior full-stack engineer at an early-stage startup',
  ]

  function toggleAgent(id: string) {
    setSelectedAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  async function execute() {
    if (!query.trim() || executing) return
    setExecuting(true)
    setResult(null)
    setActiveAgents([])
    setCompletedAgents([])

    try {
      const res = await fetch('/api/agents/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query,
          agents: autoSelect ? undefined : selectedAgents,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream unavailable')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) continue
          if (!line.startsWith('data: ')) continue
          const prevLine = lines[lines.indexOf(line) - 1] || ''
          const eventType = prevLine.startsWith('event: ') ? prevLine.slice(7).trim() : ''
          const data = line.slice(6)

          try {
            const parsed = JSON.parse(data)
            if (eventType === 'agents_selected') {
              setActiveAgents(parsed.agents || [])
            } else if (eventType === 'agent_complete') {
              setCompletedAgents(prev => [...prev, parsed.agent])
            } else if (eventType === 'synthesis') {
              // handled in done
            } else if (eventType === 'done') {
              const fullRes = await api.post<ExecutionResult>('/agents/execute', {
                query,
                agents: autoSelect ? undefined : selectedAgents,
              })
              setResult(fullRes)
              setActiveAgents([])
            } else if (eventType === 'error') {
              console.error('Agent error:', parsed.message)
            }
          } catch {}
        }
      }
    } catch {
      try {
        const res = await api.post<ExecutionResult>('/agents/execute', {
          query,
          agents: autoSelect ? undefined : selectedAgents,
        })
        setResult(res)
      } catch (err: any) {
        console.error('Agent execution failed:', err)
      }
    }

    setExecuting(false)
    setActiveAgents([])
    setCompletedAgents([])
  }

  const agentForDisplay = SPECIALIST_AGENTS.find(a => a.id === expandedAgent)

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <MeshGradient />
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            ⚡ Supreme Multi-Agent Mode
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deploy multiple specialist agents in parallel. All results synthesized by OneFounder Supreme.
          </p>
        </div>
        {isWebGLAvailable() && !isMobile() && (
          <button
            onClick={() => setView3D(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view3D
                ? 'bg-brand-600/20 border border-brand-500/30 text-brand-300'
                : 'border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            <span>{view3D ? '🌐' : '📋'}</span>
            {view3D ? '3D View' : 'Grid View'}
          </button>
        )}
      </div>

      {/* 3D Agent Collaboration View */}
      {view3D && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-white/[0.06]" style={{ height: 500 }}>
          <LazyAgentCollab
            activeAgents={activeAgents}
            completedAgents={completedAgents}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Agent selector + Input */}
        <div className="lg:col-span-1 space-y-4">
          {/* Agent Selection Mode */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Selection</h3>
              <button
                onClick={() => setAutoSelect(v => !v)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  autoSelect
                    ? 'bg-brand-600/20 border-brand-500/30 text-brand-300'
                    : 'border-white/10 text-slate-500'
                }`}
              >
                {autoSelect ? '⚡ Auto' : '🎯 Manual'}
              </button>
            </div>
            {autoSelect ? (
              <p className="text-xs text-slate-500">Supervisor automatically selects the best agents for your query.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {SPECIALIST_AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all text-xs ${
                      selectedAgents.includes(agent.id)
                        ? 'bg-brand-600/15 border border-brand-500/20 text-white'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/3 border border-transparent'
                    }`}
                  >
                    <span className="flex-shrink-0">{agent.icon}</span>
                    <span className="truncate font-medium">{agent.name}</span>
                    {selectedAgents.includes(agent.id) && (
                      <span className="ml-auto text-brand-400 flex-shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Agents Status */}
          {(executing || result) && (
            <div className="glass rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {executing ? 'Executing...' : 'Completed'}
              </h3>
              <div className="space-y-1.5">
                {(result?.agentsUsed || activeAgents).map(agentId => {
                  const agent = SPECIALIST_AGENTS.find(a => a.id === agentId)
                  const isComplete = completedAgents.includes(agentId) || !!result
                  const agentResult = result?.agentResults.find(r => r.agent === agentId)
                  return (
                    <div key={agentId} className="flex items-center gap-2">
                      <span className="text-sm">{agent?.icon || '🤖'}</span>
                      <span className="text-xs text-slate-400 flex-1 truncate">{agent?.name || agentId}</span>
                      {isComplete ? (
                        <span className="text-xs text-green-400 flex-shrink-0">
                          ✓ {agentResult ? `${(agentResult.executionTimeMs / 1000).toFixed(1)}s` : ''}
                        </span>
                      ) : (
                        <span className="w-3 h-3 border border-brand-500/50 border-t-brand-500 rounded-full animate-spin flex-shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
              {result && (
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-600">
                  {result.agentsUsed.length} agents · {(result.totalTimeMs / 1000).toFixed(1)}s total
                  {result.memoryUsed && ' · 🧠 memory'}
                  {result.ragUsed && ' · 📚 knowledge'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Query + Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-4">
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) execute() }}
              placeholder="Ask OneFounder Supreme anything. The supervisor will deploy the right specialist agents in parallel..."
              rows={4}
              className="w-full bg-transparent text-sm text-white placeholder-slate-600 resize-none outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-slate-600">⌘+Enter to execute</span>
              <button
                onClick={execute}
                disabled={executing || !query.trim()}
                className="btn-primary text-sm px-5 py-2 flex items-center gap-2"
              >
                {executing ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                    Orchestrating...
                  </>
                ) : (
                  <>⚡ Execute Supreme</>
                )}
              </button>
            </div>
          </div>

          {/* Example queries */}
          {!result && !executing && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 uppercase tracking-wider">Example Queries</p>
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(q)}
                  className="w-full text-left text-xs p-3 rounded-xl glass text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Synthesis Result */}
          {result && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border border-brand-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-brand-600/30 flex items-center justify-center text-xs">⚡</div>
                  <span className="text-sm font-semibold text-white">OneFounder Supreme Synthesis</span>
                  <span className="text-xs text-slate-600 ml-auto">
                    {result.agentsUsed.length} agents · {(result.totalTimeMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="text-sm text-slate-200 leading-relaxed">
                  {renderMarkdown(result.synthesis)}
                </div>
              </div>

              {/* Individual Agent Results */}
              <div className="space-y-2">
                <p className="text-xs text-slate-600 uppercase tracking-wider">Individual Agent Reports</p>
                {result.agentResults.map(ar => {
                  const agent = SPECIALIST_AGENTS.find(a => a.id === ar.agent)
                  const isExpanded = expandedAgent === ar.agent
                  return (
                    <div key={ar.agent} className="glass rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedAgent(isExpanded ? null : ar.agent)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/3 transition-all"
                      >
                        <span className="text-sm">{agent?.icon || '🤖'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${agent?.color || ''}`}>
                          {agent?.name || ar.agent}
                        </span>
                        <span className="text-xs text-slate-600 ml-auto">
                          {(ar.executionTimeMs / 1000).toFixed(1)}s
                        </span>
                        <svg className={`w-3 h-3 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                          {renderMarkdown(ar.response)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Agents Grid */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Specialist Corps</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SPECIALIST_AGENTS.map(agent => (
            <div key={agent.id} className="glass rounded-xl p-4 hover:border-white/10 border border-transparent transition-all">
              <div className="text-2xl mb-2">{agent.icon}</div>
              <div className={`text-xs font-semibold mb-1 ${agent.color.split(' ')[0]}`}>{agent.name}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{agent.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
