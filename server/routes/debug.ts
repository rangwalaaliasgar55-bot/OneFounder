import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Only enable in development
router.get('/env', requireAuth, (req, res) => {
  const user = (req as any).user
  if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' })
  
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' })
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? 'SET' : 'NOT SET',
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ? 'SET' : 'NOT SET',
    CLIENT_URL: process.env.CLIENT_URL ? 'SET' : 'NOT SET',
    VERCEL_URL: process.env.VERCEL_URL ? 'SET' : 'NOT SET',
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'SET' : 'NOT SET',
  }
  
  res.json({
    message: 'Environment variables check',
    variables: envVars,
    allRequiredSet: !!(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL) && 
                   !!process.env.BETTER_AUTH_SECRET &&
                   !!process.env.BETTER_AUTH_URL &&
                   !!process.env.CLIENT_URL
  })
})

export default router
