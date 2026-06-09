import { Request, Response, NextFunction } from 'express'
import { auth } from '../auth'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: req.headers as any })
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    (req as any).user = session.user
    ;(req as any).session = session.session
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
