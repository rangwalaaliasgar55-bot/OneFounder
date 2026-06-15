import { useState, useEffect, useRef, useCallback } from 'react'
import { authApi } from '../lib/api'

interface LoginPageProps {
  onSuccess: () => void
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])
  return pos
}

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove)

    interface Node {
      x: number; y: number; vx: number; vy: number; r: number; pulse: number; pulseSpeed: number
    }
    const N = 80
    const nodes: Node[] = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
    }))

    let t = 0
    const draw = () => {
      t += 0.008
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      nodes.forEach(n => {
        n.x += n.vx
        n.y += n.vy
        n.pulse += n.pulseSpeed
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1

        const mx = mouse.current.x - n.x
        const my = mouse.current.y - n.y
        const md = Math.sqrt(mx * mx + my * my)
        if (md < 120) {
          n.x -= mx * 0.015
          n.y -= my * 0.015
        }
      })

      nodes.forEach((a, i) => {
        nodes.forEach((b, j) => {
          if (j <= i) return
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 160) {
            const alpha = (1 - d / 160) * 0.5
            const hue = 280 + Math.sin(t + i * 0.1) * 40
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `hsla(${hue},100%,65%,${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        })
      })

      nodes.forEach((n, i) => {
        const hue = 300 + Math.sin(t + i * 0.2) * 60
        const glow = Math.sin(n.pulse) * 0.5 + 0.5
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
        grad.addColorStop(0, `hsla(${hue},100%,70%,${0.9 * glow + 0.1})`)
        grad.addColorStop(1, `hsla(${hue},100%,70%,0)`)
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue},100%,80%,0.9)`
        ctx.fill()
      })

      const mx = mouse.current.x
      const my = mouse.current.y
      const mgr = ctx.createRadialGradient(mx, my, 0, mx, my, 200)
      mgr.addColorStop(0, 'rgba(236,72,153,0.06)')
      mgr.addColorStop(1, 'rgba(236,72,153,0)')
      ctx.beginPath()
      ctx.arc(mx, my, 200, 0, Math.PI * 2)
      ctx.fillStyle = mgr
      ctx.fill()

      animRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
}

function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement[]>([])
  const pos = useRef({ x: 0, y: 0 })
  const smoothPos = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)

    const animate = () => {
      smoothPos.current.x += (pos.current.x - smoothPos.current.x) * 0.12
      smoothPos.current.y += (pos.current.y - smoothPos.current.y) * 0.12
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${smoothPos.current.x - 20}px, ${smoothPos.current.y - 20}px)`
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <style>{`* { cursor: none !important; }`}</style>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ zIndex: 9999, width: 40, height: 40 }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '1.5px solid rgba(236,72,153,0.7)',
          boxShadow: '0 0 12px rgba(236,72,153,0.4)',
          transition: 'transform 0.1s ease',
        }} />
      </div>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ zIndex: 9999, width: 8, height: 8 }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#ec4899',
          boxShadow: '0 0 8px #ec4899, 0 0 20px rgba(236,72,153,0.6)',
        }} />
      </div>
    </>
  )
}

function AnimatedGauge({ label, value, delay }: { label: string; value: number; delay: number }) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.3 })
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

  const r = 60
  const circ = Math.PI * r
  const dash = (progress / 100) * circ

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 160, height: 90 }}>
        <svg width="160" height="90" viewBox="0 0 160 90">
          <path
            d={`M 20 80 A ${r} ${r} 0 0 1 140 80`}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round"
          />
          <path
            d={`M 20 80 A ${r} ${r} 0 0 1 140 80`}
            fill="none"
            stroke="url(#gaugePink)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.05s linear', filter: 'drop-shadow(0 0 8px #ec4899)' }}
          />
          <defs>
            <linearGradient id="gaugePink" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#be185d" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span style={{
            fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.2)',
            fontFamily: 'system-ui', letterSpacing: '-1px'
          }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <span className="text-white font-semibold text-base tracking-wide">{label}</span>
    </div>
  )
}

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
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function HeroText() {
  const words = ['Founder', 'Builder', 'Startup', 'Visionary']
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShow(false)
      setTimeout(() => { setIdx(i => (i + 1) % words.length); setShow(true) }, 400)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <span style={{
      display: 'inline-block',
      color: '#ec4899',
      textDecoration: 'underline',
      textDecorationColor: '#ec4899',
      textDecorationThickness: 3,
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(-10px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
    }}>
      {words[idx]}
    </span>
  )
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const scrollY = useRef(0)

  useEffect(() => {
    const handler = () => { scrollY.current = window.scrollY }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

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
    <div style={{ background: '#0a0a0f', minHeight: '100vh', overflowX: 'hidden' }}>
      <CustomCursor />
      <NeuralCanvas />

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-12px) } }
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 20px rgba(236,72,153,0.3) } 50% { box-shadow: 0 0 50px rgba(236,72,153,0.7), 0 0 100px rgba(236,72,153,0.3) } }
        @keyframes spin3d { from { transform: rotateY(0deg) rotateX(15deg) } to { transform: rotateY(360deg) rotateX(15deg) } }
        @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes ping-slow { 0% { transform: scale(1); opacity: 0.8 } 100% { transform: scale(2.5); opacity: 0 } }
        .text-gradient-pink {
          background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #ec4899 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(236,72,153,0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(236,72,153,0.1);
        }
        .btn-pink {
          background: linear-gradient(135deg, #be185d, #ec4899);
          color: white;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          padding: 14px 32px;
          font-size: 15px;
          cursor: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(236,72,153,0.4);
          position: relative;
          overflow: hidden;
        }
        .btn-pink::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-pink:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(236,72,153,0.6); }
        .btn-pink:hover::after { opacity: 1; }
        .btn-outline {
          background: transparent;
          color: white;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          padding: 14px 32px;
          font-size: 15px;
          cursor: none;
          transition: all 0.3s ease;
        }
        .btn-outline:hover { border-color: rgba(236,72,153,0.6); color: #ec4899; }
        .input-dark {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: white;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .input-dark:focus {
          border-color: rgba(236,72,153,0.5);
          box-shadow: 0 0 0 3px rgba(236,72,153,0.1);
        }
        .input-dark::placeholder { color: rgba(255,255,255,0.25); }
        .sphere-3d {
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(139,92,246,0.6), rgba(236,72,153,0.4), rgba(6,6,20,0.8));
          box-shadow:
            0 0 80px rgba(236,72,153,0.4),
            0 0 160px rgba(139,92,246,0.2),
            inset 0 0 80px rgba(139,92,246,0.2);
          animation: float 6s ease-in-out infinite, glow-pulse 4s ease-in-out infinite;
          position: relative;
        }
        .sphere-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(236,72,153,0.3);
          animation: spin3d 8s linear infinite;
          transform-style: preserve-3d;
        }
        .overlay-modal {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '20px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 20px rgba(236,72,153,0.4)',
          }}>🚀</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>OneFounder</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" style={{ padding: '10px 24px', fontSize: 14 }}
            onClick={() => { setMode('login'); setShowForm(true) }}>
            Sign In
          </button>
          <button className="btn-pink" style={{ padding: '10px 24px', fontSize: 14 }}
            onClick={() => { setMode('signup'); setShowForm(true) }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 48px 80px',
        position: 'relative', zIndex: 1,
        maxWidth: 1400, margin: '0 auto',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 32,
            fontSize: 13, color: '#ec4899', fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ec4899', animation: 'ping-slow 1.5s infinite' }} />
            AI-Powered Founder OS — Now Live
          </div>

          <h1 style={{
            fontSize: 'clamp(48px, 7vw, 90px)',
            fontWeight: 900,
            lineHeight: 1.05,
            color: 'white',
            letterSpacing: '-2px',
            marginBottom: 24,
          }}>
            <span style={{ display: 'block' }}>Boost your</span>
            <span style={{ display: 'block' }}>business as a</span>
            <span style={{ display: 'block' }}><HeroText /> !</span>
          </h1>

          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.5)',
            maxWidth: 480, lineHeight: 1.7, marginBottom: 40,
          }}>
            We enable you to leverage the latest AI tools and models to drive growth, efficiency, and competitive advantage in your business.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button className="btn-pink" onClick={() => { setMode('signup'); setShowForm(true) }}>
              → LAUNCH YOUR OS
            </button>
            <button className="btn-outline" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
              VIEW MORE
            </button>
          </div>
        </div>

        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
          perspective: 1000,
        }}>
          <div style={{ position: 'relative' }}>
            <div className="sphere-3d">
              <div className="sphere-ring" style={{ width: '140%', height: '140%', top: '-20%', left: '-20%', borderColor: 'rgba(139,92,246,0.2)' }} />
              <div className="sphere-ring" style={{ width: '120%', height: '120%', top: '-10%', left: '-10%', animationDuration: '12s', animationDirection: 'reverse' }} />
            </div>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 320, height: 320,
              background: 'radial-gradient(circle at center, transparent 40%, rgba(10,10,15,0.8) 100%)',
              borderRadius: '50%',
            }} />
          </div>
        </div>

        <div style={{
          writingMode: 'vertical-lr', position: 'absolute', right: 24, top: '50%',
          transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)',
          fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600,
        }}>AI SERVICES</div>
      </section>

      {/* MARQUEE */}
      <div style={{
        overflow: 'hidden', padding: '24px 0',
        background: 'rgba(236,72,153,0.05)',
        borderTop: '1px solid rgba(236,72,153,0.1)',
        borderBottom: '1px solid rgba(236,72,153,0.1)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', animation: 'marquee 20s linear infinite', whiteSpace: 'nowrap' }}>
          {['AI Ideas', 'Market Research', 'Business Planner', 'AI Agents', 'Content Studio', 'CRM', 'Finance', 'SEO', 'AI Ideas', 'Market Research', 'Business Planner', 'AI Agents', 'Content Studio', 'CRM', 'Finance', 'SEO'].map((t, i) => (
            <span key={i} style={{
              padding: '0 40px', fontSize: 14, fontWeight: 600,
              color: i % 2 === 0 ? 'rgba(255,255,255,0.6)' : '#ec4899',
              textTransform: 'uppercase', letterSpacing: 2,
            }}>
              {t} {i % 2 === 0 ? '×' : '+'}
            </span>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" style={{
        padding: '120px 48px', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1,
      }}>
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              Embrace <em style={{ fontStyle: 'normal' }} className="text-gradient-pink">the AI revolution</em>.
            </h2>
            <p style={{ marginTop: 20, color: 'rgba(255,255,255,0.4)', fontSize: 16, maxWidth: 700, margin: '20px auto 0', lineHeight: 1.8 }}>
              Our services keep you ahead of the AI revolution by offering training, consulting, implementation, and support. Our experts work with you to harness the power of AI and stay ahead of the competition.
            </p>
          </div>
        </ScrollReveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 80 }}>
          {[
            { icon: '🧠', label: 'AI Exploration', desc: 'Together, we explore what\'s possible with AI for your specific business context.' },
            { icon: '🔬', label: 'AI Workshops', desc: 'Prepare your corporate culture for the AI revolution with hands-on sessions.' },
            { icon: '📊', label: 'Consultancy', desc: 'Strategic AI advisory and roadmap planning tailored to your growth stage.' },
            { icon: '⚙️', label: 'Development', desc: 'Full-stack AI product development from MVP to production-ready systems.' },
          ].map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 100}>
              <div className="glass-card" style={{ borderRadius: 16, padding: 32 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                  background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>{s.icon}</div>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.label} <span style={{ color: '#ec4899' }}>›</span>
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* GAUGES */}
      <section style={{
        padding: '100px 48px', background: 'rgba(255,255,255,0.01)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, justifyItems: 'center' }}>
            {[
              { label: 'Exploration', delay: 0 },
              { label: 'Workshops', delay: 200 },
              { label: 'Consultancy', delay: 400 },
              { label: 'Development', delay: 600 },
            ].map(g => (
              <AnimatedGauge key={g.label} label={g.label} value={100} delay={g.delay} />
            ))}
          </div>

          <div style={{ marginTop: 60, overflow: 'hidden' }}>
            <svg width="100%" height="30" preserveAspectRatio="none">
              <path
                d="M0,15 Q25,5 50,15 T100,15 T150,15 T200,15 T250,15 T300,15 T350,15 T400,15 T450,15 T500,15 T550,15 T600,15 T650,15 T700,15 T750,15 T800,15 T850,15 T900,15 T950,15 T1000,15 T1050,15 T1100,15 T1150,15 T1200,15"
                fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ padding: '120px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', marginBottom: 20 }}>
              Ready to build your <span className="text-gradient-pink">empire?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 17, marginBottom: 40, lineHeight: 1.7 }}>
              Join thousands of founders using OneFounder to discover, validate, and scale their businesses — all powered by local-first AI.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-pink" style={{ fontSize: 16, padding: '16px 40px' }}
                onClick={() => { setMode('signup'); setShowForm(true) }}>
                → START FOR FREE
              </button>
              <button className="btn-outline" style={{ fontSize: 16, padding: '16px 40px' }}
                onClick={() => { setMode('login'); setShowForm(true) }}>
                SIGN IN
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '60px 48px 32px',
        background: 'rgba(0,0,0,0.4)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>🚀</div>
                <span style={{ fontWeight: 800, color: 'white', fontSize: 17 }}>OneFounder</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 1.7, maxWidth: 260 }}>
                We enable you to leverage the latest AI tools and models to drive growth, efficiency, and competitive advantage.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {['in', '𝕏', '✉'].map(icon => (
                  <div key={icon} style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700,
                  }}>{icon}</div>
                ))}
              </div>
            </div>
            {[
              { title: 'Menu', links: ['Home', 'Services', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Site Notice'] },
              { title: 'Contact Us', links: [] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 15 }}>{col.title}</h4>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#ec4899' }}>›</span> {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            © 2025 OneFounder — All rights reserved. Powered by Local AI.
          </div>
        </div>
      </footer>

      {/* SIDE SOCIAL */}
      <div style={{
        position: 'fixed', left: 20, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10,
      }}>
        {['in', '𝕏', '✉'].map((icon, i) => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: 6,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700,
            transition: 'all 0.2s',
          }}>{icon}</div>
        ))}
        <div style={{ width: 1, height: 60, background: 'rgba(255,255,255,0.1)', margin: '0 auto' }} />
      </div>

      {/* SCROLL TO TOP */}
      <div style={{
        position: 'fixed', right: 20, bottom: 80, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          writingMode: 'vertical-lr', fontSize: 11, letterSpacing: 3,
          textTransform: 'uppercase', fontWeight: 600,
        }}>Scroll to top</button>
        <div style={{ color: '#ec4899', fontSize: 16 }}>↑</div>
      </div>

      {/* AUTH MODAL */}
      {showForm && (
        <div className="overlay-modal" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{
            background: 'rgba(15,15,25,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: 40, width: '100%', maxWidth: 440,
            boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(236,72,153,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginTop: 4 }}>
                  {mode === 'login' ? 'Sign in to your founder workspace' : 'Start building your business today'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)', borderRadius: 8, width: 36, height: 36,
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mode === 'signup' && (
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Full name</label>
                  <input className="input-dark" type="text" placeholder="John Smith"
                    value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
                </div>
              )}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Email</label>
                <input className="input-dark" type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Password</label>
                <input className="input-dark" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: 13,
                }}>{error}</div>
              )}

              <button className="btn-pink" type="submit" disabled={loading} style={{ marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin3d 0.8s linear infinite', display: 'inline-block' }} />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
                ) : (
                  mode === 'login' ? '→ Sign in' : '→ Create account'
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                style={{ background: 'none', border: 'none', color: '#ec4899', fontWeight: 600, fontSize: 14 }}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
