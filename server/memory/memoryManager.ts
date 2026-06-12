import { db } from '../db'
import { aiMemories, chatMessages, projects, businessIdeas, tasks, founderProfiles } from '../db/schema'
import { eq, desc, and, inArray, sql } from 'drizzle-orm'

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working' | 'goal' | 'decision' | 'preference' | 'fact' | 'pattern'

export interface Memory {
  id: string
  type: MemoryType | string
  content: string
  source: string
  importance: number
  tags: string[]
  createdAt: Date
  referenceCount: number
  lastReferencedAt: Date | null
}

export interface FounderContext {
  memories: Memory[]
  recentConversations: Array<{ role: string; content: string; createdAt: Date }>
  activeProjects: Array<{ name: string; status: string | null; description: string | null }>
  businessIdeas: Array<{ title: string; status: string | null; type: string | null }>
  profile: { industry: string | null; stage: string | null; primaryGoal: string | null } | null
  activeTasks: Array<{ title: string; status: string | null; priority: string | null }>
}

export async function storeMemory(
  userId: string,
  type: MemoryType | string,
  content: string,
  source: string,
  importance = 5,
  tags: string[] = []
): Promise<void> {
  const existing = await db.select({ id: aiMemories.id, content: aiMemories.content })
    .from(aiMemories)
    .where(and(eq(aiMemories.userId, userId), eq(aiMemories.type, type)))
    .limit(100)

  const isDuplicate = existing.some(e =>
    e.content.toLowerCase().includes(content.toLowerCase().substring(0, 40)) ||
    content.toLowerCase().includes(e.content.toLowerCase().substring(0, 40))
  )

  if (isDuplicate) return

  await db.insert(aiMemories).values({
    userId,
    type,
    content,
    source,
    importance: Math.min(10, Math.max(1, importance)),
    tags,
  })
}

export async function storeEpisodicMemory(
  userId: string,
  event: string,
  context: string,
  importance = 5
): Promise<void> {
  await storeMemory(userId, 'episodic', `${event}: ${context}`, 'system', importance, ['episodic'])
}

export async function storeSemanticMemory(
  userId: string,
  fact: string,
  category: string,
  importance = 7
): Promise<void> {
  await storeMemory(userId, 'semantic', fact, 'system', importance, ['semantic', category])
}

export async function storeProceduralMemory(
  userId: string,
  pattern: string,
  context: string
): Promise<void> {
  await storeMemory(userId, 'procedural', `Pattern: ${pattern} | Context: ${context}`, 'system', 6, ['procedural'])
}

export async function getMemoriesByType(
  userId: string,
  type: MemoryType | string,
  limit = 20
): Promise<Memory[]> {
  const rows = await db.select()
    .from(aiMemories)
    .where(and(eq(aiMemories.userId, userId), eq(aiMemories.type, type)))
    .orderBy(desc(aiMemories.importance), desc(aiMemories.lastReferencedAt))
    .limit(limit)

  return rows.map(r => ({
    id: r.id,
    type: r.type,
    content: r.content,
    source: r.source || 'system',
    importance: r.importance || 5,
    tags: (r.tags as string[]) || [],
    createdAt: r.createdAt || new Date(),
    referenceCount: r.referenceCount || 0,
    lastReferencedAt: r.lastReferencedAt || null,
  }))
}

export async function getAllMemories(userId: string, limit = 50): Promise<Memory[]> {
  const rows = await db.select()
    .from(aiMemories)
    .where(eq(aiMemories.userId, userId))
    .orderBy(desc(aiMemories.importance), desc(aiMemories.createdAt))
    .limit(limit)

  return rows.map(r => ({
    id: r.id,
    type: r.type,
    content: r.content,
    source: r.source || 'system',
    importance: r.importance || 5,
    tags: (r.tags as string[]) || [],
    createdAt: r.createdAt || new Date(),
    referenceCount: r.referenceCount || 0,
    lastReferencedAt: r.lastReferencedAt || null,
  }))
}

export async function deleteMemory(userId: string, memoryId: string): Promise<void> {
  await db.delete(aiMemories)
    .where(and(eq(aiMemories.userId, userId), eq(aiMemories.id, memoryId)))
}

export async function assembleFounderContext(userId: string): Promise<FounderContext> {
  const [
    memories,
    recentMessages,
    activeProjects,
    ideas,
    profile,
    pendingTasks,
  ] = await Promise.all([
    db.select().from(aiMemories)
      .where(eq(aiMemories.userId, userId))
      .orderBy(desc(aiMemories.importance), desc(aiMemories.lastReferencedAt))
      .limit(30),

    db.select({ role: chatMessages.role, content: chatMessages.content, createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(20),

    db.select({ name: projects.name, status: projects.status, description: projects.description })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, 'active')))
      .limit(5),

    db.select({ title: businessIdeas.title, status: businessIdeas.status, type: businessIdeas.type })
      .from(businessIdeas)
      .where(eq(businessIdeas.userId, userId))
      .orderBy(desc(businessIdeas.createdAt))
      .limit(5),

    db.select()
      .from(founderProfiles)
      .where(eq(founderProfiles.userId, userId))
      .limit(1),

    db.select({ title: tasks.title, status: tasks.status, priority: tasks.priority })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), inArray(tasks.status, ['todo', 'in_progress'])))
      .limit(10),
  ])

  await Promise.all(
    memories.map(m =>
      db.update(aiMemories)
        .set({ referenceCount: (m.referenceCount || 0) + 1, lastReferencedAt: new Date() })
        .where(eq(aiMemories.id, m.id))
        .catch(() => {})
    )
  )

  return {
    memories: memories.map(r => ({
      id: r.id,
      type: r.type,
      content: r.content,
      source: r.source || 'system',
      importance: r.importance || 5,
      tags: (r.tags as string[]) || [],
      createdAt: r.createdAt || new Date(),
      referenceCount: r.referenceCount || 0,
      lastReferencedAt: r.lastReferencedAt || null,
    })),
    recentConversations: recentMessages.reverse(),
    activeProjects,
    businessIdeas: ideas,
    profile: profile[0] ? {
      industry: profile[0].industry,
      stage: profile[0].stage,
      primaryGoal: profile[0].primaryGoal,
    } : null,
    activeTasks: pendingTasks,
  }
}

export async function buildMemoryContext(userId: string): Promise<string> {
  const ctx = await assembleFounderContext(userId)

  const lines: string[] = []

  if (ctx.profile) {
    lines.push(`## Founder Profile`)
    lines.push(`Stage: ${ctx.profile.stage || 'Unknown'} | Industry: ${ctx.profile.industry || 'Unknown'} | Goal: ${ctx.profile.primaryGoal || 'Unknown'}`)
  }

  if (ctx.memories.length > 0) {
    lines.push(`\n## What I Know About You (${ctx.memories.length} memories)`)
    const grouped: Record<string, Memory[]> = {}
    ctx.memories.forEach(m => {
      if (!grouped[m.type]) grouped[m.type] = []
      grouped[m.type].push(m)
    })
    for (const [type, mems] of Object.entries(grouped)) {
      lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)} Memory`)
      mems.slice(0, 8).forEach(m => lines.push(`- ${m.content}`))
    }
  }

  if (ctx.activeProjects.length > 0) {
    lines.push(`\n## Active Projects`)
    ctx.activeProjects.forEach(p => lines.push(`- ${p.name}${p.description ? `: ${p.description}` : ''}`))
  }

  if (ctx.businessIdeas.length > 0) {
    lines.push(`\n## Business Ideas`)
    ctx.businessIdeas.forEach(i => lines.push(`- ${i.title} [${i.status || 'draft'}]`))
  }

  if (ctx.activeTasks.length > 0) {
    lines.push(`\n## Active Tasks`)
    ctx.activeTasks.forEach(t => lines.push(`- [${t.priority || 'medium'}] ${t.title} (${t.status})`))
  }

  return lines.join('\n')
}
