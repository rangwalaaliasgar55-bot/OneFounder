/**
 * OneFounder Provider Management API
 *
 * Endpoints for listing, testing, and managing AI providers.
 * All endpoints require authentication. Config and fallback endpoints require admin.
 */

import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { registry } from '../ai/index.js'
import type { ProviderType } from '../ai/types.js'

const router = Router()

// All provider routes require authentication
router.use(requireAuth)

/**
 * GET /api/providers
 * List all registered providers with their current status
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const statuses = await registry.getStatus()
    const priorityOrder = registry.getPriorityOrder()

    res.json({
      providers: statuses,
      priorityOrder,
      totalRegistered: statuses.length,
      available: statuses.filter(s => s.available).length,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/providers/health
 * Health check all registered providers
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    registry.clearCache()
    const statuses = await registry.getStatus()
    const available = statuses.filter(s => s.available)
    const unavailable = statuses.filter(s => !s.available)

    res.json({
      healthy: available.length > 0,
      total: statuses.length,
      available: available.map(s => ({
        type: s.type,
        name: s.name,
        baseUrl: s.baseUrl,
        defaultModel: s.defaultModel,
        modelCount: s.models.length,
        latencyMs: s.latencyMs,
      })),
      unavailable: unavailable.map(s => ({
        type: s.type,
        name: s.name,
        error: s.error,
      })),
      checkedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/providers/fallback
 * Get the current fallback priority order
 */
router.get('/fallback', (_req: Request, res: Response) => {
  try {
    const priorityOrder = registry.getPriorityOrder()
    const all = registry.getAll()

    res.json({
      priorityOrder,
      registered: all.map(p => p.type),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/providers/:type
 * Get status of a specific provider
 */
router.get('/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ProviderType
    const provider = registry.get(type)

    if (!provider) {
      return res.status(404).json({ error: `Provider '${type}' is not registered` })
    }

    const status = await provider.getStatus()
    const priorityOrder = registry.getPriorityOrder()
    const priority = priorityOrder.indexOf(type)

    res.json({
      ...status,
      priority: priority >= 0 ? priority : null,
      inFallbackChain: priority >= 0,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/providers/:type/test
 * Test a specific provider by sending a test message
 */
router.post('/:type/test', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ProviderType
    const provider = registry.get(type)

    if (!provider) {
      return res.status(404).json({ error: `Provider '${type}' is not registered` })
    }

    const testPrompt = req.body?.prompt || 'Say "OneFounder AI online" and nothing else.'
    const model = req.body?.model
    const start = Date.now()

    try {
      const response = await provider.generate(testPrompt, undefined, {
        model,
        maxTokens: 50,
        signal: AbortSignal.timeout(30_000),
      })

      res.json({
        success: true,
        provider: type,
        response,
        latencyMs: Date.now() - start,
        model: model || 'default',
      })
    } catch (testErr: any) {
      res.status(503).json({
        success: false,
        provider: type,
        error: testErr.message,
        latencyMs: Date.now() - start,
      })
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/providers/config
 * Update provider configuration — admin only
 */
router.post('/config', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin only' })
    }

    const { type, baseUrl, apiKey, defaultModel } = req.body
    if (!type) {
      return res.status(400).json({ error: 'type is required' })
    }

    const provider = registry.get(type as ProviderType)
    if (!provider) {
      return res.status(404).json({ error: `Provider '${type}' is not registered` })
    }

    // Update env vars for the session (not persisted to disk — that would require .env file editing)
    if (baseUrl) {
      const envKey = `${type.toUpperCase()}_BASE_URL`
      process.env[envKey] = baseUrl
    }
    if (apiKey) {
      const envKeyMap: Record<string, string> = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        gemini: 'GEMINI_API_KEY',
        termux: 'TERMUX_AI_KEY',
      }
      const envKey = envKeyMap[type]
      if (envKey) process.env[envKey] = apiKey
    }

    // For model changes, try to update the provider if it supports setDefaultModel
    if (defaultModel && typeof (provider as any).setDefaultModel === 'function') {
      (provider as any).setDefaultModel(defaultModel)
    }

    // Clear cache so health checks reflect changes
    registry.clearCache()

    const status = await provider.getStatus()
    res.json({
      success: true,
      message: `Provider '${type}' configuration updated (session only — restart to reset)`,
      status,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/providers/fallback
 * Set the fallback priority order — admin only
 */
router.post('/fallback', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin only' })
    }

    const { order } = req.body
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order must be a non-empty array of provider types' })
    }

    // Validate that all entries are valid provider types
    const validTypes: ProviderType[] = ['ollama', 'openai', 'anthropic', 'gemini', 'lmstudio', 'openrouter', 'termux']
    for (const t of order) {
      if (!validTypes.includes(t)) {
        return res.status(400).json({ error: `Invalid provider type: '${t}'. Valid types: ${validTypes.join(', ')}` })
      }
    }

    registry.setPriorityOrder(order as ProviderType[])

    res.json({
      success: true,
      priorityOrder: registry.getPriorityOrder(),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
