import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth'
import dotenv from 'dotenv'
dotenv.config()

import aiRoutes from './routes/ai'
import ideasRoutes from './routes/ideas'
import researchRoutes from './routes/research'
import plansRoutes from './routes/plans'
import projectsRoutes from './routes/projects'
import contentRoutes from './routes/content'
import leadsRoutes from './routes/leads'
import knowledgeRoutes from './routes/knowledge'
import chatRoutes from './routes/chat'
import dashboardRoutes from './routes/dashboard'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.CLIENT_URL || '',
    /\.replit\.dev$/,
    /\.repl\.co$/,
  ].filter(Boolean),
  credentials: true,
}))

app.all('/auth/*', toNodeHandler(auth))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/ai', aiRoutes)
app.use('/api/ideas', ideasRoutes)
app.use('/api/research', researchRoutes)
app.use('/api/plans', plansRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', version: '1.0.0', name: 'OneFounder' })
})

app.listen(PORT, () => {
  console.log(`🚀 OneFounder server running on port ${PORT}`)
})
