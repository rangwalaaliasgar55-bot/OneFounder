import { Router } from 'express'

const router = Router()

router.get('/env', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? 'SET' : 'NOT SET',
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    CLIENT_URL: process.env.CLIENT_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
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
