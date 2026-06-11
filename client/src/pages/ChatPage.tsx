import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../lib/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { v4 as uuidv4 } from 'uuid'

const FOUNDER_AGENTS = [
  { id: 'founder', icon: '🧠', name: 'Founder AI', desc: 'Auto-routes to the right expert' },
  { id: 'ceo', icon: '👔', name: 'CEO Agent', desc: 'Business strategy & decisions' },
  { id: 'marketing', icon: '📣', name: 'Marketing Agent', desc: 'Growth & content strategy' },
  { id: 'seo', icon: '🔍', name: 'SEO Agent', desc: 'Search optimization' },
  { id: 'sales', icon: '💰', name: 'Sales Agent', desc: 'Lead generation & closing' },
  { id: 'research', icon: '🔬', name: 'Research Agent', desc: 'Market & competitor analysis' },
  { id: 'operations', icon: '⚙️', name: 'Operations Agent', desc: 'Workflow optimization' },
  { id: 'product', icon: '🛠️', name: 'Product Agent', desc: 'Product planning & strategy' },
]

const EXPERT_AGENTS = [
  { id: 'code', icon: '💻', name: 'Code Expert', desc: 'Debug, build & optimize code' },
  { id: 'seo', icon: '📈', name: 'SEO Expert', desc: 'Keyword research & rankings' },
  { id: 'data', icon: '📊', name: 'Data Analyst', desc: 'SQL, charts & business insights' },
  { id: 'security', icon: '🔒', name: 'Security Expert', desc: 'Vulnerability detection & secure code' },
  { id: 'research', icon: '🔬', name: 'Research Expert', desc: 'Deep market & competitive research' },
  { id: 'startup', icon: '🚀', name: 'Startup Advisor', desc: 'Strategy, growth & fundraising' },
]

const MODE_COLORS: Record<string, string> = {
  code: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  seo: 'text-green-400 bg-green-500/10 border-green-500/20',
  security: 'text-red-400 bg-red-500/10 border-red-500/20',
  data: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  research: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  startup: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  founder: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
}

const SUGGESTIONS: Record<string, string[]> = {
  founder: ['What should I build with $10k budget?', 'How do I validate my startup idea?', 'What are the biggest mistakes first-time founders make?'],
  ceo: ['Create a 90-day plan to hit $10k MRR', 'What KPIs should I track?', 'How should I prioritize features vs growth?'],
  marketing: ['Build me a content marketing strategy', 'How do I grow to 1000 users?', 'What channels work best for B2B SaaS?'],
  seo: ['How do I rank for competitive keywords?', 'Build me an SEO content plan', 'What are the most important technical SEO fixes?'],
  sales: ['Write me a cold email sequence', 'How do I close enterprise deals?', 'Build a lead generation strategy'],
  research: ['Analyze the AI writing tools market', 'Who are the top competitors in no-code?', 'What are the biggest market opportunities in 2026?'],
  operations: ['How do I automate my business operations?', 'Build me a client onboarding workflow', 'What tools should I use for operations?'],
  product: ['Help me prioritize my product roadmap', 'Write user stories for a SaaS MVP', 'How do I get product-market fit?'],
  code: ['Debug this Python error: IndexError: list index out of range', 'Build a REST API with Express and TypeScript', 'How do I optimize a slow SQL query?'],
  data: ['Write SQL to find top 10 customers by revenue', 'What chart should I use to show trends over time?', 'Explain cohort analysis with an example'],
  security: ['Review this login code for security issues', 'What are the OWASP Top 10 vulnerabilities?', 'How do I prevent SQL injection in Node.js?'],
  startup: ['How do I raise a pre-seed round?', 'What makes a great pitch deck?', 'How do I find product-market fit?'],
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode?: string
  modeLabel?: string
  webSearchUsed?: boolean
  streaming?: boolean
  createdAt?: string
}

function renderContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/)
      const lang = match?.[1] || ''
      const code = match?.[2] || part.replace(/```\w*\n?/, '').replace(/```$/, '')
      return (
        <div key={i} className="my-3 rounded-xl overflow-hidden border border-white/10">
          {lang && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wide">{lang}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Copy
              </button>
            </div>
          )}
          <pre className="p-4 text-xs overflow-x-auto bg-black/40 text-green-300 font-mono leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      )
    }
    const formatted = part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
    return (
      <span
        key={i}
        className="whitespace-pre-wrap leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    )
  })
}

export function ChatPage() {
  const [agentMode, setAgentMode] = useState<'founder' | 'expert'>('founder')
  const [selectedId, setSelectedId] = useState('founder')
  const [sessionId, setSessionId] = useState(() => uuidv4())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<(() => void) | null>(null)

  const currentAgents = agentMode === 'founder' ? FOUNDER_AGENTS : EXPERT_AGENTS
  const currentAgent = currentAgents.find(a => a.id === selectedId) || currentAgents[0]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const switchAgent = (id: string, mode: 'founder' | 'expert') => {
    setAgentMode(mode)
    setSelectedId(id)
    setSessionId(uuidv4())
    setMessages([])
    setActiveMode(null)
  }

  const send = useCallback(async () => {
    if (!input.trim() || sending) return
    const userMsg: Message = { id: uuidv4(), role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    const userInput = input
    setInput('')
    setSending(true)
    setActiveMode(null)

    const streamingMsgId = uuidv4()
    setMessages(prev => [...prev, {
      id: streamingMsgId,
      role: 'assistant',
      content: '',
      streaming: true,
    }])

    let didStream = false
    let aborted = false

    try {
      const agentTypeForRoute = agentMode === 'expert' ? selectedId : (selectedId === 'founder' ? undefined : selectedId)

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userInput,
          sessionId,
          agentType: agentTypeForRoute,
        }),
      })

      if (!response.ok || !response.body) throw new Error('Stream unavailable')

      abortRef.current = () => { aborted = true }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalMeta: any = null

      while (!aborted) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) continue
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)

          const prevLine = lines[lines.indexOf(line) - 1] || ''
          const eventType = prevLine.startsWith('event: ') ? prevLine.slice(7).trim() : 'token'

          if (eventType === 'mode') {
            try {
              const meta = JSON.parse(data)
              setActiveMode(meta.mode)
              setMessages(prev => prev.map(m =>
                m.id === streamingMsgId
                  ? { ...m, mode: meta.mode, modeLabel: meta.modeLabel }
                  : m
              ))
            } catch {}
          } else if (eventType === 'token') {
            didStream = true
            setMessages(prev => prev.map(m =>
              m.id === streamingMsgId
                ? { ...m, content: m.content + data }
                : m
            ))
          } else if (eventType === 'done') {
            try {
              finalMeta = JSON.parse(data)
              setMessages(prev => prev.map(m =>
                m.id === streamingMsgId
                  ? {
                      ...m,
                      streaming: false,
                      mode: finalMeta.mode,
                      modeLabel: finalMeta.modeLabel,
                      webSearchUsed: finalMeta.webSearchUsed,
                    }
                  : m
              ))
              setActiveMode(finalMeta.mode)
            } catch {}
          } else if (eventType === 'error') {
            setMessages(prev => prev.map(m =>
              m.id === streamingMsgId
                ? { ...m, content: `❌ ${data}`, streaming: false }
                : m
            ))
          }
        }
      }

      if (!didStream && !aborted) throw new Error('No content received')

    } catch {
      if (!aborted) {
        try {
          const agentTypeForRoute = agentMode === 'expert' ? selectedId : (selectedId === 'founder' ? undefined : selectedId)
          const res: any = await api.post('/chat/send', {
            message: userInput,
            sessionId,
            agentType: agentTypeForRoute,
          })
          setMessages(prev => prev.map(m =>
            m.id === streamingMsgId
              ? {
                  ...m,
                  content: res.message?.content || res.response || 'No response',
                  streaming: false,
                  mode: res.mode,
                  modeLabel: res.modeLabel,
                  webSearchUsed: res.webSearchUsed,
                }
              : m
          ))
          if (res.mode) setActiveMode(res.mode)
        } catch (fallbackErr: any) {
          setMessages(prev => prev.map(m =>
            m.id === streamingMsgId
              ? { ...m, content: `❌ Error: ${fallbackErr.message}`, streaming: false }
              : m
          ))
        }
      }
    } finally {
      setSending(false)
      abortRef.current = null
    }
  }, [input, sending, agentMode, selectedId, sessionId])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const suggestKey = agentMode === 'expert' ? selectedId : selectedId

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-white/5 bg-surface-900/30 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <div className="flex rounded-lg overflow-hidden bg-white/5 p-0.5">
            <button
              onClick={() => { setAgentMode('founder'); setSelectedId('founder'); setSessionId(uuidv4()); setMessages([]) }}
              className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${agentMode === 'founder' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              🚀 Founder
            </button>
            <button
              onClick={() => { setAgentMode('expert'); setSelectedId('code'); setSessionId(uuidv4()); setMessages([]) }}
              className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${agentMode === 'expert' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              🧠 Expert
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <p className="text-xs text-slate-600 px-2 pt-2 pb-1 uppercase tracking-wider font-medium">
            {agentMode === 'founder' ? 'Business Agents' : 'Expert Modes'}
          </p>
          {currentAgents.map(a => (
            <button
              key={a.id}
              onClick={() => switchAgent(a.id, agentMode)}
              className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all duration-200 ${
                selectedId === a.id
                  ? 'bg-brand-600/20 border border-brand-500/20 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-base flex-shrink-0">{a.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{a.name}</div>
                <div className="text-xs text-slate-600 truncate leading-tight">{a.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => { setSessionId(uuidv4()); setMessages([]); setActiveMode(null) }}
            className="btn-ghost w-full justify-center text-xs py-2"
          >
            ✨ New Chat
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-surface-900/20">
          <span className="text-xl">{currentAgent.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white">{currentAgent.name}</h2>
            <p className="text-xs text-slate-500 truncate">{currentAgent.desc}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeMode && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${MODE_COLORS[activeMode] || MODE_COLORS.founder}`}>
                {activeMode === 'code' ? '💻 Code' :
                 activeMode === 'seo' ? '🔍 SEO' :
                 activeMode === 'security' ? '🔒 Security' :
                 activeMode === 'data' ? '📊 Data' :
                 activeMode === 'research' ? '🔬 Research' :
                 activeMode === 'startup' ? '🚀 Startup' : '🧠 AI Brain'}
              </span>
            )}
            {selectedId === 'founder' && agentMode === 'founder' && (
              <span className="text-xs text-slate-600 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                Auto-routes
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <div className="text-5xl mb-3">{currentAgent.icon}</div>
                <h3 className="text-base font-semibold text-white mb-1">{currentAgent.name}</h3>
                <p className="text-slate-400 text-sm max-w-xs">{currentAgent.desc}</p>
                {selectedId === 'founder' && agentMode === 'founder' && (
                  <p className="text-xs text-slate-600 mt-2 max-w-xs">
                    Automatically detects if you need code help, SEO advice, security review, data analysis, or startup strategy
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-xl w-full">
                {(SUGGESTIONS[suggestKey] || SUGGESTIONS.founder).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="glass rounded-xl p-3 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all text-left leading-relaxed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-brand-600/30 flex items-center justify-center text-xs flex-shrink-0 mt-1">
                  {currentAgent.icon}
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[82%]">
                {msg.role === 'assistant' && msg.modeLabel && (
                  <span className={`self-start text-xs px-2 py-0.5 rounded-full border font-medium ${MODE_COLORS[msg.mode || 'founder'] || MODE_COLORS.founder}`}>
                    {msg.modeLabel}
                    {msg.webSearchUsed && <span className="ml-1 opacity-70">· 🌐 web</span>}
                  </span>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'glass text-slate-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    msg.streaming && !msg.content ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="text-xs text-slate-500">Thinking...</span>
                      </div>
                    ) : (
                      <>{renderContent(msg.content)}{msg.streaming && <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse align-middle" />}</>
                    )
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs flex-shrink-0 mt-1">👤</div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-surface-900/20">
          <div className="flex gap-2">
            <textarea
              className="input flex-1 resize-none py-3 text-sm leading-6 min-h-[48px] max-h-32"
              placeholder={`Message ${currentAgent.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              onClick={sending ? () => { abortRef.current?.() } : send}
              disabled={!input.trim() && !sending}
              className={`px-4 flex-shrink-0 self-end rounded-xl font-medium transition-all h-10 ${
                sending
                  ? 'bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-600/30'
                  : 'btn-primary'
              }`}
            >
              {sending ? '■' : '↑'}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-600">Enter to send · Shift+Enter for new line</p>
            {activeMode && (
              <p className="text-xs text-slate-600">
                Routed to: <span className="text-slate-400">{activeMode}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
