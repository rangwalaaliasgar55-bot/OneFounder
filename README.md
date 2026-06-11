# OneFounder — The Operating System for Founders

> Discover, validate, build, and grow your business — all from one platform, powered by free AI.

OneFounder is a full-stack SaaS platform that replaces a dozen disconnected tools with a single command centre. It combines an AI brain (running on local Ollama or Claude), project management, CRM, finance tracking, SEO tooling, and content creation into one dark-mode workspace built for solo founders and small teams.

---

## Features

### AI Brain — 9 Expert Modes

The AI engine automatically routes every message to the right specialist:

| Mode | Trigger keywords | Capability |
|------|-----------------|-----------|
| 🧠 Founder AI | General questions | Cross-domain founder advice with full business context |
| 💻 Code Expert | code, bug, typescript, react | Full-stack engineering, TypeScript, system design |
| 🔍 SEO Expert | seo, keywords, ranking, traffic | Technical SEO, content strategy, exact meta copy |
| 🔒 Security Expert | vulnerability, xss, csrf, auth | OWASP Top 10, pen-test level analysis + remediation |
| 📊 Data Analyst | metrics, kpi, mrr, cohort | Analysis with calculations, SQL, visualisation recs |
| 🔬 Research Expert | competitor, market, trend, news | Real-time web context via DuckDuckGo + Google News |
| 💰 Finance Expert | revenue, burn rate, fundraising | SaaS metrics, cap tables, unit economics, benchmarks |
| 🧩 Product Expert | roadmap, ux, sprint, pmf | RICE/Kano/JTBD frameworks, outcome-driven advice |
| 🚀 Startup Advisor | strategy, gtm, hire, scale | YC-style direct advice with mental models |

### Platform Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Company command centre with morning briefing & health scores |
| **Idea Lab** | AI-powered startup idea generation tailored to your skills |
| **Market Research** | Competitor analysis, SWOT, trend reports |
| **Business Planner** | Complete business plan with financial projections |
| **Project Management** | Kanban boards, milestones, task tracking |
| **Content Studio** | Blog, LinkedIn, newsletters, ad copy generation |
| **CRM** | Lead & customer pipeline management |
| **Social Media** | AI post generation for LinkedIn, X, Instagram, TikTok, Facebook |
| **Finance Tracker** | MRR, ARR, expenses, profit — with charts |
| **SEO OS** | Keyword tracking, content brief generator, site audits |
| **Knowledge Base** | Document storage and search |
| **Founder Journey** | Gamified milestones with XP tracking |
| **WordPress Manager** | Manage WordPress sites from within OneFounder |
| **AI Chat** | Multi-agent chat with model and mode switching |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS (dark glassmorphism) |
| **Backend** | Express.js, TypeScript, Node.js 22 |
| **Database** | PostgreSQL (Neon/Replit) + Drizzle ORM |
| **Auth** | Better Auth (email, Google, GitHub) |
| **AI — Primary** | Ollama (free, local, open-source) |
| **AI — Fallback** | Claude via Replit AI integration |
| **Deployment** | Replit (dev) + Vercel (production) |

---

## Project Structure

```
onefoundr/
├── api/
│   └── server.ts              # Vercel serverless entry point
├── client/
│   ├── src/
│   │   ├── pages/             # 14 page components
│   │   ├── components/        # Layout + reusable UI
│   │   ├── hooks/             # useAuth and other hooks
│   │   ├── App.tsx            # Router, auth shell, idle prefetching
│   │   └── main.tsx           # React root
│   └── vite.config.ts         # Vite + inline PostCSS config
├── server/
│   ├── ai/
│   │   ├── brain.ts           # OneFounderBrain — core orchestrator
│   │   ├── router.ts          # Intent detection → 9 expert modes
│   │   ├── masterPrompt.ts    # Identity + full domain knowledge base
│   │   ├── promptEnhancer.ts  # Per-mode prompt sharpening
│   │   ├── context.ts         # Assembles full founder context from DB
│   │   ├── memory.ts          # Persistent memory extraction + storage
│   │   ├── webSearch.ts       # Real-time DuckDuckGo + Google News RSS
│   │   ├── ollama.ts          # Ollama LLM provider
│   │   ├── claude.ts          # Claude provider (SDK + streaming)
│   │   ├── mock.ts            # Demo mode fallback
│   │   └── index.ts           # Provider factory: Ollama → Claude → Mock
│   ├── routes/                # 20 API route modules
│   ├── db/
│   │   ├── schema.ts          # Drizzle ORM schema (27 tables)
│   │   └── index.ts           # Neon serverless DB connection
│   ├── auth.ts                # Better Auth config
│   └── index.ts               # Express app + middleware
├── .github/
│   └── workflows/
│       └── ci.yml             # CI: install + type-check + build
├── .npmrc                     # legacy-peer-deps=true, strict-peer-deps=false
├── vercel.json                # Vercel deployment config
├── tailwind.config.js         # Tailwind at root (required by Vite PostCSS)
└── package.json               # Single workspace package.json
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL (or use the Replit built-in — auto-configured)
- Optional: [Ollama](https://ollama.ai) for local AI

### 1. Clone and install

```bash
git clone https://github.com/your-username/onefoundr.git
cd onefoundr
npm install --legacy-peer-deps
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-64-char-random-secret
BETTER_AUTH_URL=http://localhost:3001
CLIENT_URL=http://localhost:5000
NODE_ENV=development
```

> On Replit, `DATABASE_URL` is auto-provisioned. Run `npm run db:push` once to create tables.

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Start development

```bash
npm run dev          # starts both server (:3001) and client (:5000)

# or separately:
npm run dev:server   # Express backend on port 3001
npm run dev:client   # Vite frontend on port 5000
```

Open `http://localhost:5000`.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | Session encryption key (64+ random chars) |
| `BETTER_AUTH_URL` | ✅ | Backend base URL (`http://localhost:3001` in dev) |
| `CLIENT_URL` | ✅ | Frontend base URL (`http://localhost:5000` in dev) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `OLLAMA_BASE_URL` | ❌ | Ollama server URL (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | ❌ | Model name (default: `llama3.2`) |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | ❌ | Auto-provisioned by Replit AI integration |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | ❌ | Auto-provisioned by Replit AI integration |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth (for social login) |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth (for social login) |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth |

---

## AI Setup

OneFounder works in **demo mode** without any AI. For real responses:

### Option A — Ollama (free, local, private)

```bash
# Install: https://ollama.ai
ollama serve
ollama pull llama3.2       # fast, general purpose
ollama pull deepseek-r1    # best for reasoning + code
ollama pull qwen2.5        # strong multilingual
ollama pull mistral        # balanced
```

### Option B — Claude (auto on Replit)

When deployed on Replit with the Anthropic AI integration enabled, Claude is used automatically when Ollama is not running. No API key setup needed.

### Provider priority

```
Ollama (local)  →  Claude (Replit integration)  →  Demo mode
```

---

## Building for Production

```bash
npm run build:client    # frontend only (Vercel)
npm run build           # frontend + backend
npm start               # run production server
```

---

## Deployment

### Vercel

Pre-configured via `vercel.json`:

- **Install**: `npm install --legacy-peer-deps`
- **Build**: `npm run build:client`
- **Output**: `dist/client`
- **API**: `api/server.ts` → Vercel serverless function (Node.js, 30s timeout)

Set these environment variables in your Vercel project settings:
`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_URL`

### Replit

Workflows are pre-configured. Run once to set up the database:

```bash
npm run db:push
```

---

## Database Management

```bash
npm run db:push     # apply schema to database
npm run db:studio   # open Drizzle Studio (visual DB browser)
```

Schema lives in `server/db/schema.ts` — 27 tables covering users, auth, ideas, projects, tasks, leads, content, finance, SEO, social, AI memories, and journey milestones.

---

## CI / GitHub Actions

Every push to `main` / `master` runs:

1. `npm install --legacy-peer-deps`
2. TypeScript type-check (`server/`)
3. `npm run build:client` (simulates Vercel build)
4. Dependency conflict audit

See `.github/workflows/ci.yml`.

---

## Contributing

1. Fork the repo
2. Branch: `git checkout -b feature/your-feature`
3. Make changes, ensure CI passes locally: `npm install --legacy-peer-deps && npm run build:client`
4. Open a pull request against `main`

---

## License

MIT — free to use, modify, and distribute.
