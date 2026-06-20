/**
 * Organizations API — create orgs, manage members, invites, shared resources.
 * RBAC: owner > admin > member > viewer
 */
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { organizations, orgMembers, orgInvites, orgSharedResources, users } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { randomBytes } from 'crypto'

const router = Router()

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

// ── Organization CRUD ───────────────────────────────────────────────────────

// GET /api/orgs — list user's organizations
router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const memberships = await db.select({
      orgId: orgMembers.orgId,
      role: orgMembers.role,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      orgPlan: organizations.plan,
      orgLogo: organizations.logo,
    })
      .from(orgMembers)
      .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
      .where(eq(orgMembers.userId, user.id))

    res.json(memberships)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/orgs — create organization
router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { name, description } = req.body

  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Name required (max 100 chars)' })
  }

  try {
    const slug = slugify(name) + '-' + randomBytes(3).toString('hex')

    const [org] = await db.insert(organizations).values({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      ownerId: user.id,
    }).returning()

    // Add creator as owner
    await db.insert(orgMembers).values({
      orgId: org.id,
      userId: user.id,
      role: 'owner',
    })

    res.json(org)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/orgs/:id — get organization details
router.get('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, req.params.id as string)).limit(1)
    if (!org) return res.status(404).json({ error: 'Organization not found' })

    // Check membership
    const [membership] = await db.select().from(orgMembers)
      .where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, user.id)))
      .limit(1)

    if (!membership) return res.status(403).json({ error: 'Not a member' })

    const members = await db.select({
      id: orgMembers.id,
      userId: orgMembers.userId,
      role: orgMembers.role,
      joinedAt: orgMembers.joinedAt,
      name: users.name,
      email: users.email,
    })
      .from(orgMembers)
      .innerJoin(users, eq(orgMembers.userId, users.id))
      .where(eq(orgMembers.orgId, org.id))

    res.json({ ...org, members, myRole: membership.role })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── Invites ─────────────────────────────────────────────────────────────────

// POST /api/orgs/:id/invite — invite member
router.post('/:id/invite', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { email, role } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email required' })
  }

  try {
    // Check user is admin/owner
    const [membership] = await db.select().from(orgMembers)
      .where(and(eq(orgMembers.orgId, req.params.id as string), eq(orgMembers.userId, user.id)))
      .limit(1)

    if (!membership || !['owner', 'admin'].includes(membership.role || '')) {
      return res.status(403).json({ error: 'Only owners and admins can invite' })
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const [invite] = await db.insert(orgInvites).values({
      orgId: req.params.id as string,
      email: email.trim().toLowerCase(),
      role: role || 'member',
      invitedBy: user.id,
      token,
      expiresAt,
    }).returning()

    res.json({ ...invite, inviteLink: `/invite/${token}` })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/orgs/accept/:token — accept invite
router.post('/accept/:token', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const [invite] = await db.select().from(orgInvites)
      .where(eq(orgInvites.token, req.params.token as string))
      .limit(1)

    if (!invite) return res.status(404).json({ error: 'Invite not found' })
    if (invite.acceptedAt) return res.status(400).json({ error: 'Invite already accepted' })
    if (invite.expiresAt < new Date()) return res.status(400).json({ error: 'Invite expired' })

    // Check if already a member
    const [existing] = await db.select().from(orgMembers)
      .where(and(eq(orgMembers.orgId, invite.orgId), eq(orgMembers.userId, user.id)))
      .limit(1)

    if (existing) return res.status(400).json({ error: 'Already a member' })

    // Add membership
    await db.insert(orgMembers).values({
      orgId: invite.orgId,
      userId: user.id,
      role: invite.role || 'member',
    })

    // Mark invite accepted
    await db.update(orgInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(orgInvites.id, invite.id))

    res.json({ success: true, orgId: invite.orgId })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── Member Management ───────────────────────────────────────────────────────

// PATCH /api/orgs/:id/members/:memberId — update role
router.patch('/:id/members/:memberId', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { role } = req.body

  if (!['admin', 'member', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }

  try {
    // Check requester is owner
    const [membership] = await db.select().from(orgMembers)
      .where(and(eq(orgMembers.orgId, req.params.id as string), eq(orgMembers.userId, user.id)))
      .limit(1)

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can change roles' })
    }

    const [updated] = await db.update(orgMembers)
      .set({ role })
      .where(eq(orgMembers.id, req.params.memberId as string))
      .returning()

    if (!updated) return res.status(404).json({ error: 'Member not found' })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/orgs/:id/members/:memberId — remove member
router.delete('/:id/members/:memberId', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const [membership] = await db.select().from(orgMembers)
      .where(and(eq(orgMembers.orgId, req.params.id as string), eq(orgMembers.userId, user.id)))
      .limit(1)

    if (!membership || !['owner', 'admin'].includes(membership.role || '')) {
      return res.status(403).json({ error: 'Only owners and admins can remove members' })
    }

    await db.delete(orgMembers).where(eq(orgMembers.id, req.params.memberId as string))
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── Shared Resources ────────────────────────────────────────────────────────

// POST /api/orgs/:id/share — share resource with org
router.post('/:id/share', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { resourceType, resourceId } = req.body

  if (!resourceType || !resourceId) {
    return res.status(400).json({ error: 'resourceType and resourceId required' })
  }

  try {
    const [shared] = await db.insert(orgSharedResources).values({
      orgId: req.params.id as string,
      resourceType,
      resourceId,
      sharedBy: user.id,
    }).returning()

    res.json(shared)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/orgs/:id/resources — list shared resources
router.get('/:id/resources', requireAuth, async (req, res) => {
  try {
    const resources = await db.select().from(orgSharedResources)
      .where(eq(orgSharedResources.orgId, req.params.id as string))
      .orderBy(desc(orgSharedResources.createdAt))

    res.json(resources)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
