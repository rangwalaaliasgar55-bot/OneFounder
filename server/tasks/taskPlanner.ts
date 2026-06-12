import { db } from '../db'
import { tasks, projects } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getAIProvider } from '../ai/index'
import { buildMemoryContext } from '../memory/memoryManager'
import { v4 as uuidv4 } from 'uuid'

export interface PlannedTask {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  category: string
  dependencies: string[]
  successCriteria: string
}

export interface TaskPlan {
  goal: string
  timeframe: string
  tasks: PlannedTask[]
  reasoning: string
  projectId?: string
}

export async function generateTaskPlan(
  userId: string,
  goal: string,
  timeframe: '24h' | '7d' | '30d' | 'sprint' = '7d',
  projectId?: string
): Promise<TaskPlan> {
  const [ai, memoryContext] = await Promise.all([
    getAIProvider(),
    buildMemoryContext(userId).catch(() => ''),
  ])

  const timeframeLabel = {
    '24h': 'next 24 hours',
    '7d': 'next 7 days',
    '30d': 'next 30 days',
    'sprint': '2-week sprint',
  }[timeframe]

  const prompt = `You are OneFounder Supreme AI Planner. Generate a specific, actionable task plan for this founder.

Goal: ${goal}
Timeframe: ${timeframeLabel}
${memoryContext ? `\nFounder Context:\n${memoryContext}` : ''}

Generate a focused task plan. Return ONLY valid JSON in this exact format:
{
  "reasoning": "Brief strategic reasoning for this plan (2-3 sentences)",
  "tasks": [
    {
      "title": "Specific task title",
      "description": "What exactly to do and how",
      "priority": "high|medium|low",
      "estimatedTime": "e.g. 2h, 30min, 1 day",
      "category": "e.g. Research, Marketing, Engineering, Sales, Finance, Product",
      "dependencies": ["task title this depends on"],
      "successCriteria": "How to know this is done"
    }
  ]
}

Rules:
- Generate 5-12 specific, immediately actionable tasks
- Order by priority and logical sequence
- Be specific — no vague tasks like "do research"
- Include time estimates
- Tasks must be completable in the given timeframe
- Return ONLY the JSON, nothing else`

  let plan: any = { reasoning: '', tasks: [] }

  try {
    const raw = await ai.generate(prompt, 'You generate structured task plans. Return ONLY valid JSON.')
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) plan = JSON.parse(match[0])
  } catch {}

  const validTasks: PlannedTask[] = (plan.tasks || [])
    .filter((t: any) => t.title && t.description)
    .map((t: any) => ({
      title: String(t.title || ''),
      description: String(t.description || ''),
      priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
      estimatedTime: String(t.estimatedTime || '1h'),
      category: String(t.category || 'General'),
      dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
      successCriteria: String(t.successCriteria || 'Task completed'),
    }))

  return {
    goal,
    timeframe: timeframeLabel,
    tasks: validTasks,
    reasoning: plan.reasoning || 'Plan generated based on your goal.',
    projectId,
  }
}

export async function saveTasksToDatabase(
  userId: string,
  plan: TaskPlan,
  projectId?: string
): Promise<string[]> {
  const savedIds: string[] = []

  for (const task of plan.tasks) {
    const [saved] = await db.insert(tasks).values({
      userId,
      projectId: projectId || undefined,
      title: task.title,
      description: `${task.description}\n\n✅ Success: ${task.successCriteria}\n⏱ Estimate: ${task.estimatedTime}\n📁 Category: ${task.category}`,
      status: 'todo',
      priority: task.priority,
    }).returning({ id: tasks.id })

    if (saved) savedIds.push(saved.id)
  }

  return savedIds
}

export async function generateDailyBriefing(userId: string): Promise<string> {
  const [ai, memoryContext, pendingTasks] = await Promise.all([
    getAIProvider(),
    buildMemoryContext(userId).catch(() => ''),
    db.select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, 'todo')))
      .orderBy(desc(tasks.createdAt))
      .limit(10),
  ])

  const taskList = pendingTasks.map(t => `- [${t.priority}] ${t.title}`).join('\n')

  const prompt = `You are OneFounder Supreme. Generate a powerful, focused daily briefing for this founder.

${memoryContext ? `Founder Context:\n${memoryContext}\n\n` : ''}${taskList ? `Pending Tasks:\n${taskList}\n\n` : ''}

Generate a daily briefing with:
1. Top 3 priorities for today (specific and actionable)
2. Key risk or blocker to address
3. One strategic insight based on their context
4. The single most important thing to do in the next 2 hours

Be direct. Be specific. No fluff. Format with headers.`

  return await ai.generate(prompt, 'You generate powerful, actionable daily briefings for founders.')
}

export async function generateSprintPlan(
  userId: string,
  sprintGoal: string,
  projectId?: string
): Promise<TaskPlan> {
  return generateTaskPlan(userId, sprintGoal, 'sprint', projectId)
}

export async function generateLaunchChecklist(
  userId: string,
  productName: string
): Promise<TaskPlan> {
  return generateTaskPlan(
    userId,
    `Launch ${productName} successfully — complete launch checklist covering technical, marketing, sales, legal, and operational readiness`,
    '30d'
  )
}
