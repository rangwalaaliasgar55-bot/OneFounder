import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { connections } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'

const router = Router()

/* ─── Static catalog of available integrations ──────────────────────── */
const CATALOG = [
  // Social Media
  { type: 'twitter', name: 'Twitter / X', icon: '🐦', category: 'social', description: 'Post tweets, track engagement, monitor mentions', credentialFields: ['bearerToken'], setupUrl: 'https://developer.twitter.com/en/portal/dashboard' },
  { type: 'instagram', name: 'Instagram', icon: '📸', category: 'social', description: 'Post photos, stories, reels via Graph API', credentialFields: ['accessToken', 'pageId'], setupUrl: 'https://developers.facebook.com/' },
  { type: 'linkedin', name: 'LinkedIn', icon: '💼', category: 'social', description: 'Share updates, articles, company posts', credentialFields: ['accessToken'], setupUrl: 'https://www.linkedin.com/developers/' },
  { type: 'facebook', name: 'Facebook', icon: '📘', category: 'social', description: 'Pages, posts, ads management', credentialFields: ['accessToken', 'pageId'], setupUrl: 'https://developers.facebook.com/' },
  { type: 'tiktok', name: 'TikTok', icon: '🎵', category: 'social', description: 'Short-form video content and analytics', credentialFields: ['accessToken'], setupUrl: 'https://developers.tiktok.com/' },
  { type: 'youtube', name: 'YouTube', icon: '▶️', category: 'social', description: 'Video uploads, channel analytics', credentialFields: ['apiKey'], setupUrl: 'https://console.cloud.google.com/' },
  { type: 'pinterest', name: 'Pinterest', icon: '📌', category: 'social', description: 'Pins, boards, traffic analytics', credentialFields: ['accessToken'], setupUrl: 'https://developers.pinterest.com/' },
  { type: 'reddit', name: 'Reddit', icon: '🔴', category: 'social', description: 'Community posts, subreddit monitoring', credentialFields: ['clientId', 'clientSecret', 'refreshToken'], setupUrl: 'https://www.reddit.com/prefs/apps/' },
  { type: 'threads', name: 'Threads', icon: '🧵', category: 'social', description: 'Text-based social posts via Meta API', credentialFields: ['accessToken', 'userId'], setupUrl: 'https://developers.facebook.com/' },
  { type: 'bluesky', name: 'Bluesky', icon: '🦋', category: 'social', description: 'Decentralized social posting', credentialFields: ['handle', 'appPassword'], setupUrl: 'https://bsky.app/settings/app-passwords' },
  // Website Platforms
  { type: 'wordpress', name: 'WordPress', icon: '🌐', category: 'website', description: 'Manage posts, pages, SEO via REST API', credentialFields: ['url', 'username', 'applicationPassword'], setupUrl: '' },
  { type: 'shopify', name: 'Shopify', icon: '🛒', category: 'website', description: 'Products, orders, inventory management', credentialFields: ['shopDomain', 'accessToken'], setupUrl: 'https://partners.shopify.com/' },
  { type: 'wix', name: 'Wix', icon: '🇼', category: 'website', description: 'Site content and blog management', credentialFields: ['apiKey', 'siteId'], setupUrl: 'https://dev.wix.com/' },
  { type: 'squarespace', name: 'Squarespace', icon: '⬛', category: 'website', description: 'Site and blog content management', credentialFields: ['apiKey', 'siteId'], setupUrl: 'https://developers.squarespace.com/' },
  { type: 'webflow', name: 'Webflow', icon: '🌊', category: 'website', description: 'CMS items, forms, site publishing', credentialFields: ['apiToken', 'siteId'], setupUrl: 'https://webflow.com/dashboard/integrations' },
  { type: 'custom_website', name: 'Custom Website', icon: '🔗', category: 'website', description: 'Connect any website via URL for monitoring', credentialFields: ['url'], setupUrl: '' },
  // Analytics
  { type: 'google_analytics', name: 'Google Analytics', icon: '📊', category: 'analytics', description: 'Traffic, conversions, audience insights', credentialFields: ['propertyId', 'credentialsJson'], setupUrl: 'https://console.cloud.google.com/' },
  // Tools
  { type: 'mailchimp', name: 'Mailchimp', icon: '📧', category: 'tools', description: 'Email campaigns, audience lists, automations', credentialFields: ['apiKey', 'serverPrefix'], setupUrl: 'https://mailchimp.com/developer/' },
  { type: 'stripe', name: 'Stripe', icon: '💳', category: 'tools', description: 'Payments, subscriptions, invoices', credentialFields: ['secretKey', 'publishableKey'], setupUrl: 'https://dashboard.stripe.com/apikeys' },
  { type: 'zapier', name: 'Zapier', icon: '⚡', category: 'tools', description: 'Automation workflows and webhooks', credentialFields: ['webhookUrl'], setupUrl: 'https://zapier.com/app/dashboard' },
  { type: 'github', name: 'GitHub', icon: '🐙', category: 'tools', description: 'Repos, issues, pull requests, deployments', credentialFields: ['personalAccessToken'], setupUrl: 'https://github.com/settings/tokens' },
]

/* ─── Test helpers per integration type ──────────────────────────────── */
async function testConnection(type: string, creds: Record<string, any>): Promise<{ ok: boolean; message: string }> {
  try {
    switch (type) {
      case 'wordpress': {
        if (!creds.url) return { ok: false, message: 'URL is required' }
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (creds.username && creds.applicationPassword) {
          headers['Authorization'] = 'Basic ' + Buffer.from(`${creds.username}:${creds.applicationPassword}`).toString('base64')
        }
        const res = await fetch(`${creds.url.replace(/\/$/, '')}/wp-json/wp/v2/posts?per_page=1`, {
          headers,
          signal: AbortSignal.timeout(10000),
        })
        return res.ok
          ? { ok: true, message: `Connected — ${res.status}` }
          : { ok: false, message: `HTTP ${res.status}` }
      }
      case 'custom_website': {
        if (!creds.url) return { ok: false, message: 'URL is required' }
        const res = await fetch(creds.url, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
        return res.ok
          ? { ok: true, message: `Reachable — ${res.status}` }
          : { ok: false, message: `HTTP ${res.status}` }
      }
      case 'twitter': {
        if (!creds.bearerToken) return { ok: false, message: 'Bearer token required' }
        const res = await fetch('https://api.twitter.com/2/users/me', {
          headers: { 'Authorization': `Bearer ${creds.bearerToken}` },
          signal: AbortSignal.timeout(10000),
        })
        return res.ok
          ? { ok: true, message: 'Authenticated' }
          : { ok: false, message: `Auth failed — ${res.status}` }
      }
      case 'linkedin': {
        if (!creds.accessToken) return { ok: false, message: 'Access token required' }
        const res = await fetch('https://api.linkedin.com/v2/me', {
          headers: { 'Authorization': `Bearer ${creds.accessToken}` },
          signal: AbortSignal.timeout(10000),
        })
        return res.ok
          ? { ok: true, message: 'Authenticated' }
          : { ok: false, message: `Auth failed — ${res.status}` }
      }
      case 'facebook':
      case 'instagram':
      case 'threads': {
        if (!creds.accessToken) return { ok: false, message: 'Access token required' }
        const res = await fetch(`https://graph.facebook.com/me?access_token=${creds.accessToken}`, {
          signal: AbortSignal.timeout(10000),
        })
        return res.ok
          ? { ok: true, message: 'Authenticated' }
          : { ok: false, message: `Auth failed — ${res.status}` }
      }
      case 'github': {
        if (!creds.personalAccessToken) return { ok: false, message: 'Token required' }
        const res = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${creds.personalAccessToken}`, 'User-Agent': 'OneFounder' },
          signal: AbortSignal.timeout(10000),
        })
        return res.ok
          ? { ok: true, message: 'Authenticated' }
          : { ok: false, message: `Auth failed — ${res.status}` }
      }
      case 'stripe': {
        if (!creds.secretKey) return { ok: false, message: 'Secret key required' }
        const res = await fetch('https://api.stripe.com/v1/balance', {
          headers: { 'Authorization': `Bearer ${creds.secretKey}` },
          signal: AbortSignal.timeout(10000),
        })
        return res.ok
          ? { ok: true, message: 'Authenticated' }
          : { ok: false, message: `Auth failed — ${res.status}` }
      }
      case 'shopify': {
        if (!creds.shopDomain || !creds.accessToken) return { ok: false, message: 'Domain and token required' }
        const domain = creds.shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
        const res = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
          headers: { 'X-Shopify-Access-Token': creds.accessToken },
          signal: AbortSignal.timeout(10000),
        })
        return res.ok
          ? { ok: true, message: 'Connected to shop' }
          : { ok: false, message: `Auth failed — ${res.status}` }
      }
      case 'webflow': {
        if (!creds.apiToken) return { ok: false, message: 'API token required' }
        const res = await fetch('https://api.webflow.com/v2/sites', {
          headers: { 'Authorization': `Bearer ${creds.apiToken}` },
          signal: AbortSignal.timeout(10000),
        })
        return res.ok
          ? { ok: true, message: 'Authenticated' }
          : { ok: false, message: `Auth failed — ${res.status}` }
      }
      default:
        return { ok: true, message: 'Credentials saved — test not available for this integration' }
    }
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection test failed' }
  }
}

/* ─── Routes ─────────────────────────────────────────────────────────── */

// GET /api/connections/catalog — static list of available integrations
router.get('/catalog', (_req, res) => {
  res.json(CATALOG)
})

// GET /api/connections — list user's connections
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const list = await db.select().from(connections)
      .where(eq(connections.userId, user.id))
      .orderBy(desc(connections.createdAt))
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load connections' })
  }
})

// POST /api/connections — create a new connection
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { type, name, credentials } = req.body
    if (!type) return res.status(400).json({ error: 'type is required' })
    if (!name) return res.status(400).json({ error: 'name is required' })

    const [conn] = await db.insert(connections).values({
      userId: user.id,
      type,
      name,
      credentials: credentials || {},
      status: 'pending',
    }).returning()
    res.json(conn)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create connection' })
  }
})

// PATCH /api/connections/:id — update connection
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { name, credentials, status, metadata } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (credentials !== undefined) updateData.credentials = credentials
    if (status !== undefined) updateData.status = status
    if (metadata !== undefined) updateData.metadata = metadata

    const [updated] = await db.update(connections)
      .set(updateData)
      .where(and(eq(connections.id, req.params.id as string), eq(connections.userId, user.id)))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Connection not found' })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update connection' })
  }
})

// DELETE /api/connections/:id — remove connection
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const result = await db.delete(connections)
      .where(and(eq(connections.id, req.params.id as string), eq(connections.userId, user.id)))
      .returning({ id: connections.id })
    if (result.length === 0) return res.status(404).json({ error: 'Connection not found' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete connection' })
  }
})

// POST /api/connections/:id/test — test a connection
router.post('/:id/test', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const [conn] = await db.select().from(connections)
      .where(and(eq(connections.id, req.params.id as string), eq(connections.userId, user.id)))
    if (!conn) return res.status(404).json({ error: 'Connection not found' })

    const creds = (conn.credentials as Record<string, any>) || {}
    const result = await testConnection(conn.type, creds)

    // Update status based on test result
    const newStatus = result.ok ? 'connected' : 'error'
    await db.update(connections)
      .set({ status: newStatus, lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(connections.id, conn.id))

    res.json({ ...result, status: newStatus })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Test failed' })
  }
})

export default router
