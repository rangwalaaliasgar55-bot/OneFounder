import { Request, Response, NextFunction } from 'express'
import { auth } from '../auth'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: req.headers as any })
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

    // Enrich with DB fields (isAdmin, tokenBalance) not stored in Better Auth session
    const [dbUser] = await db
      .select({ isAdmin: users.isAdmin, tokenBalance: users.tokenBalance, tokenUsed: users.tokenUsed })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    ;(req as any).user = { ...session.user, ...(dbUser ?? {}) }
    ;(req as any).session = session.session
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
