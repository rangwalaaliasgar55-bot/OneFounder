/**
 * Growth API — XP, levels, achievements, streaks, leaderboard.
 */
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getProgress, getFounderStats, ACHIEVEMENTS, LEVEL_TITLES, LEVEL_THRESHOLDS } from '../growth/engine.js'
import { db } from '../db/index.js'
import { founderProgress, users } from '../db/schema.js'
import { desc, eq } from 'drizzle-orm'

const router = Router()

// GET /api/growth/progress — user's XP, level, streak, achievements
router.get('/progress', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const progress = await getProgress(user.id)
    const stats = await getFounderStats(user.id)

    // Find next uncompleted achievements
    const nextAchievements = ACHIEVEMENTS
      .filter(a => !progress.achievements.includes(a.id))
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xp: a.xp,
        unlocked: false,
      }))

    const completedAchievements = ACHIEVEMENTS
      .filter(a => progress.achievements.includes(a.id))
      .map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xp: a.xp,
        unlocked: true,
      }))

    res.json({
      ...progress,
      stats,
      nextAchievements,
      completedAchievements,
      allAchievements: ACHIEVEMENTS.length,
      totalLevels: LEVEL_THRESHOLDS.length,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/growth/leaderboard — top founders by XP
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const leaders = await db.select({
      userId: founderProgress.userId,
      xp: founderProgress.xp,
      level: founderProgress.level,
      streak: founderProgress.streak,
      name: users.name,
      email: users.email,
    })
      .from(founderProgress)
      .leftJoin(users, eq(founderProgress.userId, users.id))
      .orderBy(desc(founderProgress.xp))
      .limit(20)

    res.json(leaders.map((l, i) => ({
      rank: i + 1,
      name: l.name || l.email?.split('@')[0] || 'Founder',
      xp: l.xp || 0,
      level: l.level || 1,
      title: LEVEL_TITLES[Math.min((l.level || 1) - 1, LEVEL_TITLES.length - 1)],
      streak: l.streak || 0,
    })))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/growth/achievements — all achievements with status
router.get('/achievements', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const progress = await getProgress(user.id)
    const unlocked = new Set(progress.achievements)

    res.json(ACHIEVEMENTS.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xp: a.xp,
      unlocked: unlocked.has(a.id),
    })))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/growth/levels — level progression info
router.get('/levels', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const progress = await getProgress(user.id)

    res.json({
      current: { level: progress.level, title: progress.title, xp: progress.xp },
      levels: LEVEL_THRESHOLDS.map((threshold, i) => ({
        level: i + 1,
        title: LEVEL_TITLES[i] || `Level ${i + 1}`,
        xpRequired: threshold,
        unlocked: progress.xp >= threshold,
      })),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
