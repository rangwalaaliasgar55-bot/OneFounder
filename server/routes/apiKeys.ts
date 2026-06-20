/**
 * API Keys — generate, list, revoke developer API keys.
 * Keys are hashed with SHA-256 before storage.
 * Only the prefix is stored for display.
 */
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { apiKeys } from '../db/schema.js'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { randomBytes, createHash } from 'crypto'
import { logAdminAction } from '../middleware/audit.js'

const router = Router()

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const bytes = randomBytes(32)
  const raw = `of_live_${bytes.toString('base64url')}`
  const hash = createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 15) // "of_live_abc1234"
  return { raw, hash, prefix }
}

// GET /api/api-keys — list user's keys (never returns full key)
router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const keys = await db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      permissions: apiKeys.permissions,
      rateLimit: apiKeys.rateLimit,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    }).from(apiKeys)
      .where(eq(apiKeys.userId, user.id))
      .orderBy(desc(apiKeys.createdAt))

    res.json(keys.map(k => ({
      ...k,
      isActive: !k.revokedAt && (!k.expiresAt || k.expiresAt > new Date()),
    })))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/api-keys — generate new key
router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { name, permissions, rateLimit, expiresInDays } = req.body

  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Name required (max 100 chars)' })
  }

  // Limit: 10 active keys per user
  const existing = await db.select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, user.id), isNull(apiKeys.revokedAt)))

  if (existing.length >= 10) {
    return res.status(400).json({ error: 'Maximum 10 active API keys. Revoke unused keys first.' })
  }

  try {
    const { raw, hash, prefix } = generateApiKey()

    const [key] = await db.insert(apiKeys).values({
      userId: user.id,
      name: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
      permissions: permissions || ['chat', 'generate'],
      rateLimit: rateLimit || 100,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    }).returning()

    await logAdminAction(req, 'api_key_created', key.id, { name })

    // Return the full key ONLY on creation — never shown again
    res.json({
      id: key.id,
      name: key.name,
      key: raw, // ⚠️ Only shown once!
      keyPrefix: prefix,
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      expiresAt: key.expiresAt,
      message: 'Store this key securely — it will not be shown again.',
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/api-keys/:id — revoke key
router.delete('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const [key] = await db.update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(apiKeys.id, req.params.id as string),
        eq(apiKeys.userId, user.id),
      ))
      .returning()

    if (!key) return res.status(404).json({ error: 'Key not found' })

    await logAdminAction(req, 'api_key_revoked', key.id, { name: key.name })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/api-keys/validate — validate an API key (used by middleware)
router.post('/validate', async (req, res) => {
  const { key } = req.body
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Key required' })

  try {
    const hash = createHash('sha256').update(key).digest('hex')
    const [found] = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, hash))
      .limit(1)

    if (!found) return res.status(401).json({ valid: false, error: 'Invalid key' })
    if (found.revokedAt) return res.status(401).json({ valid: false, error: 'Key revoked' })
    if (found.expiresAt && found.expiresAt < new Date()) {
      return res.status(401).json({ valid: false, error: 'Key expired' })
    }

    // Update last used
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, found.id))

    res.json({
      valid: true,
      userId: found.userId,
      permissions: found.permissions,
      rateLimit: found.rateLimit,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
