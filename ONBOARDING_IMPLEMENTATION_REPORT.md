# Onboarding Implementation Report

**Date:** 2026-06-13  
**Version:** OneFounder 2.0 — Mandatory Local-AI Onboarding

---

## Overview

This report documents the mandatory first-run onboarding flow implemented for OneFounder. Every new user must complete AI engine setup before accessing the platform.

---

## User Flow

```
Registration / Login
    ↓
[onboardingCompleted = false] ← Gate enforced in App.tsx
    ↓
SetupPage — Mandatory 7-step wizard
    ↓
Step 1: Welcome        — Local-first guarantee explained
Step 2: Ollama Check   — Install + start instructions (Win/Mac/Linux)
Step 3: Model Select   — Auto-recommendation from RAM detection
Step 4: Model Pull     — SSE-streamed download with progress bar
Step 5: Verify         — Inference test + 12 agent validation
Step 6: Profile        — Name, company, industry, stage
Step 7: Done           → onboardingCompleted = true → Enter Dashboard
```

---

## Database Changes

**Table:** `users`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `onboarding_completed` | boolean | false | Gate flag — must be true to access dashboard |
| `ollama_configured`    | boolean | false | True after successful model verification |
| `selected_model`       | text    | null  | User's chosen Ollama model |
| `model_verified_at`    | timestamp | null | When model inference was last verified |

Migration applied via `drizzle-kit push` on 2026-06-13.

---

## New API Routes

### `GET /api/me`
Returns enriched user profile including onboarding state:
```json
{
  "id": "...",
  "email": "...",
  "onboardingCompleted": false,
  "ollamaConfigured": false,
  "selectedModel": "qwen3:8b",
  "tokenBalance": 100
}
```

### `POST /api/setup/complete`
Saves setup state and marks onboarding complete:
```json
{
  "selectedModel": "qwen3:8b",
  "ollamaVerified": true,
  "profile": { "name": "Alex", "company": "Acme", "industry": "SaaS / Software", "stage": "MVP" }
}
```

### `PATCH /api/setup/model`
Updates model selection post-onboarding (from Settings):
```json
{ "model": "qwen3:14b", "verified": true }
```

### Existing Ollama routes (used by wizard):
- `GET  /api/ollama/health` — RAM, models, running status
- `POST /api/ollama/pull`  — SSE-streamed model download
- `POST /api/ollama/test`  — Live inference latency test
- `DELETE /api/ollama/models/:name` — Remove local model

---

## RAM-Based Model Auto-Recommendation

| Detected RAM | Recommended Model | Rationale |
|--------------|------------------|-----------|
| < 6 GB       | llama3.2:3b      | Minimum viable, fastest |
| 6–14 GB      | qwen3:8b         | Best overall (default) |
| 14–28 GB     | qwen3:14b        | Higher quality reasoning |
| 28+ GB       | deepseek-r1:14b  | Maximum reasoning depth |

---

## Agent Validation

All 12 agents are validated during onboarding:
- Startup · Product · Marketing · SEO
- Research · Engineering · Security · Finance
- Sales · Data · DevOps · Legal

Validation runs a lightweight routing check + live inference test using the selected model. Results are stored per-user.

---

## Frontend Architecture

### Gate mechanism (`App.tsx`)
```tsx
if (!user.onboardingCompleted) {
  return <SetupPage onComplete={async () => { await refresh(); window.location.replace('/') }} />
}
```

The gate cannot be bypassed — the `AuthenticatedApp` (with all routes) is never mounted until `onboardingCompleted === true` in the DB.

### Session enrichment (`useAuth.ts`)
After `Better Auth` session check, `/api/me` is fetched to load `onboardingCompleted`, `ollamaConfigured`, `selectedModel` into the user object.

### OS-aware install instructions
The wizard detects the user's OS from `navigator.userAgent` and shows:
- **macOS**: `brew install ollama` or download from ollama.ai
- **Windows**: `winget install Ollama.Ollama` or installer download
- **Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`

All commands have one-click copy buttons.

---

## Dashboard AI Status Widget

Added to right column of Dashboard:
- Live Ollama status (online/offline with pulsing indicator)
- Active model name
- RAM usage bar (free/total with color coding)
- List of all installed models
- Auto-refreshes every 30 seconds (setInterval)
- Manual ↻ refresh button
- Last-checked timestamp

---

## Offline Behavior

| Ollama State | App Behavior |
|-------------|--------------|
| Online + model installed | Full AI access |
| Online + no model | Offer model pull in wizard |
| Offline (during onboarding) | Block at Check step, show install guide |
| Offline (after onboarding) | Yellow banner in app shell, AI routes return 503 |

---

## Node.js 22 Compatibility

All new code uses:
- `fetch` (native in Node 22, no polyfill needed)
- `structuredClone`-safe objects
- No `require()` — ESM-compatible imports throughout
- No deprecated Node 18 APIs

---

## Files Created / Modified

| File | Action |
|------|--------|
| `server/db/schema.ts` | Added 4 columns to users table |
| `server/middleware/auth.ts` | Exposes new DB fields in req.user |
| `server/routes/setup.ts` | New: /api/me, /api/setup/complete, /api/setup/model |
| `server/index.ts` | Registered setup routes |
| `client/src/pages/SetupPage.tsx` | New: 7-step mandatory onboarding wizard |
| `client/src/hooks/useAuth.ts` | Fetches /api/me for extended user fields |
| `client/src/App.tsx` | Gates on onboardingCompleted, removes optional wizard |
| `client/src/pages/DashboardPage.tsx` | Added AIStatusWidget with 30s live refresh |
| `.env.vercel.example` | Vercel environment variable documentation |

---

## Vercel Environment Variables

See `.env.vercel.example` for the full annotated list. Required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | 32+ char session encryption secret |
| `BETTER_AUTH_URL` | ✅ | Production URL (e.g. https://app.vercel.app) |
| `NODE_VERSION` | ✅ | Must be `22` |
| `OLLAMA_BASE_URL` | optional | Default: `http://localhost:11434` |
| `OLLAMA_MODEL` | optional | Default: `qwen3:8b` |

**Note on Vercel + Ollama:** Ollama runs on the user's machine, not on Vercel's servers. For a hosted multi-tenant setup, users need Ollama installed locally. Vercel only hosts the frontend and API gateway; AI inference is always local.

---

## Status: ✅ Complete
