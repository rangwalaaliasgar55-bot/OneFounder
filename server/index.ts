import express from 'express'
import cors from 'cors'
import path from 'path'
import helmet from 'helmet'
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
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
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

app.use(limiter)
app.all('/auth/*', toNodeHandler(auth))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Debug route (remove in production)
app.use('/api/debug', debugRoutes)

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
  res.json({ status: 'ok', version: '2.0.0', name: 'OneFounder' })
})

// Global error handler - return detailed errors in all environments for debugging
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message || err)
  console.error('[Error Stack]', err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
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
  const startServer = (port: number, attempt = 1) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 OneFounder server running on port ${port}`)
    })
    server.on('error', (err: any) => {
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
  startServer(Number(PORT))
}

export default app
