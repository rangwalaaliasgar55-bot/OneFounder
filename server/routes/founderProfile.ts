import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { founderProfiles } from '../db/schema'
import { eq } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const [profile] = await db.select().from(founderProfiles).where(eq(founderProfiles.userId, user.id))
    res.json(profile || null)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.put('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { riskTolerance, workStyle, primaryGoal, bio, industry, stage } = req.body
  try {
    const [existing] = await db.select().from(founderProfiles).where(eq(founderProfiles.userId, user.id))
    if (existing) {
      const [updated] = await db.update(founderProfiles)
        .set({ riskTolerance, workStyle, primaryGoal, bio, industry, stage, updatedAt: new Date() })
        .where(eq(founderProfiles.userId, user.id))
        .returning()
      return res.json(updated)
    }
    const [created] = await db.insert(founderProfiles).values({
      userId: user.id, riskTolerance, workStyle, primaryGoal, bio, industry, stage,
    }).returning()
    res.json(created)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

export default router
