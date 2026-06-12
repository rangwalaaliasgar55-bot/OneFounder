---
name: OneFounder Supreme v3 Architecture
description: Multi-agent system, memory retrieval, RAG, task planner all built; brain.ts enriched with parallel context assembly before every response
---

## What Was Built

### Multi-Agent System (server/agents/supervisorAgent.ts)
- `executeMultiAgent()` — auto-selects specialists via regex patterns, runs them all via `Promise.all`, synthesizes results into one response
- 12 specialist agents: research, engineering, marketing, seo, finance, sales, security, devops, product, data, legal, startup
- Each specialist has its own system prompt template focused on its domain
- API: `POST /api/agents/execute` and `POST /api/agents/stream`

### Memory System (server/memory/)
- `memoryManager.ts` — `storeMemory()`, `getAllMemories()`, `deleteMemory()`, `buildMemoryContext()`, `assembleFounderContext()`
- `memoryRetrieval.ts` — `retrieveRelevantMemories()` using BM25-like keyword scoring + importance weighting
- API: `GET/POST /api/memory`, `DELETE /api/memory/:id`, `GET /api/memory/search?q=`
- brain.ts calls `getMemoryContextForQuery()` before every response (fire-and-forget, parallel)

### RAG System (server/rag/)
- `chunker.ts` — semantic chunking with overlap, supports markdown section extraction
- `retriever.ts` — BM25 scoring over knowledgeBase table chunks (no external vector DB needed)
- `contextAssembler.ts` — `assembleRAGContext()` called in brain.ts before every response
- brain.ts injects memory context + RAG context into systemPrompt before calling AI

### Task System (server/tasks/taskPlanner.ts)
- `generateTaskPlan()`, `generateSprintPlan()`, `generateLaunchChecklist()`, `generateDailyBriefing()`
- `saveTasksToDatabase()` writes to existing `tasks` table
- API: `POST /api/tasks/plan`, `/tasks/sprint`, `/tasks/launch-checklist`, `GET /api/tasks/briefing`

### Knowledge Graph (server/knowledge/)
- `entityExtractor.ts` — extracts business entities from conversations, stores as semantic memories
- `graphQueries.ts` — builds graph view from semantic memories in aiMemories table
- Called fire-and-forget from brain.ts after every conversation turn

### New UI Pages
- `/agents` — Supreme Multi-Agent Panel (AgentPage.tsx): select agents, run parallel execution, see individual + synthesized results
- `/memory` — Memory Panel (MemoryPage.tsx): browse, search, filter, add, delete memories
- `/tasks` — Task Center (TasksPage.tsx): AI task planner, sprint generator, launch checklist, daily briefing

### ChatPage Enhanced
- Added 3rd tab: ⚡ Supreme Mode with all 12 specialist agents in sidebar
- Auto-select vs manual select toggle
- Agents animate while active (pulsing amber dots)

### AppShell Updated
- New "OS Core" section: Dashboard, AI Chat, Supreme Agents, Memory, Task Center

**Why this matters:** brain.ts now assembles 3 context streams in parallel (founder memory, relevant memories for query, RAG from knowledge base) before every AI response — AI gets smarter from context, not just bigger prompts.
