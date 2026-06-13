import { Router } from 'express'
import os from 'os'

const router = Router()

const OLLAMA_BASE = () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

const RECOMMENDED_MODELS = [
  { id: 'qwen3:8b',       label: 'Qwen3 8B',       ram: '8GB',  desc: 'Best overall — recommended default',  default: true },
  { id: 'qwen3:14b',      label: 'Qwen3 14B',      ram: '16GB', desc: 'Higher quality reasoning' },
  { id: 'deepseek-r1:7b', label: 'DeepSeek R1 7B', ram: '8GB',  desc: 'Deep reasoning & research' },
  { id: 'mistral:7b',     label: 'Mistral 7B',     ram: '8GB',  desc: 'Fast, great for code' },
  { id: 'llama3.1:8b',   label: 'Llama 3.1 8B',   ram: '8GB',  desc: 'General purpose' },
  { id: 'llama3.2:3b',   label: 'Llama 3.2 3B',   ram: '4GB',  desc: 'Fastest — minimum RAM' },
]

// GET /api/ollama/health
router.get('/health', async (_req, res) => {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    let running = false
    let models: string[] = []

    try {
      const r = await fetch(`${OLLAMA_BASE()}/api/tags`, { signal: controller.signal })
      clearTimeout(timer)
      if (r.ok) {
        running = true
        const data = await r.json() as any
        models = (data.models || []).map((m: any) => m.name)
      }
    } catch {
      clearTimeout(timer)
    }

    const totalRamGb = Math.round(os.totalmem() / (1024 ** 3) * 10) / 10
    const freeRamGb  = Math.round(os.freemem()  / (1024 ** 3) * 10) / 10

    res.json({
      running,
      baseUrl: OLLAMA_BASE(),
      models,
      totalRamGb,
      freeRamGb,
      ramWarning: totalRamGb < 8
        ? `Low RAM detected (${totalRamGb} GB total). Use llama3.2:3b (4 GB) or qwen3:4b (4 GB) for best results.`
        : null,
      recommended: RECOMMENDED_MODELS,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/ollama/pull — SSE streaming pull progress
router.post('/pull', async (req, res) => {
  const { model } = req.body
  if (!model || typeof model !== 'string') return res.status(400).json({ error: 'model required' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    send({ status: 'starting', message: `Pulling ${model}...` })

    const r = await fetch(`${OLLAMA_BASE()}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: true }),
      signal: AbortSignal.timeout(600_000), // 10 min for large models
    })

    if (!r.ok || !r.body) {
      send({ status: 'error', message: `Ollama returned ${r.status}` })
      res.end()
      return
    }

    const reader = r.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line) as any
          if (obj.status === 'success') {
            send({ status: 'done', message: `${model} ready!` })
          } else if (obj.total && obj.completed) {
            const pct = Math.round((obj.completed / obj.total) * 100)
            send({ status: 'progress', message: obj.status, pct, completed: obj.completed, total: obj.total })
          } else {
            send({ status: 'info', message: obj.status || '' })
          }
        } catch {}
      }
    }

    send({ status: 'done', message: `${model} is ready!` })
  } catch (err: any) {
    send({ status: 'error', message: err.message || 'Pull failed' })
  }

  res.end()
})

// POST /api/ollama/test — quick inference test
router.post('/test', async (req, res) => {
  const model = req.body?.model || process.env.OLLAMA_MODEL || 'qwen3:8b'
  const start = Date.now()
  try {
    const r = await fetch(`${OLLAMA_BASE()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "OneFounder AI online" and nothing else.' }],
        stream: false,
        options: { num_predict: 20 },
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!r.ok) {
      const t = await r.text().catch(() => '')
      return res.status(503).json({ success: false, error: `Ollama error ${r.status}: ${t}` })
    }
    const data = await r.json() as any
    const response = data.message?.content || data.response || ''
    res.json({ success: true, response, latencyMs: Date.now() - start, model })
  } catch (err: any) {
    res.status(503).json({ success: false, error: err.message, latencyMs: Date.now() - start })
  }
})

// DELETE /api/ollama/models/:name — delete a local model
router.delete('/models/:name', async (req, res) => {
  const name = decodeURIComponent(req.params.name)
  try {
    const r = await fetch(`${OLLAMA_BASE()}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!r.ok) return res.status(r.status).json({ error: `Ollama returned ${r.status}` })
    res.json({ success: true, deleted: name })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
