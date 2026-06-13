import { db } from '../db/index.js'
import { aiMemories } from '../db/schema.js'
import { eq, desc, and, sql } from 'drizzle-orm'
import { getAIProvider } from './index.js'

export async function extractAndStoreMemories(userId: string, userMessage: string, assistantResponse: string, source: string = 'chat'): Promise<void> {
  try {
    const ai = await getAIProvider()
    const extractionPrompt = `Analyze this conversation and extract any durable, important facts about this founder that should be remembered for future conversations.

User said: "${userMessage}"
AI responded: "${assistantResponse.substring(0, 500)}"

Extract ONLY information that is:
- A stated goal, aspiration, or priority
- A business decision made
- A personal preference or working style insight
- A key business fact (company name, industry, customer type, etc.)
- A commitment or deadline they mentioned
- A pain point or challenge they're facing

Return a JSON array (can be empty [] if nothing worth storing). Each memory:
{
  "type": "goal|decision|preference|fact|pattern|reflection",
  "content": "concise 1-sentence memory",
  "importance": 1-10,
  "tags": ["tag1","tag2"]
}

Return ONLY the JSON array, nothing else.`

    let memories: any[] = []
    try {
      const raw = await ai.generate(extractionPrompt, 'You extract structured memories from conversations. Return ONLY valid JSON array.')
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) memories = JSON.parse(match[0])
    } catch {}

    if (!Array.isArray(memories) || memories.length === 0) return

    const existing = await db.select({ content: aiMemories.content })
      .from(aiMemories)
      .where(eq(aiMemories.userId, userId))
      .limit(50)

    const existingContents = existing.map(e => e.content.toLowerCase())

    for (const mem of memories) {
      if (!mem.content || typeof mem.content !== 'string') continue
      const isDuplicate = existingContents.some(e =>
        e.includes(mem.content.toLowerCase().substring(0, 30)) ||
        mem.content.toLowerCase().includes(e.substring(0, 30))
      )
      if (isDuplicate) continue

      await db.insert(aiMemories).values({
        userId,
        type: mem.type || 'fact',
        content: mem.content,
        source,
        importance: Math.min(10, Math.max(1, Number(mem.importance) || 5)),
        tags: Array.isArray(mem.tags) ? mem.tags : [],
      })
    }
  } catch {}
}

export async function getTopMemories(userId: string, limit = 10): Promise<string[]> {
  const memories = await db.select()
    .from(aiMemories)
    .where(eq(aiMemories.userId, userId))
    .orderBy(desc(aiMemories.importance))
    .limit(limit)

  await Promise.all(
    memories.map(m =>
      db.update(aiMemories)
        .set({
          referenceCount: (m.referenceCount || 0) + 1,
          lastReferencedAt: new Date(),
        })
        .where(eq(aiMemories.id, m.id))
    )
  )

  return memories.map(m => `[${m.type}] ${m.content}`)
}

export async function upsertMemory(userId: string, type: string, content: string, source: string, importance = 5): Promise<void> {
  await db.insert(aiMemories).values({
    userId,
    type,
    content,
    source,
    importance,
    tags: [],
  })
}
