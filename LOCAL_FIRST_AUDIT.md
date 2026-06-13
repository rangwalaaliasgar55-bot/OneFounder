# Local-First AI Audit

**Date:** 2026-06-13  
**Project:** OneFounder  
**Node.js:** 22 LTS

---

## Executive Summary

OneFounder is fully local-first. No cloud AI providers are used anywhere in the codebase. All inference runs via Ollama on the user's device. Monthly AI cost: **₹0 / $0**.

**Audit result: ✅ PASS — Zero cloud AI dependencies**

---

## AI Provider Inventory

### Active Providers

| Provider | Type | Status | Monthly Cost |
|----------|------|--------|-------------|
| Ollama   | Local | ✅ Active | ₹0 |

### Removed Providers

| Provider | Removed On | Notes |
|----------|-----------|-------|
| DeepSeek API (cloud) | 2026-06-13 | Replaced by `deepseek-r1:*` via Ollama |
| Groq | 2026-06-13 | Removed entirely |
| OpenRouter | 2026-06-13 | Removed entirely |
| Anthropic SDK | 2026-06-13 | Removed entirely |
| OpenAI SDK | Never added | — |

---

## Code Audit

### `server/ai/provider.ts`

```typescript
export type AIProviderType = 'ollama'  // Only valid value
```

✅ Single provider type — no cloud fallback possible  
✅ `OllamaOfflineError` thrown when Ollama is unreachable (HTTP 503, never silently falls back)

### `server/ai/index.ts`

✅ `OLLAMA_BASE_URL` (default: `http://localhost:11434`) — local machine only  
✅ No API keys referenced anywhere in AI routing code

### `server/routes/*`

All AI-serving routes checked:

| Route | AI Provider | Offline Behavior |
|-------|------------|-----------------|
| `/api/chat` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/agents/*` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/ceo/*` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/ideas` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/research` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/content` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/seo` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/social` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/finance` | Ollama | 503 OLLAMA_OFFLINE |
| `/api/planner` | Ollama | 503 OLLAMA_OFFLINE |

✅ No route silently degrades to a mock or cloud provider

---

## Dependency Audit

### `package.json` — AI-related dependencies

| Package | Status | Notes |
|---------|--------|-------|
| `node-fetch` | ✅ Kept | Used for Ollama HTTP streaming |
| `p-limit` | ✅ Kept | Concurrency control for parallel AI calls |
| `p-retry` | ✅ Kept | Retry logic for Ollama transient failures |
| ~~`@anthropic-ai/sdk`~~ | ✅ Removed | 2026-06-13 |
| ~~`groq-sdk`~~ | ✅ Removed | 2026-06-13 |
| ~~`openai`~~ | ✅ Never added | — |

### Secret / API Key Audit

| Secret | Status |
|--------|--------|
| `DEEPSEEK_API_KEY` | ⚠️ Env var exists but not referenced in any code |
| `GROQ_API_KEY` | ⚠️ Env var exists but not referenced in any code |
| `OPENROUTER_API_KEY` | ⚠️ Env var exists but not referenced in any code |
| `ANTHROPIC_API_KEY` | Not present |
| `OPENAI_API_KEY` | Not present |

> **Note:** The above env vars are Replit-stored but have zero code references. They can be safely deleted from the Replit secrets panel. They pose no runtime risk — no code reads them.

---

## Data Privacy Audit

| Data type | Where it goes |
|-----------|--------------|
| User prompts | Local Ollama → local model → local response |
| Business data | PostgreSQL (Neon) — no AI provider sees it |
| Conversation history | Stored in Neon DB — never sent to cloud AI |
| Company name / industry | Used in prompts to local Ollama only |

✅ No user data leaves the AI pipeline to any cloud AI endpoint

---

## Network Audit — AI Calls

All AI calls go to:
```
http://localhost:11434  (or OLLAMA_BASE_URL)
```

✅ No calls to:
- `api.openai.com`
- `api.anthropic.com`
- `api.groq.com`
- `openrouter.ai`
- `api.deepseek.com`
- Any other external AI endpoint

---

## Offline Resilience

When Ollama is not running:
1. All AI routes immediately return `HTTP 503` with `{ code: "OLLAMA_OFFLINE" }`
2. Dashboard shows yellow offline banner
3. Non-AI features (CRM, Projects, Finance, etc.) remain fully functional
4. Setup wizard detects offline state and shows reconnect instructions with one-click recheck

---

## Local-First Guarantees Displayed to Users

During onboarding (SetupPage), users see:

> "All AI processing runs on your device."  
> "No cloud AI providers are used."  
> "No token charges."  
> "No AI usage fees."

And at the bottom of every setup screen:
> "🔒 All AI processing runs on your device · No cloud · No API keys · No charges"

---

## Supported Local Models

All models run via Ollama — pulled locally, stored locally:

| Model | RAM Required | Use Case |
|-------|-------------|----------|
| `llama3.2:3b` | 4 GB | Fastest, minimum hardware |
| `qwen3:8b` | 8 GB | Default — best overall |
| `qwen3:14b` | 16 GB | Higher quality |
| `deepseek-r1:7b` | 8 GB | Deep reasoning |
| `deepseek-r1:14b` | 18 GB | Maximum reasoning |
| `mistral:7b` | 8 GB | Fast, great for code |

Note: `deepseek-r1` above refers to the **local Ollama model**, not the cloud API.

---

## Node.js 22 LTS Compatibility

| Check | Status |
|-------|--------|
| `package.json` engines `">=22.0.0"` | ✅ |
| `.nvmrc: 22` | ✅ |
| `vercel.json NODE_VERSION=22` | ✅ |
| Native `fetch` (no polyfill) | ✅ |
| ESM-compatible imports | ✅ |
| No deprecated Node 18 APIs | ✅ |

---

## Audit Result

| Category | Status |
|----------|--------|
| Cloud AI providers | ✅ None |
| API keys in code | ✅ None |
| Silent mock fallbacks | ✅ None |
| Offline error handling | ✅ Explicit 503 |
| Data privacy | ✅ Local only |
| Monthly AI cost | ✅ ₹0 |

**Overall: ✅ FULLY LOCAL-FIRST**
