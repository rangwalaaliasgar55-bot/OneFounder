import { db } from '../db'
import { aiMemories } from '../db/schema'
import { eq, desc, and, like, or, sql } from 'drizzle-orm'

export interface RelevantMemory {
  content: string
  type: string
  relevanceScore: number
  importance: number
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'my', 'me', 'we', 'our', 'you', 'your', 'it', 'its', 'this', 'that', 'what', 'how', 'when', 'where', 'who', 'which', 'about', 'from', 'into', 'than', 'then', 'so', 'if', 'as', 'not'])
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 20)
}

function scoreRelevance(memory: string, keywords: string[]): number {
  const lowerMem = memory.toLowerCase()
  let score = 0
  for (const kw of keywords) {
    if (lowerMem.includes(kw)) score += 2
  }
  return score
}

export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  limit = 15
): Promise<RelevantMemory[]> {
  const keywords = extractKeywords(query)

  const all = await db.select()
    .from(aiMemories)
    .where(eq(aiMemories.userId, userId))
    .orderBy(desc(aiMemories.importance), desc(aiMemories.lastReferencedAt))
    .limit(100)

  const scored = all.map(m => ({
    content: m.content,
    type: m.type,
    relevanceScore: scoreRelevance(m.content, keywords),
    importance: m.importance || 5,
  }))

  scored.sort((a, b) => {
    const scoreA = a.relevanceScore * 2 + a.importance
    const scoreB = b.relevanceScore * 2 + b.importance
    return scoreB - scoreA
  })

  const relevant = scored.filter(m => m.relevanceScore > 0 || m.importance >= 8)

  if (relevant.length < 5) {
    const topByImportance = scored
      .filter(m => !relevant.includes(m))
      .slice(0, 5 - relevant.length)
    return [...relevant, ...topByImportance].slice(0, limit)
  }

  return relevant.slice(0, limit)
}

export async function formatMemoriesForPrompt(memories: RelevantMemory[]): Promise<string> {
  if (memories.length === 0) return ''

  const lines = ['## Retrieved Memory Context']
  const byType: Record<string, RelevantMemory[]> = {}

  memories.forEach(m => {
    if (!byType[m.type]) byType[m.type] = []
    byType[m.type].push(m)
  })

  for (const [type, mems] of Object.entries(byType)) {
    lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}`)
    mems.forEach(m => lines.push(`- ${m.content}`))
  }

  return lines.join('\n')
}

export async function getMemoryContextForQuery(userId: string, query: string): Promise<string> {
  const memories = await retrieveRelevantMemories(userId, query, 15)
  return formatMemoriesForPrompt(memories)
}
