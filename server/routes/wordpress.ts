import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { wpSites } from '../db/schema'
import { eq, and } from 'drizzle-orm'

const router = Router()

router.post('/sites', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { siteUrl, siteName, username, applicationPassword } = req.body
  if (!siteUrl) return res.status(400).json({ error: 'siteUrl is required' })
  try {
    const [site] = await db.insert(wpSites).values({
      userId: user.id,
      siteUrl: siteUrl.replace(/\/$/, ''),
      siteName: siteName || siteUrl,
      username,
      applicationPassword,
    }).returning()
    res.json(site)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.get('/sites', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const sites = await db.select().from(wpSites).where(eq(wpSites.userId, user.id))
    res.json(sites)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.get('/sites/:id/posts', requireAuth, async (req, res) => {
  const user = (req as any).user
  const id = req.params.id as string
  try {
    const [site] = await db.select().from(wpSites).where(and(eq(wpSites.id, id), eq(wpSites.userId, user.id)))
    if (!site) return res.status(404).json({ error: 'Site not found' })

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (site.username && site.applicationPassword) {
      headers['Authorization'] = 'Basic ' + Buffer.from(`${site.username}:${site.applicationPassword}`).toString('base64')
    }
    const wpRes = await fetch(`${site.siteUrl}/wp-json/wp/v2/posts?per_page=20&_fields=id,title,status,date,link,excerpt`, {
      headers,
      signal: AbortSignal.timeout(10000),
    })
    if (!wpRes.ok) return res.status(wpRes.status).json({ error: 'WordPress API error' })
    const posts = await wpRes.json()
    res.json(posts)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.post('/sites/:id/posts', requireAuth, async (req, res) => {
  const user = (req as any).user
  const id = req.params.id as string
  const { title, content, status = 'draft' } = req.body
  try {
    const [site] = await db.select().from(wpSites).where(and(eq(wpSites.id, id), eq(wpSites.userId, user.id)))
    if (!site) return res.status(404).json({ error: 'Site not found' })
    if (!site.username || !site.applicationPassword) return res.status(400).json({ error: 'Application password required to create posts' })

    const wpRes = await fetch(`${site.siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${site.username}:${site.applicationPassword}`).toString('base64'),
      },
      body: JSON.stringify({ title, content, status }),
      signal: AbortSignal.timeout(10000),
    })
    if (!wpRes.ok) return res.status(wpRes.status).json({ error: 'WordPress API error' })
    const post = await wpRes.json()
    res.json(post)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.delete('/sites/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const id = req.params.id as string
  try {
    await db.delete(wpSites).where(and(eq(wpSites.id, id), eq(wpSites.userId, user.id)))
    res.json({ success: true })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

export default router
