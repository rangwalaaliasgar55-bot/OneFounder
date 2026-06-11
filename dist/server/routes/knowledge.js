import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
import { knowledgeBase } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
    const user = req.user;
    const list = await db.select().from(knowledgeBase)
        .where(eq(knowledgeBase.userId, user.id))
        .orderBy(desc(knowledgeBase.createdAt));
    res.json(list);
});
router.post('/', requireAuth, async (req, res) => {
    const user = req.user;
    const [item] = await db.insert(knowledgeBase).values({ ...req.body, userId: user.id }).returning();
    res.json(item);
});
router.patch('/:id', requireAuth, async (req, res) => {
    const [updated] = await db.update(knowledgeBase)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(knowledgeBase.id, req.params.id))
        .returning();
    res.json(updated);
});
router.delete('/:id', requireAuth, async (req, res) => {
    await db.delete(knowledgeBase).where(eq(knowledgeBase.id, req.params.id));
    res.json({ success: true });
});
export default router;
