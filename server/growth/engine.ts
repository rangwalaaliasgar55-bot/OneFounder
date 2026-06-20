/**
 * Growth Engine — XP, levels, achievements, streaks.
 * Gamifies the founder journey to drive engagement and retention.
 */
import { db } from '../db/index.js'
import { founderProgress, xpEvents } from '../db/schema.js'
import { eq } from 'drizzle-orm'

// ── XP Values ───────────────────────────────────────────────────────────────
export const XP_VALUES: Record<string, number> = {
  // Core actions
  send_message: 5,
  complete_task: 15,
  create_idea: 20,
  create_project: 25,
  create_lead: 10,
  publish_content: 30,
  generate_plan: 25,
  run_research: 20,
  add_knowledge: 10,
  track_expense: 5,

  // Streak bonuses
  streak_3: 50,
  streak_7: 150,
  streak_14: 400,
  streak_30: 1000,

  // Milestones
  first_chat: 25,
  first_idea: 50,
  first_lead: 50,
  first_content: 50,
  first_project: 75,
  first_plan: 75,
  first_research: 50,

  // Achievement unlocks
  achievement_unlocked: 100,
}

// ── Level Thresholds ────────────────────────────────────────────────────────
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500,
  10000, 13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000,
]

export const LEVEL_TITLES = [
  'Idea Spark', 'Aspiring Founder', 'Builder', 'Hustler', 'Operator',
  'Growth Hacker', 'Revenue Maker', 'Scale Master', 'Empire Builder', 'Founder Elite',
  'Serial Entrepreneur', 'Market Disruptor', 'Category Creator', 'Industry Titan', 'Visionary',
  'Unicorn Founder', 'Legendary Builder', 'Empire Architect', 'Global Leader', 'Transcendent',
]

// ── Achievements ────────────────────────────────────────────────────────────
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xp: number
  condition: (stats: FounderStats) => boolean
}

export interface FounderStats {
  totalMessages: number
  totalIdeas: number
  totalLeads: number
  totalContent: number
  totalProjects: number
  totalPlans: number
  totalResearch: number
  totalTasks: number
  streak: number
  level: number
  xp: number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_chat', name: 'First Conversation', description: 'Sent your first message to OneFounder AI', icon: '💬', xp: 25, condition: s => s.totalMessages >= 1 },
  { id: 'chatter', name: 'Chatterbox', description: 'Had 100 AI conversations', icon: '🗣️', xp: 100, condition: s => s.totalMessages >= 100 },
  { id: 'idea_machine', name: 'Idea Machine', description: 'Generated 10 business ideas', icon: '💡', xp: 100, condition: s => s.totalIdeas >= 10 },
  { id: 'lead_magnet', name: 'Lead Magnet', description: 'Added 10 leads to CRM', icon: '🧲', xp: 100, condition: s => s.totalLeads >= 10 },
  { id: 'content_king', name: 'Content Royalty', description: 'Created 20 pieces of content', icon: '✍️', xp: 150, condition: s => s.totalContent >= 20 },
  { id: 'builder', name: 'Builder', description: 'Created 5 projects', icon: '🔨', xp: 100, condition: s => s.totalProjects >= 5 },
  { id: 'strategic', name: 'Strategic Mind', description: 'Generated 5 business plans', icon: '📋', xp: 100, condition: s => s.totalPlans >= 5 },
  { id: 'researcher', name: 'Deep Researcher', description: 'Ran 10 research sessions', icon: '🔬', xp: 100, condition: s => s.totalResearch >= 10 },
  { id: 'streak_3', name: 'Building Momentum', description: '3-day activity streak', icon: '🔥', xp: 50, condition: s => s.streak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day activity streak', icon: '⚡', xp: 150, condition: s => s.streak >= 7 },
  { id: 'streak_14', name: 'Unstoppable', description: '14-day activity streak', icon: '🚀', xp: 400, condition: s => s.streak >= 14 },
  { id: 'streak_30', name: 'Founding Machine', description: '30-day activity streak', icon: '🏆', xp: 1000, condition: s => s.streak >= 30 },
  { id: 'level_5', name: 'Rising Founder', description: 'Reached Level 5', icon: '⭐', xp: 200, condition: s => s.level >= 5 },
  { id: 'level_10', name: 'Founder Elite', description: 'Reached Level 10', icon: '🌟', xp: 500, condition: s => s.level >= 10 },
  { id: 'level_15', name: 'Serial Entrepreneur', description: 'Reached Level 15', icon: '💎', xp: 1000, condition: s => s.level >= 15 },
]

// ── Core Functions ──────────────────────────────────────────────────────────

export async function awardXP(userId: string, action: string, source?: string): Promise<{ xp: number; level: number; leveledUp: boolean; achievement?: Achievement }> {
  const xpAmount = XP_VALUES[action] || 5

  // Get or create progress
  let progress = await db.select().from(founderProgress).where(eq(founderProgress.userId, userId)).limit(1)
  let record = progress[0]

  if (!record) {
    const [created] = await db.insert(founderProgress).values({
      userId,
      xp: 0,
      level: 1,
      streak: 0,
      achievements: [],
      stats: {},
    }).returning()
    record = created
  }

  const oldLevel = record.level || 1
  const newXP = (record.xp || 0) + xpAmount
  const newLevel = calculateLevel(newXP)
  const leveledUp = newLevel > oldLevel

  // Record XP event
  await db.insert(xpEvents).values({ userId, action, xp: xpAmount, source })

  // Update progress
  await db.update(founderProgress)
    .set({
      xp: newXP,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(founderProgress.userId, userId))

  // Check achievements
  const stats = await getFounderStats(userId)
  const newAchievement = await checkAchievements(userId, stats)

  return {
    xp: xpAmount,
    level: newLevel,
    leveledUp,
    achievement: newAchievement || undefined,
  }
}

export async function updateStreak(userId: string): Promise<number> {
  const [record] = await db.select().from(founderProgress).where(eq(founderProgress.userId, userId)).limit(1)
  if (!record) return 0

  const today = new Date().toDateString()
  const lastActive = record.lastActiveDate?.toDateString()

  if (lastActive === today) return record.streak || 0

  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const isConsecutive = lastActive === yesterday
  const newStreak = isConsecutive ? (record.streak || 0) + 1 : 1

  await db.update(founderProgress)
    .set({ streak: newStreak, lastActiveDate: new Date(), updatedAt: new Date() })
    .where(eq(founderProgress.userId, userId))

  // Award streak bonuses
  if (newStreak === 3) await awardXP(userId, 'streak_3', 'streak')
  if (newStreak === 7) await awardXP(userId, 'streak_7', 'streak')
  if (newStreak === 14) await awardXP(userId, 'streak_14', 'streak')
  if (newStreak === 30) await awardXP(userId, 'streak_30', 'streak')

  return newStreak
}

export async function getFounderStats(userId: string): Promise<FounderStats> {
  const [record] = await db.select().from(founderProgress).where(eq(founderProgress.userId, userId)).limit(1)
  const stats = (record?.stats as Record<string, number>) || {}

  return {
    totalMessages: stats.totalMessages || 0,
    totalIdeas: stats.totalIdeas || 0,
    totalLeads: stats.totalLeads || 0,
    totalContent: stats.totalContent || 0,
    totalProjects: stats.totalProjects || 0,
    totalPlans: stats.totalPlans || 0,
    totalResearch: stats.totalResearch || 0,
    totalTasks: stats.totalTasks || 0,
    streak: record?.streak || 0,
    level: record?.level || 1,
    xp: record?.xp || 0,
  }
}

export async function getProgress(userId: string) {
  const [record] = await db.select().from(founderProgress).where(eq(founderProgress.userId, userId)).limit(1)
  if (!record) return { xp: 0, level: 1, title: LEVEL_TITLES[0], streak: 0, achievements: [], nextLevelXP: LEVEL_THRESHOLDS[1] || 100, progress: 0 }

  const level = record.level || 1
  const xp = record.xp || 0
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2
  const progress = Math.min(1, (xp - currentThreshold) / (nextThreshold - currentThreshold))

  return {
    xp,
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    streak: record.streak || 0,
    achievements: (record.achievements as string[]) || [],
    nextLevelXP: nextThreshold,
    progress: Math.round(progress * 100) / 100,
  }
}

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

async function checkAchievements(userId: string, stats: FounderStats): Promise<Achievement | null> {
  const [record] = await db.select().from(founderProgress).where(eq(founderProgress.userId, userId)).limit(1)
  const unlocked = ((record?.achievements as string[]) || [])

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue
    if (achievement.condition(stats)) {
      const updated = [...unlocked, achievement.id]
      await db.update(founderProgress)
        .set({ achievements: updated, updatedAt: new Date() })
        .where(eq(founderProgress.userId, userId))

      // Award achievement XP
      await db.insert(xpEvents).values({ userId, action: 'achievement_unlocked', xp: achievement.xp, source: achievement.id })

      // Add XP
      const newXP = (record?.xp || 0) + achievement.xp
      const newLevel = calculateLevel(newXP)
      await db.update(founderProgress)
        .set({ xp: newXP, level: newLevel })
        .where(eq(founderProgress.userId, userId))

      return achievement
    }
  }

  return null
}

// Track stats for achievement checks
export async function incrementStat(userId: string, stat: keyof FounderStats, amount = 1) {
  const [record] = await db.select().from(founderProgress).where(eq(founderProgress.userId, userId)).limit(1)
  if (!record) {
    await db.insert(founderProgress).values({ userId, xp: 0, level: 1, streak: 0, stats: { [stat]: amount } })
    return
  }
  const stats = (record.stats as Record<string, number>) || {}
  stats[stat] = (stats[stat] || 0) + amount
  await db.update(founderProgress).set({ stats, updatedAt: new Date() }).where(eq(founderProgress.userId, userId))
}
