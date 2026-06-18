import { Router } from 'express'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { sql } from 'drizzle-orm'

const router = Router()

router.get('/check', async (req, res) => {
  try {
    // Try to query the users table
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
      code: error.code,
    })
  }
})

export default router
