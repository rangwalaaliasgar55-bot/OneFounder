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
    const list = await db_1.db.select().from(schema_1.projects)
        .where((0, drizzle_orm_1.eq)(schema_1.projects.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.projects.createdAt));
    res.json(list);
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [project] = await db_1.db.insert(schema_1.projects).values({ ...req.body, userId: user.id }).returning();
    res.json(project);
});
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [project] = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.id, req.params.id));
    if (!project || project.userId !== user.id)
        return res.status(404).json({ error: 'Not found' });
    const ms = await db_1.db.select().from(schema_1.milestones).where((0, drizzle_orm_1.eq)(schema_1.milestones.projectId, project.id));
    const ts = await db_1.db.select().from(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.projectId, project.id));
    res.json({ ...project, milestones: ms, tasks: ts });
});
router.patch('/:id', auth_1.requireAuth, async (req, res) => {
    const [updated] = await db_1.db.update(schema_1.projects)
        .set({ ...req.body, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.projects.id, req.params.id))
        .returning();
    res.json(updated);
});
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    await db_1.db.delete(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.id, req.params.id));
    res.json({ success: true });
});
router.get('/:id/tasks', auth_1.requireAuth, async (req, res) => {
    const ts = await db_1.db.select().from(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.projectId, req.params.id)).orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    res.json(ts);
});
router.post('/:id/tasks', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [task] = await db_1.db.insert(schema_1.tasks).values({ ...req.body, projectId: req.params.id, userId: user.id }).returning();
    res.json(task);
});
router.patch('/tasks/:taskId', auth_1.requireAuth, async (req, res) => {
    const [task] = await db_1.db.update(schema_1.tasks)
        .set({ ...req.body, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, req.params.taskId))
        .returning();
    res.json(task);
});
exports.default = router;
