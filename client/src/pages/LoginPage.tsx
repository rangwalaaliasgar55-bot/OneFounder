import { useState } from 'react'
import { authApi } from '../lib/api'

interface LoginPageProps {
  onSuccess: () => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await authApi.signIn(email, password)
        if (res.error) throw new Error(res.error.message || 'Login failed')
      } else {
        const res = await authApi.signUp(name, email, password)
        if (res.error) throw new Error(res.error.message || 'Signup failed')
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-brand-950 via-surface-950 to-surface-900 border-r border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-xl">🚀</div>
          <span className="text-xl font-bold text-white">OneFounder</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight">
              The Operating System<br />
              <span className="gradient-text">for Founders</span>
            </h1>
            <p className="mt-4 text-slate-400 text-lg max-w-md">
              Discover, validate, build, and grow your business — all from one platform, powered by free AI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '💡', label: 'Startup Ideas', desc: 'AI-generated business opportunities' },
              { icon: '📊', label: 'Market Research', desc: 'Competitor & trend analysis' },
              { icon: '📝', label: 'Business Planner', desc: 'Full business plan generation' },
              { icon: '🤖', label: 'AI Agents', desc: 'CEO, Marketing, Sales agents' },
              { icon: '📢', label: 'Content Studio', desc: 'Blogs, LinkedIn, newsletters' },
              { icon: '💼', label: 'CRM', desc: 'Leads & customer management' },
            ].map(item => (
              <div key={item.label} className="glass rounded-xl p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-slate-600 text-sm">
          © 2025 OneFounder. Powered by Ollama, Neon, Better Auth.
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-xl">🚀</div>
            <span className="text-xl font-bold text-white">OneFounder</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-400 mt-1">
              {mode === 'login' ? 'Sign in to your founder workspace' : 'Start building your business today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Full name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button className="btn-primary w-full justify-center py-3" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-brand-400 hover:text-brand-300 font-medium">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-brand-400 hover:text-brand-300 font-medium">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
