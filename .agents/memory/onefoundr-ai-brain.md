---
name: ONEFOUNDER AI Brain
description: Architecture of the custom AI Brain layer — routing, prompt enhancement, streaming, Ollama-only policy
---

## Architecture

The AI Brain sits above Ollama as a custom intelligence layer in `server/ai/`:

- `router.ts` — detects intent via regex patterns → returns ExpertMode + confidence + keywords
- `promptEnhancer.ts` — maps ExpertMode to expert system prompts + structured output templates
- `brain.ts` — orchestrates: route → enhance → context → web search → Ollama → memory
- `index.ts` — Ollama-only provider selection (mock fallback); no Claude/OpenAI

## Key decisions

**Why regex routing instead of AI routing:** Zero latency, zero cost, deterministic. Patterns cover code/seo/security/data/research/startup. Falls back to "founder" mode when confidence is low.

**Why temp-file Python sandbox:** Avoids shell injection via `-c` flag. Wrapper strips dangerous builtins at runtime (not just static blocklist).

**Regex gotcha:** `\bkeyword\b` does NOT match "keywords" — must use `keywords?` in patterns.

**Streaming:** SSE via `/api/chat/stream`. Tries Ollama streaming first; falls back to non-streaming `ai.chat()` with simulated word-by-word delivery. Frontend shows blinking cursor + live tokens.

## Ollama-only policy

`server/ai/index.ts` has NO Claude/OpenAI import. Claude.ts still exists as a dead file but is not imported anywhere in the main AI layer.

**Why:** User requirement — local-first, free, no external AI APIs.
