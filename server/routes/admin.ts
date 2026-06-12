import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { users, tokenTransactions } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { grantTokens } from '../middleware/tokens'

const router = Router()

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin only' })
  next()
}

// GET /api/admin/users
router.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isAdmin: users.isAdmin,
        tokenBalance: users.tokenBalance,
        tokenUsed: users.tokenUsed,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
    res.json(allUsers)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/users/:id/grant
router.post('/users/:id/grant', requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id as string
  const { amount, note } = req.body
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' })
  }
  try {
    await grantTokens(userId, amount, note || 'Admin grant')
    const [updated] = await db
      .select({ tokenBalance: users.tokenBalance, tokenUsed: users.tokenUsed })
      .from(users).where(eq(users.id, userId)).limit(1)
    res.json({ success: true, ...updated })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/users/:id/set-tokens
router.post('/users/:id/set-tokens', requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id as string
  const { balance } = req.body
  if (balance === undefined || typeof balance !== 'number' || balance < 0) {
    return res.status(400).json({ error: 'balance must be a non-negative number' })
  }
  try {
    await db.update(users).set({ tokenBalance: balance, updatedAt: new Date() }).where(eq(users.id, userId))
    await db.insert(tokenTransactions).values({ userId, amount: balance, type: 'reset', note: 'Admin set balance' })
    res.json({ success: true, tokenBalance: balance })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/users/:id/toggle-admin
router.post('/users/:id/toggle-admin', requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id as string
  const me = (req as any).user
  if (userId === me.id) return res.status(400).json({ error: 'Cannot change your own admin status' })
  try {
    const [target] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId)).limit(1)
    if (!target) return res.status(404).json({ error: 'User not found' })
    await db.update(users).set({ isAdmin: !target.isAdmin, updatedAt: new Date() }).where(eq(users.id, userId))
    res.json({ success: true, isAdmin: !target.isAdmin })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/bootstrap — makes YOU admin if NO admins exist yet (one-time setup)
router.post('/bootstrap', requireAuth, async (req, res) => {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isAdmin, true))
    if (Number(count) > 0) return res.status(403).json({ error: 'An admin already exists. Ask them to grant you admin.' })
    const me = (req as any).user
    await db.update(users).set({ isAdmin: true, updatedAt: new Date() }).where(eq(users.id, me.id))
    res.json({ success: true, message: `${me.email} is now admin.` })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/stats
router.get('/stats', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [totals] = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        totalTokensUsed: sql<number>`sum(${users.tokenUsed})`,
        totalTokensRemaining: sql<number>`sum(${users.tokenBalance})`,
      })
      .from(users)
    const recentActivity = await db
      .select({
        id: tokenTransactions.id,
        userId: tokenTransactions.userId,
        amount: tokenTransactions.amount,
        type: tokenTransactions.type,
        note: tokenTransactions.note,
        createdAt: tokenTransactions.createdAt,
      })
      .from(tokenTransactions)
      .orderBy(desc(tokenTransactions.createdAt))
      .limit(20)
    res.json({ totals, recentActivity })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
