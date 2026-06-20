/**
 * API Key authentication middleware.
 * Accepts X-API-Key header, validates against hashed keys in DB.
 * Sets req.user from the key's owner.
 */
import type { Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'
import { db } from '../db/index.js'
import { apiKeys, users } from '../db/schema.js'
import { eq, and, isNull } from 'drizzle-orm'

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string
  if (!key) return res.status(401).json({ error: 'X-API-Key header required' })

  try {
    const hash = createHash('sha256').update(key).digest('hex')
    const [found] = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, hash))
      .limit(1)

    if (!found) return res.status(401).json({ error: 'Invalid API key' })
    if (found.revokedAt) return res.status(401).json({ error: 'API key revoked' })
    if (found.expiresAt && found.expiresAt < new Date()) {
      return res.status(401).json({ error: 'API key expired' })
    }

    // Update last used
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, found.id))

    // Load user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, found.userId))
      .limit(1)

    if (!user) return res.status(401).json({ error: 'User not found' })

    // Set user on request (same shape as Better Auth)
    ;(req as any).user = user
    ;(req as any).apiKey = found
    next()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

/**
 * Check if API key has required permission.
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req as any).apiKey
    if (!key) return next() // Session auth doesn't need permission check

    const permissions = (key.permissions as string[]) || []
    if (!permissions.includes(permission) && !permissions.includes('*')) {
      return res.status(403).json({ error: `API key missing permission: ${permission}` })
    }
    next()
  }
}
