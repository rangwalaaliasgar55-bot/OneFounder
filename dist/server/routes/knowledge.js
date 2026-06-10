"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const list = await db_1.db.select().from(schema_1.knowledgeBase)
        .where((0, drizzle_orm_1.eq)(schema_1.knowledgeBase.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.knowledgeBase.createdAt));
    res.json(list);
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [item] = await db_1.db.insert(schema_1.knowledgeBase).values({ ...req.body, userId: user.id }).returning();
    res.json(item);
});
router.patch('/:id', auth_1.requireAuth, async (req, res) => {
    const [updated] = await db_1.db.update(schema_1.knowledgeBase)
        .set({ ...req.body, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.knowledgeBase.id, req.params.id))
        .returning();
    res.json(updated);
});
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    await db_1.db.delete(schema_1.knowledgeBase).where((0, drizzle_orm_1.eq)(schema_1.knowledgeBase.id, req.params.id));
    res.json({ success: true });
});
exports.default = router;
