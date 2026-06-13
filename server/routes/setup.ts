import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

const router = Router()

// GET /api/me — extended user profile including onboarding state
router.get('/me', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin,
      tokenBalance: users.tokenBalance,
      tokenUsed: users.tokenUsed,
      onboardingCompleted: users.onboardingCompleted,
      ollamaConfigured: users.ollamaConfigured,
      selectedModel: users.selectedModel,
      modelVerifiedAt: users.modelVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)
  res.json(row ?? user)
})

// POST /api/setup/complete — mark onboarding done, save model selection
router.post('/complete', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { selectedModel, ollamaVerified, profile } = req.body

  try {
    await db.update(users).set({
      onboardingCompleted: true,
      ollamaConfigured: ollamaVerified === true,
      selectedModel: selectedModel || 'qwen3:8b',
      modelVerifiedAt: ollamaVerified ? new Date() : undefined,
      name: profile?.name || user.name,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id))

    // Save name update if provided
    if (profile?.name && profile.name !== user.name) {
      await db.update(users).set({ name: profile.name, updatedAt: new Date() }).where(eq(users.id, user.id))
    }

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/setup/model — update selected model without full re-onboarding
router.patch('/model', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { model, verified } = req.body
  if (!model) return res.status(400).json({ error: 'model required' })
  try {
    await db.update(users).set({
      selectedModel: model,
      ollamaConfigured: verified === true,
      modelVerifiedAt: verified ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id))
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
