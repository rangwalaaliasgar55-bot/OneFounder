# OneFounder — The OS for Founders

A complete SaaS platform for running an entire company from one place.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS (dark glassmorphism UI)
- **Backend**: Express.js + TypeScript
- **Database**: Replit PostgreSQL + Drizzle ORM
- **Auth**: Better Auth (email, Google, GitHub)
- **AI**: Ollama (local inference only — zero cloud costs)
- **Runtime**: Node.js 22 LTS

## Architecture
- `/client` — React + Vite frontend (port 5000 in dev, port 80 via Replit proxy)
- `/server` — Express backend (port 3001)
- `/server/ai` — Ollama provider abstraction layer
- `/server/db` — Drizzle ORM schema + Neon adapter
- `/server/routes` — All API routes
- `tailwind.config.js` — at workspace root (required for Vite inline PostCSS)
- `client/vite.config.ts` — inlines PostCSS config directly (no postcss.config file)

## Running
- **Backend**: `npm run dev:server` (port 3001)
- **Frontend**: `npm run dev:client` (port 5000)
- **DB Push**: `npm run db:push`

## AI Architecture — Local-First

OneFounder uses **Ollama exclusively**. No cloud AI providers. No API keys. No costs.

```
User → OneFounder → Ollama → Local Model → Response
```

Monthly AI cost: **₹0**

### Supported Models
| Model | Use Case |
|---|---|
| `qwen3:8b` | Default — best overall |
| `qwen3:14b` | Higher quality |
| `deepseek-r1:7b` | Deep reasoning & research |
| `mistral:7b` | Fast, great for code |
| `llama3.1:8b` | General purpose |
| `llama3.2:3b` | Fastest, minimum RAM |

### Setup
1. Install Ollama: https://ollama.ai
2. Run: `ollama serve`
3. Pull a model: `ollama pull qwen3:8b`

## Phase 1 Modules (Live)
1. Dashboard — Company command center
2. AI Agents — CEO, Marketing, Sales, SEO, Research, Operations, Product agents
3. Idea Lab — AI-powered startup idea generation
4. Market Research — Competitor & trend analysis
5. Business Planner — Full business plan generation
6. Project Management — Kanban boards & task tracking
7. Content Studio — Blog, LinkedIn, newsletters, ad copy
8. CRM — Lead & customer pipeline management
9. Knowledge Base — Document storage & search
10. Settings — AI status & module overview

## Phase 2 Modules (Live)
11. Social Media Manager — AI post generation for LinkedIn, X, Instagram, TikTok, Facebook
12. Finance Tracker — MRR, revenue, expenses, profit tracking
13. SEO OS — Keyword tracking, AI keyword research, content brief generator

## Phase 3 (Planned)
- Website/WordPress Manager
- Analytics Dashboard
- Automation Engine
- Marketplace (Templates & Industry Packs)
- Investor Mode (Pitch Decks & KPIs)

## Node.js Version
Node.js 22 LTS — configured in:
- `package.json` engines: `">=22.0.0"`
- `.nvmrc`: `22`
- All GitHub Actions workflows: `node-version: '22'`
- `vercel.json`: `NODE_VERSION=22`

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `BETTER_AUTH_SECRET` — Session encryption secret
- `BETTER_AUTH_URL` — Auth base URL
- `OLLAMA_BASE_URL` — Ollama server URL (default: http://localhost:11434)
- `OLLAMA_MODEL` — Default model (default: qwen3:8b)

## Removed Cloud Providers (Migration 2026-06-13)
- DeepSeek API — removed
- Groq — removed
- OpenRouter — removed
- All cloud AI SDKs — removed
- All cloud AI API keys — no longer used

See `MIGRATION_REPORT.md` for full details.

## User preferences
- Dark mode by default
- Linear/Notion/Vercel inspired UI
- Local-first AI (Ollama only — zero cost)
- Node.js 22 LTS everywhere
