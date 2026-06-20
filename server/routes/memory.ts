import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { MemoryCreateSchema } from '../middleware/schemas.js'
import { getAllMemories, getMemoriesByType, storeMemory, deleteMemory, buildMemoryContext } from '../memory/memoryManager.js'
import { retrieveRelevantMemories } from '../memory/memoryRetrieval.js'
import { getMemoryStats, applyMemoryDecay } from '../memory/memoryV2.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { type, limit } = req.query

  try {
    if (type && typeof type === 'string') {
      const memories = await getMemoriesByType(user.id, type, Number(limit) || 50)
      return res.json({ memories })
    }
    const memories = await getAllMemories(user.id, Number(limit) || 100)
    res.json({ memories })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/context', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const context = await buildMemoryContext(user.id)
    res.json({ context })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/search', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { q } = req.query
  if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Query required' })

  try {
    const memories = await retrieveRelevantMemories(user.id, q, 20)
    res.json({ memories })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, validate(MemoryCreateSchema), async (req, res) => {
  const user = (req as any).user
  const { type, content, importance, tags } = req.body

  try {
    await storeMemory(user.id, type, content, 'manual', importance || 7, tags || [])
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    await deleteMemory(user.id, req.params.id as string)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── Memory V2 endpoints ─────────────────────────────────────────────────────

router.get('/stats', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const stats = await getMemoryStats(user.id)
    res.json(stats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/decay', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const decayed = await applyMemoryDecay(user.id)
    res.json({ decayed })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
