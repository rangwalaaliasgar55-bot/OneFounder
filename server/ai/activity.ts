import { db } from '../db'
import { userActivityLog } from '../db/schema'

export async function logActivity(
  userId: string,
  action: string,
  module: string,
  entityId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await db.insert(userActivityLog).values({
      userId,
      action,
      module,
      entityId: entityId || null,
      metadata: metadata || {},
    })
  } catch {}
}
