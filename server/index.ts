import express from 'express'
import cors from 'cors'
import path from 'path'
import helmet from 'helmet'
import compression from 'compression'
import { sql } from 'drizzle-orm'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'
dotenv.config()

import aiRoutes from './routes/ai.js'
import ideasRoutes from './routes/ideas.js'
import researchRoutes from './routes/research.js'
import plansRoutes from './routes/plans.js'
import projectsRoutes from './routes/projects.js'
import contentRoutes from './routes/content.js'
import leadsRoutes from './routes/leads.js'
import knowledgeRoutes from './routes/knowledge.js'
import chatRoutes from './routes/chat.js'
import dashboardRoutes from './routes/dashboard.js'
import socialRoutes from './routes/social.js'
import financeRoutes from './routes/finance.js'
import seoRoutes from './routes/seo.js'
import ceoRoutes from './routes/ceo.js'
import journeyRoutes from './routes/journey.js'
import wordpressRoutes from './routes/wordpress.js'
import founderProfileRoutes from './routes/founderProfile.js'
import intelligenceRoutes from './routes/intelligence.js'
import expertRoutes from './routes/expert.js'
import ogRoutes from './routes/og.js'
import agentsRoutes from './routes/agents.js'
import memoryRoutes from './routes/memory.js'
import tasksRoutes from './routes/tasks.js'
import adminRoutes from './routes/admin.js'
import ollamaRoutes from './routes/ollama.js'
import setupRoutes, { meHandler } from './routes/setup.js'
import debugRoutes from './routes/debug.js'
import testDbRoutes from './routes/test-db.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 3001

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'AI rate limit reached. Please wait a moment.' },
})

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Vite injects inline scripts — nonce requires SSR
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://api.search.brave.com', 'https://*.up.railway.app'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}))

// Trust proxy for rate limiting behind Vercel / Replit reverse proxies
app.set('trust proxy', 1)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const allowedExact = [
      'http://localhost:5173',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      process.env.CLIENT_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
    ].filter(Boolean) as string[]

    // Only allow Replit preview domains as a wildcard (your own dev env).
    // Vercel URLs must be listed explicitly via VERCEL_URL / VERCEL_PROJECT_PRODUCTION_URL —
    // a blanket *.vercel.app wildcard would let any other Vercel tenant hit this API.
    const isAllowed =
      allowedExact.includes(origin) ||
      /\.replit\.dev$/.test(origin) ||
      /\.repl\.co$/.test(origin)

    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed)
  },
  credentials: true,
}))

app.use(compression())
app.use(limiter)
app.all('/auth/*', toNodeHandler(auth))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Debug routes — only available in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes)
  app.use('/api/test-db', testDbRoutes)
}

// Routes
app.use('/api/ai', aiLimiter, aiRoutes)
app.use('/api/ideas', ideasRoutes)
app.use('/api/research', researchRoutes)
app.use('/api/plans', plansRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/chat', aiLimiter, chatRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/social', socialRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/seo', seoRoutes)
app.use('/api/ceo', ceoRoutes)
app.use('/api/journey', journeyRoutes)
app.use('/api/wordpress', wordpressRoutes)
app.use('/api/founder-profile', founderProfileRoutes)
app.use('/api/intelligence', intelligenceRoutes)
app.use('/api/expert', aiLimiter, expertRoutes)
app.use('/api/og', ogRoutes)
app.use('/api/agents', aiLimiter, agentsRoutes)
app.use('/api/memory', memoryRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/ollama', ollamaRoutes)
app.use('/api/setup', setupRoutes)
app.get('/api/me', requireAuth, meHandler) // Extended user profile (onboarding state, token balance, etc.)

app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    version: '4.0.0',
    name: 'OneFounder Supreme',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/ready', async (_, res) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {}
  const start = Date.now()

  // DB check
  try {
    const dbStart = Date.now()
    const { db } = await import('./db/index.js')
    await db.execute(sql`SELECT 1`)
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (err: any) {
    checks.database = { status: 'error', error: err.message }
  }

  // Ollama check
  try {
    const ollamaStart = Date.now()
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const resp = await fetch(ollamaUrl + '/api/tags', { signal: controller.signal })
    clearTimeout(timer)
    checks.ollama = { status: resp.ok ? 'ok' : 'error', latencyMs: Date.now() - ollamaStart }
  } catch (err: any) {
    checks.ollama = { status: 'offline', error: err.message }
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok')
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'degraded',
    checks,
    totalLatencyMs: Date.now() - start,
  })
})

// Global error handler — sanitize messages in production
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message || err)
  if (err.stack) console.error('[Error Stack]', err.stack)
  const isProd = process.env.NODE_ENV === 'production'
  res.status(err.status || 500).json({
    error: isProd ? 'An unexpected error occurred' : (err.message || 'Internal server error'),
    code: err.code || 'INTERNAL_ERROR',
    stack: isProd ? undefined : err.stack,
  })
})

// Serve built client in production (not on Vercel — CDN handles static files there)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const clientDist = path.resolve(process.cwd(), 'dist/client')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

if (!process.env.VERCEL) {
  const maxAttempts = 5
  let serverInstance: ReturnType<typeof app.listen> | null = null

  const startServer = (port: number, attempt = 1) => {
    serverInstance = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 OneFounder Supreme server running on port ${port}`)
    })
    serverInstance.on('error', (err: any) => {
      if (err && err.code === 'EADDRINUSE' && attempt < maxAttempts) {
        const nextPort = port + 1
        console.warn(`Port ${port} in use, trying ${nextPort}`)
        startServer(nextPort, attempt + 1)
      } else {
        console.error('Failed to start server:', err)
        process.exit(1)
      }
    })
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`)
    if (serverInstance) {
      serverInstance.close(() => {
        console.log('HTTP server closed')
        process.exit(0)
      })
      // Force kill after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10000)
    } else {
      process.exit(0)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  startServer(Number(PORT))
}

export default app
