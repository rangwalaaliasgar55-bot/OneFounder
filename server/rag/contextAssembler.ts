import { retrieveRelevantChunks, type RetrievedChunk } from './retriever.js'

export interface RAGContext {
  chunks: RetrievedChunk[]
  contextString: string
  usedDocIds: string[]
}

export async function assembleRAGContext(
  userId: string,
  query: string,
  topK = 5,
  minScore = 0.05
): Promise<string> {
  try {
    const chunks = await retrieveRelevantChunks(userId, query, topK)
    const relevant = chunks.filter(c => c.score >= minScore)

    if (relevant.length === 0) return ''

    const lines = ['## Knowledge Base Context']
    const docGroups: Record<string, RetrievedChunk[]> = {}

    relevant.forEach(c => {
      if (!docGroups[c.title]) docGroups[c.title] = []
      docGroups[c.title].push(c)
    })

    for (const [title, docChunks] of Object.entries(docGroups)) {
      lines.push(`\n### From: ${title}`)
      docChunks.forEach(c => {
        lines.push(c.content)
      })
    }

    return lines.join('\n')
  } catch {
    return ''
  }
}

export async function getRAGContextForQuery(
  userId: string,
  query: string
): Promise<RAGContext> {
  const chunks = await retrieveRelevantChunks(userId, query, 5)
  const relevant = chunks.filter(c => c.score >= 0.05)
  const contextString = relevant.length > 0
    ? '## Knowledge Base Context\n' + relevant.map(c => `### ${c.title}\n${c.content}`).join('\n\n')
    : ''

  return {
    chunks: relevant,
    contextString,
    usedDocIds: [...new Set(relevant.map(c => c.docId))],
  }
}
