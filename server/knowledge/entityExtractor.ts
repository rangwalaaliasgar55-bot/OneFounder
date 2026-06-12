import { getAIProvider } from '../ai/index'
import { storeSemanticMemory } from '../memory/memoryManager'

export type EntityType = 
  | 'startup'
  | 'product'
  | 'competitor'
  | 'customer'
  | 'investor'
  | 'technology'
  | 'metric'
  | 'person'
  | 'market'
  | 'feature'
  | 'channel'
  | 'partnership'

export interface Entity {
  name: string
  type: EntityType
  description: string
  attributes: Record<string, string>
}

export interface Relationship {
  fromEntity: string
  toEntity: string
  relation: string
}

export interface KnowledgeGraph {
  entities: Entity[]
  relationships: Relationship[]
}

export async function extractEntities(
  userId: string,
  text: string,
  source = 'conversation'
): Promise<KnowledgeGraph> {
  const ai = await getAIProvider()

  const prompt = `Extract business entities and their relationships from this text. Focus on entities relevant to startups and business building.

Text: "${text.substring(0, 2000)}"

Return ONLY valid JSON:
{
  "entities": [
    {
      "name": "Entity name",
      "type": "startup|product|competitor|customer|investor|technology|metric|person|market|feature|channel|partnership",
      "description": "Brief description",
      "attributes": { "key": "value" }
    }
  ],
  "relationships": [
    {
      "fromEntity": "Entity A name",
      "toEntity": "Entity B name", 
      "relation": "verb describing relationship (e.g., competes_with, targets, uses, invests_in, builds)"
    }
  ]
}

Return empty arrays if no clear entities found. Return ONLY JSON.`

  let graph: KnowledgeGraph = { entities: [], relationships: [] }

  try {
    const raw = await ai.generate(prompt, 'Extract business entities. Return ONLY valid JSON.')
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) graph = JSON.parse(match[0])
  } catch {}

  if (!graph.entities || !Array.isArray(graph.entities)) {
    graph = { entities: [], relationships: [] }
  }

  for (const entity of graph.entities.slice(0, 10)) {
    if (entity.name && entity.type && entity.description) {
      await storeSemanticMemory(
        userId,
        `${entity.type.toUpperCase()}: ${entity.name} — ${entity.description}`,
        entity.type,
        7
      ).catch(() => {})
    }
  }

  return graph
}

export async function extractEntitiesFromConversation(
  userId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  const combined = `User: ${userMessage}\n\nAssistant: ${assistantResponse.substring(0, 500)}`
  await extractEntities(userId, combined, 'conversation').catch(() => {})
}
