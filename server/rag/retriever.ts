import { db } from '../db/index.js'
import { knowledgeBase } from '../db/schema.js'
import { eq, desc, like, or, and, sql } from 'drizzle-orm'
import { chunkText, type TextChunk } from './chunker.js'

export interface RetrievedChunk {
  content: string
  source: string
  title: string
  score: number
  docId: string
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
}

function bm25Score(
  query: string[],
  doc: string,
  avgDocLength: number,
  totalDocs: number,
  docFreqs: Map<string, number>,
  k1 = 1.5,
  b = 0.75
): number {
  const tokens = tokenize(doc)
  const docLen = tokens.length
  let score = 0

  const termFreq: Record<string, number> = {}
  tokens.forEach(t => { termFreq[t] = (termFreq[t] || 0) + 1 })

  for (const term of query) {
    const tf = termFreq[term] || 0
    if (tf === 0) continue
    
    // Proper IDF calculation: log(1 + (N - n + 0.5) / (n + 0.5))
    const docsWithTerm = docFreqs.get(term) || 0
    const idf = Math.log(1 + (totalDocs - docsWithTerm + 0.5) / (docsWithTerm + 0.5))
    
    const numerator = tf * (k1 + 1)
    const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLength))
    score += idf * (numerator / denominator)
  }

  return score
}

function keywordScore(query: string, doc: string): number {
  const qWords = tokenize(query)
  const dWords = new Set(tokenize(doc))
  let matches = 0
  for (const w of qWords) {
    if (dWords.has(w)) matches++
  }
  return qWords.length > 0 ? matches / qWords.length : 0
}

export async function retrieveRelevantChunks(
  userId: string,
  query: string,
  topK = 5
): Promise<RetrievedChunk[]> {
  const docs = await db.select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, userId))
    .orderBy(desc(knowledgeBase.updatedAt))
    .limit(50)

  if (docs.length === 0) return []

  const allChunks: Array<{ chunk: TextChunk; docId: string; docTitle: string }> = []

  for (const doc of docs) {
    const text = doc.content || ''
    if (!text.trim()) continue
    const chunks = chunkText(text, doc.id, doc.title)
    chunks.forEach(chunk => allChunks.push({ chunk, docId: doc.id, docTitle: doc.title }))
  }

  if (allChunks.length === 0) return []

  const queryTokens = tokenize(query)
  const avgLen = allChunks.reduce((sum, c) => sum + c.chunk.wordCount, 0) / allChunks.length
  const totalDocs = allChunks.length

  // Pre-compute document frequencies for each query term
  const docFreqs = new Map<string, number>()
  for (const term of queryTokens) {
    let count = 0
    for (const { chunk } of allChunks) {
      const tokens = tokenize(chunk.content)
      if (tokens.includes(term)) count++
    }
    docFreqs.set(term, count)
  }

  const scored = allChunks.map(({ chunk, docId, docTitle }) => {
    const bm25 = bm25Score(queryTokens, chunk.content, avgLen, totalDocs, docFreqs)
    const kw = keywordScore(query, chunk.content)
    const score = bm25 * 0.6 + kw * 0.4
    return { chunk, docId, docTitle, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const top = scored.slice(0, topK * 3)
  const deduped: typeof top = []
  const seen = new Set<string>()

  for (const item of top) {
    const key = item.chunk.content.substring(0, 100)
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(item)
    }
  }

  return deduped.slice(0, topK).map(({ chunk, docId, docTitle, score }) => ({
    content: chunk.content,
    source: chunk.metadata.source,
    title: docTitle,
    score,
    docId,
  }))
}
