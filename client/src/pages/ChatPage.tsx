import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { v4 as uuidv4 } from 'uuid'

const AGENTS = [
  { id: 'founder', icon: '🧠', name: 'Founder AI', desc: 'Your personal startup advisor' },
  { id: 'ceo', icon: '👔', name: 'CEO Agent', desc: 'Business strategy & decisions' },
  { id: 'marketing', icon: '📣', name: 'Marketing Agent', desc: 'Growth & content strategy' },
  { id: 'seo', icon: '🔍', name: 'SEO Agent', desc: 'Search optimization' },
  { id: 'sales', icon: '💰', name: 'Sales Agent', desc: 'Lead generation & closing' },
  { id: 'research', icon: '🔬', name: 'Research Agent', desc: 'Market & competitor analysis' },
  { id: 'operations', icon: '⚙️', name: 'Operations Agent', desc: 'Workflow optimization' },
  { id: 'product', icon: '🛠️', name: 'Product Agent', desc: 'Product planning & strategy' },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

export function ChatPage() {
  const [agent, setAgent] = useState(AGENTS[0])
  const [sessionId, setSessionId] = useState(() => uuidv4())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const newChat = () => {
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
      const res = await api.post<{ message: Message; sessionId: string }>('/chat/send', {
        message: input,
        sessionId,
        agentType: agent.id,
      })
      setMessages(prev => [...prev, { ...res.message, id: res.message.id || uuidv4() }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${err.message}`,
      }])
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const SUGGESTIONS: Record<string, string[]> = {
    founder: ['What should I build with $10k budget?', 'How do I validate my startup idea?', 'What are the biggest mistakes first-time founders make?'],
    ceo: ['Create a 90-day plan to hit $10k MRR', 'What KPIs should I track?', 'How should I prioritize features vs growth?'],
    marketing: ['Build me a content marketing strategy', 'How do I grow to 1000 users?', 'What channels work best for B2B SaaS?'],
    seo: ['How do I rank for competitive keywords?', 'Build me an SEO content plan', 'What are the most important technical SEO fixes?'],
    sales: ['Write me a cold email sequence', 'How do I close enterprise deals?', 'Build a lead generation strategy'],
    research: ['Analyze the AI writing tools market', 'Who are the top competitors in no-code?', 'What are the biggest market opportunities in 2025?'],
    operations: ['How do I automate my business operations?', 'Build me a workflow for onboarding clients', 'What tools should I use?'],
    product: ['Help me prioritize my product roadmap', 'Write user stories for a SaaS MVP', 'How do I get product-market fit?'],
  }

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      <div className="w-56 flex-shrink-0 border-r border-white/5 bg-surface-900/30 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">AI Agents</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {AGENTS.map(a => (
            <button
              key={a.id}
              onClick={() => { setAgent(a); newChat() }}
              className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all duration-200 ${agent.id === a.id ? 'bg-brand-600/20 border border-brand-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
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
          <button onClick={newChat} className="btn-ghost w-full justify-center text-xs">
            ✨ New Chat
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-surface-900/20">
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <h2 className="text-sm font-semibold text-white">{agent.name}</h2>
            <p className="text-xs text-slate-500">{agent.desc}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <div className="text-5xl mb-4">{agent.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-1">{agent.name}</h3>
                <p className="text-slate-400 text-sm">{agent.desc}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-xl w-full">
                {(SUGGESTIONS[agent.id] || SUGGESTIONS.founder).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); }}
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
                  {agent.icon}
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'glass text-slate-200 rounded-tl-sm'
              }`}>
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                  👤
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-sm flex-shrink-0">
                {agent.icon}
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
              className="input flex-1 resize-none h-12 py-3 leading-6"
              placeholder={`Message ${agent.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="btn-primary px-5 flex-shrink-0"
            >
              {sending ? <LoadingSpinner size="sm" /> : '↑'}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
