import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { v4 as uuidv4 } from 'uuid'

const FOUNDER_AGENTS = [
  { id: 'founder', icon: '🧠', name: 'Founder AI', desc: 'Your personal startup advisor' },
  { id: 'ceo', icon: '👔', name: 'CEO Agent', desc: 'Business strategy & decisions' },
  { id: 'marketing', icon: '📣', name: 'Marketing Agent', desc: 'Growth & content strategy' },
  { id: 'seo', icon: '🔍', name: 'SEO Agent', desc: 'Search optimization' },
  { id: 'sales', icon: '💰', name: 'Sales Agent', desc: 'Lead generation & closing' },
  { id: 'research', icon: '🔬', name: 'Research Agent', desc: 'Market & competitor analysis' },
  { id: 'operations', icon: '⚙️', name: 'Operations Agent', desc: 'Workflow optimization' },
  { id: 'product', icon: '🛠️', name: 'Product Agent', desc: 'Product planning & strategy' },
]

const EXPERT_AGENTS = [
  { id: 'code', icon: '💻', name: 'Code Expert', desc: 'Debug, explain & optimize code', mode: 'expert' },
  { id: 'python', icon: '🐍', name: 'Python Expert', desc: 'Python from beginner to advanced', mode: 'expert' },
  { id: 'seo', icon: '📈', name: 'SEO Expert', desc: 'Keyword research & ranking strategy', mode: 'expert' },
  { id: 'data', icon: '📊', name: 'Data Analyst', desc: 'SQL, charts & business insights', mode: 'expert' },
  { id: 'security', icon: '🔐', name: 'Cybersecurity', desc: 'Vulnerability detection & secure code', mode: 'expert' },
  { id: 'product', icon: '📦', name: 'Product Manager', desc: 'Roadmaps, features & UX decisions', mode: 'expert' },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

type AgentMode = 'founder' | 'expert'

function renderContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/)
      const lang = match?.[1] || ''
      const code = match?.[2] || part.replace(/```\w*\n?/, '').replace(/```$/, '')
      return (
        <div key={i} className="my-2 rounded-lg overflow-hidden border border-white/10">
          {lang && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-400 font-mono">{lang}</span>
            </div>
          )}
          <pre className="p-3 text-xs overflow-x-auto bg-black/30 text-green-300 font-mono leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      )
    }
    return (
      <span key={i} className="whitespace-pre-wrap leading-relaxed">
        {part}
      </span>
    )
  })
}

const SUGGESTIONS: Record<string, string[]> = {
  founder: ['What should I build with $10k budget?', 'How do I validate my startup idea?', 'What are the biggest mistakes first-time founders make?'],
  ceo: ['Create a 90-day plan to hit $10k MRR', 'What KPIs should I track?', 'How should I prioritize features vs growth?'],
  marketing: ['Build me a content marketing strategy', 'How do I grow to 1000 users?', 'What channels work best for B2B SaaS?'],
  seo_founder: ['How do I rank for competitive keywords?', 'Build me an SEO content plan', 'What are the most important technical SEO fixes?'],
  sales: ['Write me a cold email sequence', 'How do I close enterprise deals?', 'Build a lead generation strategy'],
  research: ['Analyze the AI writing tools market', 'Who are the top competitors in no-code?', 'What are the biggest market opportunities in 2025?'],
  operations: ['How do I automate my business operations?', 'Build me a workflow for onboarding clients', 'What tools should I use?'],
  product_founder: ['Help me prioritize my product roadmap', 'Write user stories for a SaaS MVP', 'How do I get product-market fit?'],
  code: ['Debug this Python error: IndexError: list index out of range', 'Explain what async/await does in JavaScript', 'How do I optimize a slow SQL query?'],
  python: ['Write a script to scrape a website with requests', 'Explain list comprehensions with examples', 'How do I use pandas to clean CSV data?'],
  seo_expert: ['What is keyword cannibalization and how do I fix it?', 'How do I build a topical authority strategy?', 'Audit my page title: "Buy Shoes Online | Best Shoes 2025"'],
  data: ['Write SQL to find top 10 customers by revenue', 'What chart should I use to show trends over time?', 'Explain the difference between INNER JOIN and LEFT JOIN'],
  security: ['Review this login code for security issues', 'What are the OWASP Top 10 vulnerabilities?', 'How do I prevent SQL injection in Node.js?'],
  product: ['Prioritize these 5 features using RICE framework', 'Write a user story for a checkout flow', 'How do I define product-market fit metrics?'],
}

export function ChatPage() {
  const [agentMode, setAgentMode] = useState<AgentMode>('founder')
  const [selectedId, setSelectedId] = useState('founder')
  const [sessionId, setSessionId] = useState(() => uuidv4())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentAgents = agentMode === 'founder' ? FOUNDER_AGENTS : EXPERT_AGENTS
  const currentAgent = currentAgents.find(a => a.id === selectedId) || currentAgents[0]
  const suggestKey = agentMode === 'expert' ? selectedId : (selectedId === 'seo' ? 'seo_founder' : selectedId === 'product' ? 'product_founder' : selectedId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const switchAgent = (id: string, mode: AgentMode) => {
    setAgentMode(mode)
    setSelectedId(id)
    setSessionId(uuidv4())
    setMessages([])
  }

  const send = async () => {
    if (!input.trim() || sending) return
    const userMsg: Message = { id: uuidv4(), role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      let res: { message: Message; sessionId: string }
      if (agentMode === 'expert') {
        res = await api.post('/expert/chat', {
          message: input,
          sessionId,
          mode: selectedId,
        })
      } else {
        res = await api.post('/chat/send', {
          message: input,
          sessionId,
          agentType: selectedId,
        })
      }
      setMessages(prev => [...prev, { ...res.message, id: res.message.id || uuidv4() }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
      }])
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-white/5 bg-surface-900/30 flex flex-col">
        {/* Mode Toggle */}
        <div className="p-3 border-b border-white/5">
          <div className="flex rounded-lg overflow-hidden bg-white/5 p-0.5">
            <button
              onClick={() => { setAgentMode('founder'); setSelectedId('founder'); setSessionId(uuidv4()); setMessages([]) }}
              className={`flex-1 text-xs py-1.5 rounded-md transition-all ${agentMode === 'founder' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              🚀 Founder
            </button>
            <button
              onClick={() => { setAgentMode('expert'); setSelectedId('code'); setSessionId(uuidv4()); setMessages([]) }}
              className={`flex-1 text-xs py-1.5 rounded-md transition-all ${agentMode === 'expert' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              🧠 Expert
            </button>
          </div>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="text-xs text-slate-600 px-2 pt-1 pb-0.5 uppercase tracking-wider font-medium">
            {agentMode === 'founder' ? 'Business Agents' : 'Expert Modes'}
          </p>
          {currentAgents.map(a => (
            <button
              key={a.id}
              onClick={() => switchAgent(a.id, agentMode)}
              className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all duration-200 ${
                selectedId === a.id && agentMode === agentMode
                  ? 'bg-brand-600/20 border border-brand-500/20 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg flex-shrink-0">{a.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{a.name}</div>
                <div className="text-xs text-slate-600 truncate">{a.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => { setSessionId(uuidv4()); setMessages([]) }}
            className="btn-ghost w-full justify-center text-xs"
          >
            ✨ New Chat
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-surface-900/20">
          <span className="text-2xl">{currentAgent.icon}</span>
          <div>
            <h2 className="text-sm font-semibold text-white">{currentAgent.name}</h2>
            <p className="text-xs text-slate-500">{currentAgent.desc}</p>
          </div>
          {agentMode === 'expert' && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-brand-600/20 text-brand-400 border border-brand-500/20">
              Expert Mode
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <div className="text-5xl mb-4">{currentAgent.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-1">{currentAgent.name}</h3>
                <p className="text-slate-400 text-sm max-w-xs">{currentAgent.desc}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-xl w-full">
                {(SUGGESTIONS[suggestKey] || SUGGESTIONS.founder).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="glass rounded-xl p-3 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all text-left"
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
                <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                  {currentAgent.icon}
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'glass text-slate-200 rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' ? renderContent(msg.content) : <span className="whitespace-pre-wrap">{msg.content}</span>}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm flex-shrink-0 mt-1">👤</div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-sm flex-shrink-0">
                {currentAgent.icon}
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-slate-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-white/5 bg-surface-900/20">
          <div className="flex gap-3">
            <textarea
              className="input flex-1 resize-none py-3 leading-6"
              placeholder={`Message ${currentAgent.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="btn-primary px-5 flex-shrink-0 self-end"
            >
              {sending ? <LoadingSpinner size="sm" /> : '↑'}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
