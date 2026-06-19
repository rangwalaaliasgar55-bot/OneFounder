import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'

const router = Router()

router.get('/check', requireAuth, async (req, res) => {
  const user = (req as any).user
  if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' })

  try {
    const result = await db.select().from(users).limit(1)
    res.json({
      success: true,
      message: 'Database connection successful',
      usersTableExists: true,
      userCount: result.length,
    })
  } catch (error: any) {
    res.json({
      success: false,
      message: 'Database error',
      error: error.message,
    })
  }
})

export default router
