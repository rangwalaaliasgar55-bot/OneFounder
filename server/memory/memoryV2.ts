/**
 * Memory V2 — intelligent memory system.
 * Only stores high-signal memories with importance >= 8, confidence >= 0.8.
 * Deduplicates via content similarity. Categorizes automatically.
 * Applies memory decay over time.
 */
import { db } from '../db/index.js'
import { aiMemories } from '../db/schema.js'
import { eq, and, desc, sql, lt, gte } from 'drizzle-orm'
import { getAIProvider } from '../ai/index.js'

export type MemoryCategory =
  | 'personal' | 'business' | 'product' | 'technical'
  | 'goals' | 'preferences' | 'projects' | 'knowledge'
  | 'relationships' | 'strategies'

interface MemoryCandidate {
  content: string
  type: string
  importance: number
  confidence: number
  category: MemoryCategory
  source: string
  tags: string[]
}

const EXTRACTION_PROMPT = `Extract important facts from this conversation that a founder's AI should remember long-term.

Rules:
- Only extract HIGH-SIGNAL facts (importance >= 8/10)
- Skip generic advice, greetings, obvious facts
- Focus on: business decisions, preferences, goals, technical choices, relationships, strategies
- Each memory should be a single, clear, actionable fact

Categories: personal, business, product, technical, goals, preferences, projects, knowledge, relationships, strategies

Return JSON array:
[{
  "content": "specific fact to remember",
  "category": "one of the categories above",
  "importance": 8-10,
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2"]
}]

Return [] if nothing worth remembering.
Return ONLY valid JSON.`

export async function extractAndStoreMemoriesV2(
  userId: string,
  userMessage: string,
  assistantResponse: string,
  model: string
): Promise<number> {
  try {
    const ai = await getAIProvider()
    const conversation = `User: ${userMessage}\n\nAssistant: ${assistantResponse.slice(0, 2000)}`

    const raw = await ai.generate(conversation, EXTRACTION_PROMPT, {
      temperature: 0.1,
      maxTokens: 500,
    })

    const memories = parseMemories(raw)
    if (!memories || memories.length === 0) return 0

    let stored = 0
    for (const mem of memories) {
      // Filter: only store if importance >= 8 AND confidence >= 0.8
      if (mem.importance < 8 || mem.confidence < 0.8) continue

      // Deduplicate: check for similar existing memories
      const isDuplicate = await checkDuplicate(userId, mem.content)
      if (isDuplicate) {
        // Boost existing memory's importance instead of creating duplicate
        await boostExistingMemory(userId, mem.content, mem.importance)
        continue
      }

      // Store
      await db.insert(aiMemories).values({
        userId,
        type: mem.category || mem.type || 'knowledge',
        content: mem.content,
        source: model,
        importance: mem.importance,
        tags: mem.tags || [],
      })
      stored++
    }

    return stored
  } catch (err: any) {
    console.warn('[MemoryV2] Extraction failed:', err.message)
    return 0
  }
}

async function checkDuplicate(userId: string, newContent: string): Promise<boolean> {
  // Simple keyword-based dedup — check if an existing memory covers the same topic
  const existing = await db.select({ content: aiMemories.content, id: aiMemories.id })
    .from(aiMemories)
    .where(and(
      eq(aiMemories.userId, userId),
      gte(aiMemories.importance, 7),
    ))
    .limit(50)

  const newWords = new Set(newContent.toLowerCase().split(/\s+/).filter(w => w.length > 3))

  for (const mem of existing) {
    const existingWords = new Set(mem.content.toLowerCase().split(/\s+/).filter(w => w.length > 3))
    const overlap = [...newWords].filter(w => existingWords.has(w)).length
    const similarity = overlap / Math.max(newWords.size, 1)

    // If >60% word overlap, consider it a duplicate
    if (similarity > 0.6) return true
  }

  return false
}

async function boostExistingMemory(userId: string, similarContent: string, newImportance: number) {
  const existing = await db.select()
    .from(aiMemories)
    .where(and(eq(aiMemories.userId, userId), gte(aiMemories.importance, 7)))
    .limit(50)

  const newWords = new Set(similarContent.toLowerCase().split(/\s+/).filter(w => w.length > 3))

  for (const mem of existing) {
    const existingWords = new Set(mem.content.toLowerCase().split(/\s+/).filter(w => w.length > 3))
    const overlap = [...newWords].filter(w => existingWords.has(w)).length
    const similarity = overlap / Math.max(newWords.size, 1)

    if (similarity > 0.6) {
      // Boost importance and update timestamp
      await db.update(aiMemories)
        .set({
          importance: Math.min(10, Math.max(mem.importance ?? 5, newImportance)),
          lastReferencedAt: new Date(),
          referenceCount: (mem.referenceCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(aiMemories.id, mem.id))
      return
    }
  }
}

// ── Memory Decay ────────────────────────────────────────────────────────────
export async function applyMemoryDecay(userId: string): Promise<number> {
  // Memories not referenced in 30 days lose 1 importance point
  // Memories below importance 3 get deleted
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const stale = await db.select()
    .from(aiMemories)
    .where(and(
      eq(aiMemories.userId, userId),
      lt(aiMemories.lastReferencedAt, thirtyDaysAgo),
    ))

  let decayed = 0
  for (const mem of stale) {
    const newImportance = (mem.importance ?? 5) - 1
    if (newImportance < 3) {
      await db.delete(aiMemories).where(eq(aiMemories.id, mem.id))
    } else {
      await db.update(aiMemories)
        .set({ importance: newImportance, updatedAt: new Date() })
        .where(eq(aiMemories.id, mem.id))
    }
    decayed++
  }

  return decayed
}

// ── Memory Stats ────────────────────────────────────────────────────────────
export async function getMemoryStats(userId: string) {
  const all = await db.select({
    type: aiMemories.type,
    importance: aiMemories.importance,
    createdAt: aiMemories.createdAt,
    lastReferencedAt: aiMemories.lastReferencedAt,
  }).from(aiMemories).where(eq(aiMemories.userId, userId))

  const byCategory: Record<string, number> = {}
  let totalImportance = 0
  let staleCount = 0
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  for (const m of all) {
    byCategory[m.type || 'unknown'] = (byCategory[m.type || 'unknown'] || 0) + 1
    totalImportance += m.importance || 5
    if (m.lastReferencedAt && m.lastReferencedAt < thirtyDaysAgo) staleCount++
  }

  return {
    total: all.length,
    byCategory,
    avgImportance: all.length > 0 ? Math.round(totalImportance / all.length * 10) / 10 : 0,
    staleCount,
    freshCount: all.length - staleCount,
  }
}

function parseMemories(raw: string): MemoryCandidate[] | null {
  try {
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return null
    return parsed.filter(m => m.content && typeof m.content === 'string')
  } catch {
    return null
  }
}
