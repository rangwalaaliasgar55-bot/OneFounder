import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getAllMemories, getMemoriesByType, storeMemory, deleteMemory, buildMemoryContext } from '../memory/memoryManager.js'
import { retrieveRelevantMemories } from '../memory/memoryRetrieval.js'

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

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { type, content, importance, tags } = req.body

  if (!type || !content) return res.status(400).json({ error: 'type and content required' })
  if (content.length > 2000) return res.status(400).json({ error: 'Content too long (max 2000 chars)' })

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

export default router
