#!/usr/bin/env node
// ============================================================
// OneFounder Mobile AI — Ollama-Compatible Proxy Server
//
// Translates Ollama API calls to llama.cpp's HTTP API
// so OneFounder connects with zero code changes.
//
// Endpoints:
//   GET  /api/tags          → Health check + model listing
//   POST /api/chat          → Chat (streaming + non-streaming)
//   GET  /api/health        → Simple health check
// ============================================================

const express = require('express')
const http = require('http')

// ── Config ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PROXY_PORT || '11434')
const LLAMA_HOST = process.env.LLAMA_HOST || '127.0.0.1'
const LLAMA_PORT = parseInt(process.env.LLAMA_PORT || '8080')
const LLAMA_URL = `http://${LLAMA_HOST}:${LLAMA_PORT}`
const MODEL_NAME = process.env.MODEL_NAME || 'qwen2.5-1.5b-instruct'

// ── State ───────────────────────────────────────────────────
let llamaReady = false
let modelInfo = null

// ── Express setup ───────────────────────────────────────────
const app = express()
app.use(express.json({ limit: '10mb' }))

// ── Health check against llama-server ───────────────────────
async function checkLlamaHealth() {
  return new Promise((resolve) => {
    const req = http.get(`${LLAMA_URL}/health`, { timeout: 3000 }, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          llamaReady = parsed.status === 'ok' || res.statusCode === 200
        } catch {
          llamaReady = res.statusCode === 200
        }
        resolve(llamaReady)
      })
    })
    req.on('error', () => {
      llamaReady = false
      resolve(false)
    })
    req.on('timeout', () => {
      req.destroy()
      llamaReady = false
      resolve(false)
    })
  })
}

// Poll health every 10 seconds
setInterval(checkLlamaHealth, 10000)
checkLlamaHealth()

// ── Convert Ollama messages to a single prompt ──────────────
function messagesToPrompt(messages) {
  // Build a chat-formatted prompt using ChatML template
  let prompt = ''
  for (const msg of messages) {
    if (msg.role === 'system') {
      prompt += `<|im_start|>system\n${msg.content}<|im_end|>\n`
    } else if (msg.role === 'user') {
      prompt += `<|im_start|>user\n${msg.content}<|im_end|>\n`
    } else if (msg.role === 'assistant') {
      prompt += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`
    }
  }
  prompt += `<|im_start|>assistant\n`
  return prompt
}

// ── Helper: POST to llama-server ────────────────────────────
function callLlama(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = http.request(
      `${LLAMA_URL}/completion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 120000,
      },
      (res) => resolve(res)
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('llama-server timeout'))
    })
    req.write(data)
    req.end()
  })
}

// ── GET /api/tags — Model listing (Ollama compat) ──────────
app.get('/api/tags', async (_req, res) => {
  await checkLlamaHealth()
  res.json({
    models: [
      {
        name: MODEL_NAME,
        model: MODEL_NAME,
        modified_at: new Date().toISOString(),
        size: 0,
        digest: 'local-mobile',
        details: {
          parent_model: '',
          format: 'gguf',
          family: 'qwen2',
          families: ['qwen2'],
          parameter_size: '1.5B',
          quantization_level: 'Q4_K_M',
        },
      },
    ],
  })
})

// ── GET /api/health — Simple health ─────────────────────────
app.get('/api/health', async (_req, res) => {
  const ready = await checkLlamaHealth()
  res.json({ status: ready ? 'ok' : 'loading', model: MODEL_NAME })
})

// ── POST /api/chat — Chat completion (Ollama compat) ───────
app.post('/api/chat', async (req, res) => {
  const { messages, stream = false, options = {} } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  // Check llama-server is ready
  if (!llamaReady) {
    await checkLlamaHealth()
    if (!llamaReady) {
      return res.status(503).json({ error: 'Model is loading, try again in a moment' })
    }
  }

  // Build prompt from messages
  const prompt = messagesToPrompt(messages)

  // Build llama.cpp request
  const llamaBody = {
    prompt,
    temperature: options.temperature || 0.7,
    n_predict: options.num_predict || 512,
    stream,
    stop: ['<|im_end|>', '<|im_start|>'],
    repeat_penalty: 1.1,
  }

  try {
    const llamaRes = await callLlama(llamaBody)

    if (stream) {
      // ── Streaming mode ──
      res.setHeader('Content-Type', 'application/x-ndjson')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      let buffer = ''

      llamaRes.on('data', (chunk) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const jsonStr = trimmed.slice(6) // remove "data: "
          try {
            const parsed = JSON.parse(jsonStr)

            // Convert llama.cpp stream chunk to Ollama format
            const ollamaChunk = {
              model: MODEL_NAME,
              created_at: new Date().toISOString(),
              message: {
                role: 'assistant',
                content: parsed.content || '',
              },
              done: parsed.stop || false,
            }

            // Only include stats on final chunk
            if (parsed.stop) {
              ollamaChunk.total_duration = (parsed.timings?.total_predict_nanos || 0) +
                (parsed.timings?.prompt_eval_nanos || 0) +
                (parsed.timings?.eval_nanos || 0)
              ollamaChunk.eval_count = parsed.timings?.predicted_n || 0
              ollamaChunk.eval_duration = parsed.timings?.eval_nanos || 0
              ollamaChunk.prompt_eval_count = parsed.timings?.prompt_n || 0
            }

            res.write(JSON.stringify(ollamaChunk) + '\n')

            if (parsed.stop) {
              res.end()
            }
          } catch {
            // skip malformed JSON
          }
        }
      })

      llamaRes.on('end', () => {
        // Flush remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim()
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6))
              res.write(JSON.stringify({
                model: MODEL_NAME,
                created_at: new Date().toISOString(),
                message: { role: 'assistant', content: parsed.content || '' },
                done: true,
              }) + '\n')
            } catch {}
          }
        }
        res.end()
      })

      llamaRes.on('error', (err) => {
        res.write(JSON.stringify({ error: err.message }) + '\n')
        res.end()
      })
    } else {
      // ── Non-streaming mode ──
      let data = ''
      llamaRes.on('data', (chunk) => (data += chunk))
      llamaRes.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          res.json({
            model: MODEL_NAME,
            created_at: new Date().toISOString(),
            message: {
              role: 'assistant',
              content: parsed.content || '',
            },
            done: true,
            total_duration: (parsed.timings?.total_predict_nanos || 0) +
              (parsed.timings?.prompt_eval_nanos || 0),
            eval_count: parsed.timings?.predicted_n || 0,
            eval_duration: parsed.timings?.eval_nanos || 0,
            prompt_eval_count: parsed.timings?.prompt_n || 0,
          })
        } catch {
          res.status(500).json({ error: 'Failed to parse llama-server response' })
        }
      })
      llamaRes.on('error', (err) => {
        res.status(502).json({ error: err.message })
      })
    }
  } catch (err) {
    console.error('[proxy] Error:', err.message)
    res.status(502).json({ error: `Failed to connect to llama-server: ${err.message}` })
  }
})

// ── POST /api/generate — Text generation (Ollama compat) ───
app.post('/api/generate', async (req, res) => {
  const { prompt, system, stream = false, options = {} } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' })
  }

  // Convert to messages format and delegate to /api/chat
  const messages = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: prompt })

  // Re-use /api/chat logic by calling it internally
  req.body = { messages, stream, options }
  return app._router.handle(req, res, () => {}, 'POST', '/api/chat')
})

// ── Start server ────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('==========================================')
  console.log('  OneFounder Mobile AI Server')
  console.log('==========================================')
  console.log('')
  console.log(`  Proxy:       http://0.0.0.0:${PORT}`)
  console.log(`  llama.cpp:   ${LLAMA_URL}`)
  console.log(`  Model:       ${MODEL_NAME}`)
  console.log('')
  console.log('  Ollama-compatible endpoints:')
  console.log(`    GET  http://localhost:${PORT}/api/tags`)
  console.log(`    POST http://localhost:${PORT}/api/chat`)
  console.log(`    POST http://localhost:${PORT}/api/generate`)
  console.log('')
  console.log('  OneFounder config:')
  console.log(`    OLLAMA_BASE_URL=http://<your-phone-ip>:${PORT}`)
  console.log('')
  console.log('  Waiting for llama-server to be ready...')
  console.log('')
})
