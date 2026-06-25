import { useState, useEffect, useRef } from 'react'
import { authApi } from '../lib/api'
import { playSound } from '../lib/sounds'
import { AnimatedGradientText } from '../components/ui/AnimatedGradientText'

interface LoginPageProps {
  onSuccess: () => void
}

/* ─── Neural Canvas — Optimized with spatial grid ─────────────────── */

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const mouse = { x: -999, y: -999 }

    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio
      canvas.height = window.innerHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize()

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)

    interface Node { x: number; y: number; vx: number; vy: number; r: number; hue: number }
    const N = 50 // Reduced from 80 for performance
    const W = () => window.innerWidth
    const H = () => window.innerHeight

    const nodes: Node[] = Array.from({ length: N }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      hue: 260 + Math.random() * 60,
    }))

    // Spatial grid for O(n) connections instead of O(n²)
    const CELL = 160
    const grid = new Map<string, Node[]>()

    const draw = () => {
      const w = W(), h = H()
      ctx.clearRect(0, 0, w, h)

      // Update positions
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
        // Mouse repulsion
        const dx = mouse.x - n.x, dy = mouse.y - n.y
        if (dx * dx + dy * dy < 14400) { n.x -= dx * 0.012; n.y -= dy * 0.012 }
      }

      // Build spatial grid
      grid.clear()
      for (const n of nodes) {
        const key = `${Math.floor(n.x / CELL)},${Math.floor(n.y / CELL)}`
        const cell = grid.get(key)
        if (cell) cell.push(n); else grid.set(key, [n])
      }

      // Draw connections using grid neighbors
      for (const [key, cell] of grid) {
        const [cx, cy] = key.split(',').map(Number)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const neighbor = grid.get(`${cx + dx},${cy + dy}`)
            if (!neighbor) continue
            for (const a of cell) {
              for (const b of neighbor) {
                if (a === b) continue
                const ddx = a.x - b.x, ddy = a.y - b.y
                const dist = Math.sqrt(ddx * ddx + ddy * ddy)
                if (dist < 160) {
                  ctx.beginPath()
                  ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
                  ctx.strokeStyle = `hsla(${a.hue},80%,60%,${(1 - dist / 160) * 0.35})`
                  ctx.lineWidth = 0.7
                  ctx.stroke()
                }
              }
            }
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5)
        grad.addColorStop(0, `hsla(${n.hue},80%,65%,0.8)`)
        grad.addColorStop(1, `hsla(${n.hue},80%,65%,0)`)
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2)
        ctx.fillStyle = grad; ctx.fill()
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${n.hue},80%,75%,0.9)`; ctx.fill()
      }

      // Mouse glow
      if (mouse.x > 0) {
        const mgr = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180)
        mgr.addColorStop(0, 'rgba(236,72,153,0.05)')
        mgr.addColorStop(1, 'rgba(236,72,153,0)')
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2)
        ctx.fillStyle = mgr; ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ width: '100%', height: '100%' }} />
}

/* ─── Rotating Hero Word ─────────────────────────────────────────── */

function HeroText() {
  const words = ['Founder', 'Builder', 'Startup', 'Visionary']
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShow(false)
      setTimeout(() => { setIdx(i => (i + 1) % words.length); setShow(true) }, 350)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className="inline-block text-pink-400 underline decoration-pink-400 decoration-[3px] transition-all duration-350"
      style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(-10px)' }}
    >
      {words[idx]}
    </span>
  )
}

/* ─── Scroll Reveal ──────────────────────────────────────────────── */

function ScrollReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Animated Gauge ─────────────────────────────────────────────── */

function AnimatedGauge({ label, value, delay }: { label: string; value: number; delay: number }) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      let current = 0
      const step = () => {
        current += 1.5
        if (current >= value) { setProgress(value); return }
        setProgress(current)
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timer)
  }, [visible, value, delay])

  const r = 60, circ = Math.PI * r, dash = (progress / 100) * circ

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 160, height: 90 }}>
        <svg width="160" height="90" viewBox="0 0 160 90">
          <path d={`M 20 80 A ${r} ${r} 0 0 1 140 80`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
          <path d={`M 20 80 A ${r} ${r} 0 0 1 140 80`} fill="none" stroke="url(#gaugeGrad)" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 0.05s linear', filter: 'drop-shadow(0 0 8px rgba(236,72,153,0.5))' }} />
          <defs><linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%"><stop offset="0%" stopColor="#be185d" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs>
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-2xl font-bold text-white/20 font-mono tracking-tight">{Math.round(progress)}%</span>
        </div>
      </div>
      <span className="text-white font-semibold text-base tracking-wide">{label}</span>
    </div>
  )
}

/* ─── Main Login Page ────────────────────────────────────────────── */

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

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
      playSound('success')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const openForm = (m: 'login' | 'signup') => {
    setMode(m)
    setShowForm(true)
    playSound('pop')
  }

  const services = [
    { icon: '🧠', label: 'AI Exploration', desc: "Together, we explore what's possible with AI for your specific business context." },
    { icon: '🔬', label: 'AI Workshops', desc: 'Prepare your corporate culture for the AI revolution with hands-on sessions.' },
    { icon: '📊', label: 'Consultancy', desc: 'Strategic AI advisory and roadmap planning tailored to your growth stage.' },
    { icon: '⚙️', label: 'Development', desc: 'Full-stack AI product development from MVP to production-ready systems.' },
  ]

  const marqueeItems = ['AI Ideas', 'Market Research', 'Business Planner', 'AI Agents', 'Content Studio', 'CRM', 'Finance', 'SEO']

  return (
    <div className="min-h-screen overflow-x-hidden relative" style={{ background: '#0a0a0f' }}>
      <NeuralCanvas />

      {/* ─── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-12 py-5 flex items-center justify-between"
        style={{ background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(24px) saturate(1.3)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-lg shadow-lg shadow-pink-500/30">🚀</div>
          <span className="text-xl font-extrabold text-white tracking-tight">OneFounder</span>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary px-6 py-2.5 text-sm" onClick={() => openForm('login')}>Sign In</button>
          <button className="btn-glow px-6 py-2.5 text-sm" onClick={() => openForm('signup')}>Get Started</button>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center px-12 pt-32 pb-20 relative z-10 max-w-[1400px] mx-auto">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
            <span className="text-xs font-medium text-pink-400">AI-Powered Founder OS — Now Live</span>
          </div>

          <h1 className="text-[clamp(48px,7vw,90px)] font-black leading-[1.05] text-white tracking-tight mb-6">
            <span className="block">Boost your</span>
            <span className="block">business as a</span>
            <span className="block"><HeroText /> !</span>
          </h1>

          <p className="text-lg text-white/45 max-w-md leading-relaxed mb-10">
            We enable you to leverage the latest AI tools and models to drive growth, efficiency, and competitive advantage in your business.
          </p>

          <div className="flex gap-4 flex-wrap">
            <button className="btn-glow text-base px-8 py-4" onClick={() => openForm('signup')}>→ LAUNCH YOUR OS</button>
            <button className="btn-secondary text-base px-8 py-4" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>VIEW MORE</button>
          </div>
        </div>

        {/* 3D Sphere */}
        <div className="flex-1 flex justify-center items-center" style={{ perspective: 1000 }}>
          <div className="relative">
            <div className="w-80 h-80 rounded-full animate-float"
              style={{
                background: 'radial-gradient(circle at 35% 35%, rgba(139,92,246,0.6), rgba(236,72,153,0.4), rgba(6,6,20,0.8))',
                boxShadow: '0 0 80px rgba(236,72,153,0.4), 0 0 160px rgba(139,92,246,0.2), inset 0 0 80px rgba(139,92,246,0.2)',
              }}>
              {/* Rings */}
              <div className="absolute rounded-full border border-pink-500/20" style={{ width: '140%', height: '140%', top: '-20%', left: '-20%', animation: 'spin 8s linear infinite', transformStyle: 'preserve-3d' }} />
              <div className="absolute rounded-full border border-violet-500/20" style={{ width: '120%', height: '120%', top: '-10%', left: '-10%', animation: 'spin 12s linear infinite reverse', transformStyle: 'preserve-3d' }} />
            </div>
            <div className="absolute inset-0 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle at center, transparent 40%, rgba(10,10,15,0.8) 100%)' }} />
          </div>
        </div>

        {/* Side label */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 writing-mode-vertical text-white/15 text-[11px] tracking-[3px] uppercase font-semibold"
          style={{ writingMode: 'vertical-lr' }}>AI SERVICES</div>
      </section>

      {/* ─── MARQUEE ─────────────────────────────────────────────── */}
      <div className="overflow-hidden py-6 bg-pink-500/[0.03] border-y border-pink-500/10 relative z-10">
        <div className="flex animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((t, i) => (
            <span key={i} className={`px-10 text-sm font-semibold uppercase tracking-widest ${i % 2 === 0 ? 'text-white/50' : 'text-pink-400'}`}>
              {t} {i % 2 === 0 ? '×' : '+'}
            </span>
          ))}
        </div>
      </div>

      {/* ─── SERVICES ────────────────────────────────────────────── */}
      <section id="services" className="py-32 px-12 max-w-[1400px] mx-auto relative z-10">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-[clamp(36px,5vw,64px)] font-black text-white tracking-tight leading-tight">
              Embrace <em className="not-italic"><AnimatedGradientText colors={['#ec4899', '#8b5cf6', '#ec4899']}>the AI revolution</AnimatedGradientText></em>.
            </h2>
            <p className="mt-5 text-white/35 text-base max-w-2xl mx-auto leading-relaxed">
              Our services keep you ahead of the AI revolution by offering training, consulting, implementation, and support.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-20">
          {services.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 100}>
              <div className="card-3d p-8 group cursor-default">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  {s.label} <span className="text-pink-400 group-hover:translate-x-1 transition-transform">›</span>
                </h3>
                <p className="text-white/35 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── GAUGES ──────────────────────────────────────────────── */}
      <section className="py-24 px-12 bg-white/[0.01] border-t border-white/[0.03] relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-4 gap-8 justify-items-center">
            {[{ label: 'Exploration', delay: 0 }, { label: 'Workshops', delay: 200 }, { label: 'Consultancy', delay: 400 }, { label: 'Development', delay: 600 }].map(g => (
              <AnimatedGauge key={g.label} label={g.label} value={100} delay={g.delay} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="py-32 px-12 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-[clamp(36px,5vw,60px)] font-black text-white tracking-tight mb-5">
              Ready to build your <AnimatedGradientText colors={['#ec4899', '#8b5cf6', '#a78bfa', '#ec4899']}>empire?</AnimatedGradientText>
            </h2>
            <p className="text-white/35 text-lg mb-10 leading-relaxed">
              Join thousands of founders using OneFounder to discover, validate, and scale their businesses — all powered by local-first AI.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="btn-glow text-base px-10 py-4" onClick={() => openForm('signup')}>→ START FOR FREE</button>
              <button className="btn-secondary text-base px-10 py-4" onClick={() => openForm('login')}>SIGN IN</button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-16 px-12 bg-black/40 border-t border-white/[0.04] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-base">🚀</div>
                <span className="font-extrabold text-white text-lg">OneFounder</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed max-w-xs mb-5">
                We enable you to leverage the latest AI tools and models to drive growth, efficiency, and competitive advantage.
              </p>
              <div className="flex gap-3">
                {['in', '𝕏', '✉'].map(icon => (
                  <div key={icon} className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 text-xs font-bold hover:bg-white/10 hover:text-white/60 transition-all cursor-pointer">
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            {[{ title: 'Menu', links: ['Home', 'Services', 'Contact'] }, { title: 'Legal', links: ['Privacy Policy', 'Site Notice'] }, { title: 'Contact Us', links: [] }].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-bold mb-4 text-sm">{col.title}</h4>
                <div className="h-px bg-white/[0.06] mb-4" />
                <div className="flex flex-col gap-2.5">
                  {col.links.map(l => (
                    <a key={l} href="#" className="text-white/35 text-sm hover:text-white/60 transition-colors flex items-center gap-1.5">
                      <span className="text-pink-400">›</span> {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.04] pt-6 text-center text-white/15 text-xs">
            © 2025-2026 OneFounder — All rights reserved. Powered by Local AI.
          </div>
        </div>
      </footer>

      {/* ─── AUTH MODAL ──────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); playSound('click') } }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-10 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(15,15,25,0.97) 0%, rgba(8,8,16,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(236,72,153,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
            {/* Top highlight */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.2), transparent)' }} />

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-white/30 text-sm mt-1">
                  {mode === 'login' ? 'Sign in to your founder workspace' : 'Start building your business today'}
                </p>
              </div>
              <button onClick={() => { setShowForm(false); playSound('click') }}
                className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-white/45 text-xs font-medium mb-1.5">Full name</label>
                  <input className="input" type="text" placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
                </div>
              )}
              <div>
                <label className="block text-white/45 text-xs font-medium mb-1.5">Email</label>
                <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div>
                <label className="block text-white/45 text-xs font-medium mb-1.5">Password</label>
                <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm animate-slide-up">
                  {error}
                </div>
              )}

              <button className="btn-glow w-full mt-2 py-3.5 flex items-center justify-center gap-2" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'login' ? '→ Sign in' : '→ Create account'
                )}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-white/30">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); playSound('click') }}
                className="text-pink-400 font-semibold hover:text-pink-300 transition-colors">
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
    </div>
  )
}
