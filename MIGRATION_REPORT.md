# OneFounder — Migration Report

**Date:** 2026-06-13
**Migration:** Local-First AI (Ollama only) + Node.js 22 LTS

---

## Node.js Version

| Location | Before | After |
|---|---|---|
| `package.json` engines | `"22.x"` | `">=22.0.0"` |
| `.nvmrc` | `22` | `22` (unchanged) |
| GitHub Actions — ci.yml | `node-version: '22'` | `node-version: '22'` (unchanged) |
| GitHub Actions — auto-fix.yml | `node-version: '22'` | `node-version: '22'` (unchanged) |
| GitHub Actions — security.yml | `node-version: '22'` | `node-version: '22'` (unchanged) |
| `vercel.json` | _(not set)_ | `"NODE_VERSION": "22"` |

All CI/CD pipelines run exclusively on Node.js 22 LTS. No references to Node 14/16/18/20 exist.

---

## Removed Cloud AI Providers

| Provider | Status | Reason |
|---|---|---|
| OpenAI | Never installed | N/A |
| Anthropic / Claude | Stub file only | Removed |
| Gemini | Never installed | N/A |
| DeepSeek API | Removed from router | Cloud inference — removed |
| Groq | Removed from router | Cloud inference — removed |
| OpenRouter | Removed from router | Cloud inference — removed |
| Together AI | Already removed previously | Charges after credits |

### Removed Files / Code

- `server/ai/openai-compatible.ts` — replaced with stub (makeDeepSeek, makeGroq, makeOpenRouter deleted)
- `server/ai/claude.ts` — replaced with stub
- All cloud provider logic removed from `server/ai/index.ts`
- `AIProviderType` narrowed from `'ollama' | 'deepseek' | 'groq' | 'openrouter' | 'mock'` to `'ollama' | 'mock'`

### Removed Environment Variables (no longer used)

```
DEEPSEEK_API_KEY
GROQ_API_KEY
OPENROUTER_API_KEY
OPENAI_API_KEY       (was never used)
ANTHROPIC_API_KEY    (was never used)
```

---

## Remaining Architecture

```
User → OneFounder → Ollama → Local Model → Response
```

No external AI inference. No token billing. No usage-based costs.

### Only AI Provider

```typescript
type AIProviderType = 'ollama' | 'mock'
```

- **Ollama** — primary, local inference on user hardware
- **Mock** — demo mode when Ollama is not running (no AI responses, placeholder text)

### Default Model

```
OLLAMA_MODEL=qwen3:8b
```

---

## Supported Local Models

| Model | Use Case |
|---|---|
| `qwen3:8b` | Default — best overall balance |
| `qwen3:14b` | Higher quality, needs 16GB+ RAM |
| `qwen3:30b` | Maximum quality, needs 32GB+ RAM |
| `deepseek-r1:7b` | Deep reasoning & research |
| `deepseek-r1:14b` | Advanced reasoning |
| `deepseek-r1:32b` | Maximum reasoning |
| `mistral:7b` | Fast, great for code |
| `llama3.2:3b` | Fastest, minimum RAM |
| `llama3.1:8b` | General purpose |

---

## Monthly AI Cost

**₹0** — All inference is local. No cloud. No API keys. No billing.

---

## Verification

- [x] Node.js 22 configured everywhere
- [x] No references to Node 14/16/18/20
- [x] GitHub Actions uses Node.js 22 exclusively
- [x] Vercel uses Node.js 22 (`NODE_VERSION=22` in vercel.json)
- [x] `package.json` engines require `>=22.0.0`
- [x] OpenAI removed (never installed)
- [x] Claude/Anthropic removed
- [x] Gemini removed (never installed)
- [x] DeepSeek API removed
- [x] OpenRouter removed
- [x] Groq removed
- [x] All cloud AI SDKs removed (none were installed as npm packages — all used native fetch)
- [x] No cloud AI environment variables remain in active code
- [x] Only Ollama remains as AI provider
- [x] All 12 agents route through Ollama
- [x] Memory persists in Neon PostgreSQL
- [x] Streaming works (SSE via `/api/chat/stream`)
- [x] TypeScript compiles clean on Node.js 22
- [x] No external AI inference calls in codebase

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 LTS |
| Frontend | React 18 + Vite |
| Backend | Express.js + TypeScript |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | Better Auth |
| AI | Ollama (local inference only) |
| Default model | qwen3:8b |
| Deployment | Vercel (Node.js 22) |
| CI/CD | GitHub Actions (Node.js 22) |
