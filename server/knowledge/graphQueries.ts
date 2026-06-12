import { db } from '../db'
import { aiMemories } from '../db/schema'
import { eq, desc, like, or, and } from 'drizzle-orm'

export interface GraphNode {
  id: string
  label: string
  type: string
  description: string
  importance: number
}

export interface GraphEdge {
  from: string
  to: string
  relation: string
}

export interface KnowledgeGraphView {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

function parseEntityFromMemory(content: string): { type: string; name: string; description: string } | null {
  const match = content.match(/^([A-Z_]+):\s+(.+?)\s+—\s+(.+)$/)
  if (match) {
    return {
      type: match[1].toLowerCase(),
      name: match[2],
      description: match[3],
    }
  }
  return null
}

export async function buildKnowledgeGraphView(userId: string): Promise<KnowledgeGraphView> {
  const semanticMemories = await db.select()
    .from(aiMemories)
    .where(and(eq(aiMemories.userId, userId), eq(aiMemories.type, 'semantic')))
    .orderBy(desc(aiMemories.importance))
    .limit(50)

  const nodes: GraphNode[] = []
  const seen = new Set<string>()

  for (const mem of semanticMemories) {
    const parsed = parseEntityFromMemory(mem.content)
    if (parsed && !seen.has(parsed.name)) {
      seen.add(parsed.name)
      nodes.push({
        id: mem.id,
        label: parsed.name,
        type: parsed.type,
        description: parsed.description,
        importance: mem.importance || 5,
      })
    }
  }

  const edges: GraphEdge[] = []
  const typeRelations: Record<string, Record<string, string>> = {
    startup: { product: 'builds', market: 'targets', competitor: 'competes_with', investor: 'raising_from' },
    product: { customer: 'serves', technology: 'uses', feature: 'has' },
    person: { startup: 'founded', investor: 'partners_with' },
    customer: { market: 'segment_of' },
    competitor: { market: 'competes_in' },
  }

  const nodesByType: Record<string, GraphNode[]> = {}
  nodes.forEach(n => {
    if (!nodesByType[n.type]) nodesByType[n.type] = []
    nodesByType[n.type].push(n)
  })

  for (const [fromType, relations] of Object.entries(typeRelations)) {
    const fromNodes = nodesByType[fromType] || []
    for (const [toType, relation] of Object.entries(relations)) {
      const toNodes = nodesByType[toType] || []
      for (const from of fromNodes.slice(0, 3)) {
        for (const to of toNodes.slice(0, 3)) {
          if (from.id !== to.id) {
            edges.push({ from: from.id, to: to.id, relation })
          }
        }
      }
    }
  }

  return { nodes: nodes.slice(0, 40), edges: edges.slice(0, 60) }
}

export async function getEntitySummary(userId: string): Promise<Record<string, number>> {
  const memories = await db.select({ type: aiMemories.type })
    .from(aiMemories)
    .where(and(eq(aiMemories.userId, userId), eq(aiMemories.type, 'semantic')))

  const counts: Record<string, number> = {}
  memories.forEach(m => {
    const parsed = m.type
    counts[parsed] = (counts[parsed] || 0) + 1
  })
  return counts
}
