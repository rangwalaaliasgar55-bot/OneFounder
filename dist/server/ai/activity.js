import { db } from '../db';
import { userActivityLog } from '../db/schema';
export async function logActivity(userId, action, module, entityId, metadata) {
    try {
        await db.insert(userActivityLog).values({
            userId,
            action,
            module,
            entityId: entityId || null,
            metadata: metadata || {},
        });
    }
    catch { }
}
