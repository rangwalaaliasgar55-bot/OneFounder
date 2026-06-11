import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  mode?: string
}

const QUICK_PROMPTS = [
  'What should I focus on today?',
  'Give me a growth hack for my startup',
  'What are the most common mistakes founders make?',
  'Help me write a cold email',
]

export function FloatingAI() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || streaming) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setStreaming(true)

    let assistantMsg = ''
    let modeLabel = '🧠 OneFounder AI'

    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      setMessages(prev => [...prev, { role: 'assistant', content: '', mode: modeLabel }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'mode') {
              const parsed = JSON.parse(data.data)
              modeLabel = parsed.modeLabel || modeLabel
              if (parsed.sessionId) setSessionId(parsed.sessionId)
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last?.role === 'assistant') last.mode = modeLabel
                return updated
              })
            } else if (data.type === 'token') {
              assistantMsg += data.data
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last?.role === 'assistant') last.content = assistantMsg
                return updated
              })
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, AI is unavailable right now. Make sure Ollama is running.' }])
    } finally {
      setStreaming(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 left-6 z-[90] w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center text-xl transition-all duration-200 ${
          open
            ? 'bg-slate-700 rotate-45 shadow-slate-900/60'
            : 'bg-gradient-to-br from-brand-500 to-violet-600 shadow-brand-900/50 hover:scale-105'
        }`}
        title="Quick AI chat"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat drawer */}
      {open && (
        <div
          className="fixed bottom-22 left-6 z-[90] w-80 rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
          style={{ background: 'rgba(8,13,26,0.97)', backdropFilter: 'blur(24px)', maxHeight: '70vh' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-sm">🤖</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white">AI Quick Chat</div>
              <div className="text-[10px] text-slate-600">Ask anything, get answers instantly</div>
            </div>
            <button
              onClick={() => { setMessages([]); setSessionId(undefined) }}
              className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors"
              title="Clear chat"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: '200px', maxHeight: '360px' }}>
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600 text-center py-2">Quick prompts to get started:</p>
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="w-full text-left text-[11px] text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-lg px-3 py-2 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex flex-col gap-1 max-w-[90%]">
                    {msg.mode && (
                      <span className="text-[9px] text-slate-600 px-1">{msg.mode}</span>
                    )}
                    <div className="bg-white/[0.05] border border-white/[0.06] rounded-xl rounded-tl-sm px-3 py-2 text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {msg.content || <span className="animate-pulse text-slate-600">●●●</span>}
                    </div>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="bg-brand-600/30 border border-brand-500/30 rounded-xl rounded-tr-sm px-3 py-2 text-[11px] text-brand-200 max-w-[90%] leading-relaxed">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask the AI…"
                disabled={streaming}
                className="flex-1 bg-transparent text-[12px] text-white placeholder-slate-700 outline-none"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="w-6 h-6 rounded-lg bg-brand-600 disabled:opacity-30 flex items-center justify-center text-white hover:bg-brand-500 transition-colors flex-shrink-0"
              >
                {streaming ? (
                  <span className="text-[8px] animate-spin">⟳</span>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[9px] text-slate-700 mt-1.5 text-center">Enter to send · Powered by Ollama</p>
          </div>
        </div>
      )}
    </>
  )
}
