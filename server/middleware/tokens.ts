import type { Request, Response, NextFunction } from 'express'
import { db } from '../db'
import { users, tokenTransactions } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

export async function checkTokens(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const [row] = await db
    .select({ tokenBalance: users.tokenBalance, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!row) return res.status(401).json({ error: 'User not found' })

  if (row.isAdmin) return next()

  if (row.tokenBalance <= 0) {
    return res.status(429).json({
      error: 'You have used all your AI tokens. Contact the admin for more.',
      code: 'NO_TOKENS',
      tokenBalance: 0,
    })
  }

  ;(req as any).tokenCheckPassed = true
  next()
}

export async function deductToken(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      tokenBalance: sql`${users.tokenBalance} - 1`,
      tokenUsed: sql`${users.tokenUsed} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  await db.insert(tokenTransactions).values({
    userId,
    amount: -1,
    type: 'deduct',
    note: 'AI request',
  })
}

export async function grantTokens(userId: string, amount: number, note = 'Admin grant'): Promise<void> {
  await db
    .update(users)
    .set({
      tokenBalance: sql`${users.tokenBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  await db.insert(tokenTransactions).values({
    userId,
    amount,
    type: 'grant',
    note,
  })
}

export async function getUserTokenBalance(userId: string): Promise<{ tokenBalance: number; tokenUsed: number; isAdmin: boolean } | null> {
  const [row] = await db
    .select({ tokenBalance: users.tokenBalance, tokenUsed: users.tokenUsed, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!row) return null
  return { tokenBalance: row.tokenBalance, tokenUsed: row.tokenUsed, isAdmin: row.isAdmin ?? false }
}
