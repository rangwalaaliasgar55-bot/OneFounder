/**
 * Audit logging for security-sensitive operations.
 * Records who did what, when, from where.
 */
import type { Request } from 'express'
import { db } from '../db/index.js'
import { auditLogs } from '../db/schema.js'

export async function logAudit(opts: {
  actorId?: string
  actorEmail?: string
  action: string
  target?: string
  targetId?: string
  details?: Record<string, unknown>
  req?: Request
}) {
  try {
    await db.insert(auditLogs).values({
      actorId: opts.actorId || null,
      actorEmail: opts.actorEmail || null,
      action: opts.action,
      target: opts.target || null,
      targetId: opts.targetId || null,
      details: opts.details || null,
      ipAddress: opts.req?.ip || opts.req?.socket?.remoteAddress || null,
      userAgent: opts.req?.get('user-agent') || null,
    })
  } catch (err: any) {
    // Audit logging should never crash the request
    console.error('[Audit] Failed to log:', err.message)
  }
}

// Convenience helpers
export async function logAdminAction(req: Request, action: string, targetId: string, details?: Record<string, unknown>) {
  const user = (req as any).user
  await logAudit({
    actorId: user?.id,
    actorEmail: user?.email,
    action,
    target: 'user',
    targetId,
    details,
    req,
  })
}

export async function logSecurityEvent(req: Request, action: string, details?: Record<string, unknown>) {
  const user = (req as any).user
  await logAudit({
    actorId: user?.id,
    actorEmail: user?.email,
    action,
    target: 'security',
    details,
    req,
  })
}
