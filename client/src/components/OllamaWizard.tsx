import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

interface OllamaHealth {
  running: boolean
  baseUrl: string
  models: string[]
  totalRamGb: number
  freeRamGb: number
  ramWarning: string | null
  recommended: Array<{ id: string; label: string; ram: string; desc: string; default?: boolean }>
}

interface OllamaWizardProps {
  onDismiss: () => void
}

type Step = 'check' | 'install' | 'models' | 'pull' | 'test' | 'done'

export function OllamaWizard({ onDismiss }: OllamaWizardProps) {
  const [step, setStep] = useState<Step>('check')
  const [health, setHealth] = useState<OllamaHealth | null>(null)
  const [checking, setChecking] = useState(false)
  const [selectedModel, setSelectedModel] = useState('qwen3:8b')
  const [pullLog, setPullLog] = useState<string[]>([])
  const [pullPct, setPullPct] = useState(0)
  const [pulling, setPulling] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; response?: string; latencyMs?: number; error?: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const pullLogRef = useRef<HTMLDivElement>(null)

  const checkHealth = async () => {
    setChecking(true)
    try {
      const h = await api.get<OllamaHealth>('/ollama/health')
      setHealth(h)
      if (h.running && h.models.length > 0) {
        setStep('test')
      } else if (h.running) {
        setStep('models')
      } else {
        setStep('install')
      }
    } catch {
      setStep('install')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => { checkHealth() }, [])

  useEffect(() => {
    if (pullLogRef.current) pullLogRef.current.scrollTop = pullLogRef.current.scrollHeight
  }, [pullLog])

  const pullModel = async () => {
    setPulling(true)
    setPullLog([`Starting pull: ${selectedModel}...`])
    setPullPct(0)

    try {
      const res = await fetch(`/api/ollama/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model: selectedModel }),
      })
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() || ''
        for (const block of lines) {
          const dataLine = block.replace(/^data: /, '').trim()
          if (!dataLine) continue
          try {
            const obj = JSON.parse(dataLine)
            if (obj.pct !== undefined) setPullPct(obj.pct)
            if (obj.message) {
              setPullLog(prev => {
                const next = [...prev]
                if (obj.status === 'progress') {
                  next[next.length - 1] = `${obj.message} — ${obj.pct}%`
                } else {
                  next.push(obj.message)
                }
                return next
              })
            }
            if (obj.status === 'done') {
              setPullPct(100)
              await checkHealth()
              setStep('test')
            }
            if (obj.status === 'error') {
              setPullLog(prev => [...prev, `Error: ${obj.message}`])
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setPullLog(prev => [...prev, `Failed: ${err.message}`])
    } finally {
      setPulling(false)
    }
  }

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const model = health?.models[0] || selectedModel
      const result = await api.post<any>('/ollama/test', { model })
      setTestResult(result)
      if (result.success) setTimeout(() => setStep('done'), 1200)
    } catch (err: any) {
      setTestResult({ success: false, error: err.message })
    } finally {
      setTesting(false)
    }
  }

  const STEPS: Step[] = ['check', 'install', 'models', 'pull', 'test', 'done']
  const visibleSteps: Step[] = ['install', 'models', 'pull', 'test', 'done']
  const stepIdx = visibleSteps.indexOf(step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0d1424] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center text-lg">🦙</div>
              <div>
                <h2 className="text-sm font-semibold text-white">Ollama Setup</h2>
                <p className="text-xs text-slate-500">Local AI — zero cost, zero cloud</p>
              </div>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-400 transition-colors text-lg leading-none">✕</button>
          </div>

          {/* Step indicator */}
          {step !== 'check' && (
            <div className="flex items-center gap-1.5 mt-4">
              {visibleSteps.slice(0, -1).map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    visibleSteps.indexOf(step) > i
                      ? 'bg-brand-500 text-white'
                      : visibleSteps.indexOf(step) === i
                        ? 'bg-brand-600/30 border border-brand-500/40 text-brand-400'
                        : 'bg-white/5 text-slate-400'
                  }`}>
                    {visibleSteps.indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  {i < visibleSteps.length - 2 && <div className={`h-px w-6 ${visibleSteps.indexOf(step) > i ? 'bg-brand-500/50' : 'bg-white/5'}`} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5">

          {/* Checking */}
          {step === 'check' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-12 h-12 rounded-xl bg-brand-600/15 flex items-center justify-center animate-pulse text-2xl">🦙</div>
              <p className="text-sm text-slate-400">Checking Ollama connection...</p>
            </div>
          )}

          {/* Install step */}
          {step === 'install' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white mb-1">Ollama is not running</p>
                <p className="text-xs text-slate-500">Ollama runs AI models locally on your machine. Free forever, no API keys, no cloud.</p>
              </div>

              {health?.ramWarning && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                  <span className="text-yellow-400 text-sm flex-shrink-0">⚠</span>
                  <p className="text-xs text-yellow-300/80">{health.ramWarning}</p>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <p className="text-xs font-semibold text-white">Step 1 — Install Ollama</p>
                  <a href="https://ollama.ai" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    → Download from ollama.ai
                  </a>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <p className="text-xs font-semibold text-white">Step 2 — Start Ollama</p>
                  <code className="block text-xs font-mono text-slate-300 bg-black/30 px-3 py-2 rounded-lg">ollama serve</code>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <p className="text-xs font-semibold text-white">Step 3 — Pull a model</p>
                  <code className="block text-xs font-mono text-slate-300 bg-black/30 px-3 py-2 rounded-lg">ollama pull qwen3:8b</code>
                  <p className="text-xs text-slate-400">~5 GB download. Also: deepseek-r1:7b · mistral:7b · llama3.2:3b</p>
                </div>
              </div>

              <button
                onClick={checkHealth}
                disabled={checking}
                className="w-full py-2.5 rounded-xl bg-brand-600/15 border border-brand-500/20 text-brand-400 text-sm hover:bg-brand-600/25 transition-all disabled:opacity-50"
              >
                {checking ? 'Checking...' : '↻ Check again'}
              </button>

              <div className="pt-2 border-t border-white/[0.04]">
                <button
                  onClick={onDismiss}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Models step — Ollama running but no models */}
          {step === 'models' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-sm font-medium text-white">Ollama is running</p>
                </div>
                <p className="text-xs text-slate-500">No models installed yet. Pick one to download:</p>
              </div>

              {health?.ramWarning && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                  <span className="text-yellow-400 text-sm flex-shrink-0">⚠</span>
                  <p className="text-xs text-yellow-300/80">{health.ramWarning}</p>
                </div>
              )}

              <div className="space-y-1.5">
                {(health?.recommended || []).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedModel === m.id
                        ? 'border-brand-500/40 bg-brand-600/10'
                        : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-white">{m.label}</span>
                        {m.default && <span className="ml-2 text-xs text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-full">recommended</span>}
                        <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{m.ram} RAM</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('pull')}
                className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-500 transition-all"
              >
                Download {selectedModel} →
              </button>
            </div>
          )}

          {/* Pull step */}
          {step === 'pull' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white mb-1">Downloading {selectedModel}</p>
                <p className="text-xs text-slate-500">This may take a few minutes depending on your connection.</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{pullPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-300"
                    style={{ width: `${pullPct}%` }}
                  />
                </div>
              </div>

              {/* Log */}
              <div ref={pullLogRef} className="h-32 overflow-y-auto bg-black/30 rounded-xl p-3 font-mono text-xs text-slate-500 space-y-0.5">
                {pullLog.map((line, i) => <div key={i}>{line}</div>)}
                {pullLog.length === 0 && <div className="text-slate-400">Waiting...</div>}
              </div>

              {!pulling && pullLog.length === 0 && (
                <button
                  onClick={pullModel}
                  className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-500 transition-all"
                >
                  Start download
                </button>
              )}
              {pulling && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  <span className="text-xs text-slate-500">Downloading...</span>
                </div>
              )}
            </div>
          )}

          {/* Test step */}
          {step === 'test' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-sm font-medium text-white">Ollama ready</p>
                </div>
                <p className="text-xs text-slate-500">
                  {health?.models.length} model{health?.models.length !== 1 ? 's' : ''} installed:
                  {' '}<span className="text-slate-400">{health?.models.slice(0, 3).join(', ')}</span>
                </p>
              </div>

              {health?.models && health.models.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {health.models.map(m => (
                    <span key={m} className="text-xs bg-white/[0.04] border border-white/[0.06] text-slate-400 px-2 py-1 rounded-lg font-mono">{m}</span>
                  ))}
                </div>
              )}

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  testResult.success
                    ? 'bg-green-500/5 border-green-500/15 text-green-300'
                    : 'bg-red-500/5 border-red-500/15 text-red-300'
                }`}>
                  {testResult.success
                    ? `✓ ${testResult.response} (${testResult.latencyMs}ms)`
                    : `✗ ${testResult.error}`
                  }
                </div>
              )}

              <button
                onClick={runTest}
                disabled={testing}
                className="w-full py-2.5 rounded-xl bg-brand-600/15 border border-brand-500/20 text-brand-400 text-sm hover:bg-brand-600/25 transition-all disabled:opacity-50"
              >
                {testing ? 'Testing inference...' : 'Run inference test'}
              </button>

              <button
                onClick={onDismiss}
                className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-500 transition-all"
              >
                Start using OneFounder →
              </button>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center text-3xl">✓</div>
              <div>
                <p className="text-sm font-semibold text-white">AI is online</p>
                <p className="text-xs text-slate-500 mt-1">Ollama connected · Local inference · ₹0/month</p>
              </div>
              <button
                onClick={onDismiss}
                className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-500 transition-all"
              >
                Let's build →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'check' && step !== 'done' && (
          <div className="px-6 pb-4 flex justify-between items-center">
            <p className="text-xs text-slate-400">
              {health?.totalRamGb && `${health.totalRamGb} GB RAM`}
            </p>
            <button onClick={onDismiss} className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
