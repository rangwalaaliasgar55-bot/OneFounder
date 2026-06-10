"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [ideasCount] = await db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.businessIdeas).where((0, drizzle_orm_1.eq)(schema_1.businessIdeas.userId, user.id));
    const [projectsCount] = await db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.userId, user.id));
    const [tasksCount] = await db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.userId, user.id));
    const [leadsCount] = await db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.leads).where((0, drizzle_orm_1.eq)(schema_1.leads.userId, user.id));
    const [contentCount] = await db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.contentPieces).where((0, drizzle_orm_1.eq)(schema_1.contentPieces.userId, user.id));
    const [reportsCount] = await db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.researchReports).where((0, drizzle_orm_1.eq)(schema_1.researchReports.userId, user.id));
    const [plansCount] = await db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.businessPlans).where((0, drizzle_orm_1.eq)(schema_1.businessPlans.userId, user.id));
    const recentIdeas = await db_1.db.select().from(schema_1.businessIdeas)
        .where((0, drizzle_orm_1.eq)(schema_1.businessIdeas.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.businessIdeas.createdAt))
        .limit(5);
    const recentTasks = await db_1.db.select().from(schema_1.tasks)
        .where((0, drizzle_orm_1.eq)(schema_1.tasks.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt))
        .limit(5);
    const recentLeads = await db_1.db.select().from(schema_1.leads)
        .where((0, drizzle_orm_1.eq)(schema_1.leads.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.leads.createdAt))
        .limit(5);
    res.json({
        stats: {
            ideas: Number(ideasCount.count),
            projects: Number(projectsCount.count),
            tasks: Number(tasksCount.count),
            leads: Number(leadsCount.count),
            content: Number(contentCount.count),
            reports: Number(reportsCount.count),
            plans: Number(plansCount.count),
        },
        recent: {
            ideas: recentIdeas,
            tasks: recentTasks,
            leads: recentLeads,
        }
    });
});
exports.default = router;
