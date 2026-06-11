import { useState } from 'react'

const INDUSTRIES = [
  'SaaS / Software', 'E-commerce', 'Fintech', 'Healthtech', 'Edtech',
  'Marketplace', 'B2B Services', 'Consumer App', 'AI / ML', 'Hardware', 'Other',
]
const STAGES = ['Just an idea', 'Building MVP', 'Beta / Early users', 'Revenue', 'Scaling', 'Profitable']
const GOALS = [
  '🚀 Launch my product fast',
  '💰 Get first paying customers',
  '📈 Grow to $10K MRR',
  '🤝 Raise funding',
  '🌍 Scale internationally',
  '🏆 Build a team',
]

interface Props {
  onComplete: (data: OnboardingData) => void
}

export interface OnboardingData {
  name: string
  company: string
  industry: string
  stage: string
  goals: string[]
}

const STEPS = ['Welcome', 'Company', 'Stage & Goals', 'Done']

export function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    name: '', company: '', industry: 'SaaS / Software', stage: 'Just an idea', goals: [],
  })

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else onComplete(data)
  }

  const toggleGoal = (g: string) => {
    setData(d => ({
      ...d,
      goals: d.goals.includes(g) ? d.goals.filter(x => x !== g) : [...d.goals, g],
    }))
  }

  const canAdvance = () => {
    if (step === 0) return data.name.trim().length > 0
    if (step === 1) return data.company.trim().length > 0
    if (step === 2) return data.goals.length > 0
    return true
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] shadow-2xl shadow-black/80 overflow-hidden animate-slide-up"
        style={{ background: 'rgba(8,13,26,0.98)', backdropFilter: 'blur(32px)' }}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i < step ? 'bg-brand-500 text-white' :
                  i === step ? 'bg-brand-600/50 border border-brand-500 text-brand-300' :
                  'bg-white/[0.05] text-slate-600'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-8 transition-all ${i < step ? 'bg-brand-500' : 'bg-white/[0.06]'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="text-5xl mb-4">🚀</div>
                <h1 className="text-2xl font-bold text-white">Welcome to OneFounder</h1>
                <p className="text-sm text-slate-400">Your AI-powered OS for building a company. Let's set up your workspace in 30 seconds.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-medium">Your name</label>
                <input
                  autoFocus
                  className="input w-full text-base"
                  placeholder="e.g. Alex"
                  value={data.name}
                  onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && canAdvance() && next()}
                />
              </div>
            </div>
          )}

          {/* Step 1 — Company */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Tell us about your startup</h2>
                <p className="text-sm text-slate-500">This helps the AI give you relevant, specific advice.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-medium">Company / Idea name</label>
                  <input
                    autoFocus
                    className="input w-full"
                    placeholder="e.g. OneFounder, TechFlow, MyApp"
                    value={data.company}
                    onChange={e => setData(d => ({ ...d, company: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && canAdvance() && next()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-medium">Industry</label>
                  <select
                    className="input w-full"
                    value={data.industry}
                    onChange={e => setData(d => ({ ...d, industry: e.target.value }))}
                  >
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Stage & Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Where are you and what do you want?</h2>
                <p className="text-sm text-slate-500">Select all goals that apply — the AI will prioritise accordingly.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-medium">Current stage</label>
                  <div className="grid grid-cols-3 gap-2">
                    {STAGES.map(s => (
                      <button
                        key={s}
                        onClick={() => setData(d => ({ ...d, stage: s }))}
                        className={`px-2 py-2 rounded-lg border text-xs transition-all text-center ${
                          data.stage === s
                            ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                            : 'border-white/[0.06] bg-white/[0.03] text-slate-500 hover:border-white/10 hover:text-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-medium">Top goals (pick 1–3)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map(g => (
                      <button
                        key={g}
                        onClick={() => toggleGoal(g)}
                        className={`px-3 py-2 rounded-lg border text-xs transition-all text-left ${
                          data.goals.includes(g)
                            ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                            : 'border-white/[0.06] bg-white/[0.03] text-slate-500 hover:border-white/10 hover:text-slate-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Done */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="text-5xl animate-bounce">🎉</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">You're all set, {data.name}!</h2>
                <p className="text-sm text-slate-400">
                  Your workspace is personalised for <span className="text-white font-medium">{data.company}</span> in {data.stage.toLowerCase()}.
                  The AI will give you founder-specific advice from day one.
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-left space-y-2">
                <p className="text-xs text-slate-500 font-medium">Pro tips to get started:</p>
                <ul className="space-y-1.5">
                  {[
                    'Press ⌘K to quickly navigate anywhere',
                    'Use the 🤖 button (bottom-left) for instant AI advice',
                    'Start with Idea Lab or Market Research to validate your idea',
                  ].map(tip => (
                    <li key={tip} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-brand-400 mt-0.5">→</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              className={`btn-ghost text-sm py-2 px-4 ${step === 0 ? 'invisible' : ''}`}
            >
              ← Back
            </button>
            <button
              onClick={next}
              disabled={!canAdvance()}
              className="btn-primary text-sm py-2 px-6 gap-2 disabled:opacity-40"
            >
              {step === STEPS.length - 1 ? 'Launch my workspace 🚀' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
