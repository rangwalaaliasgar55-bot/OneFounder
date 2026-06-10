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
    try {
        const [profile] = await db_1.db.select().from(schema_1.founderProfiles).where((0, drizzle_orm_1.eq)(schema_1.founderProfiles.userId, user.id));
        res.json(profile || null);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const { riskTolerance, workStyle, primaryGoal, bio, industry, stage } = req.body;
    try {
        const [existing] = await db_1.db.select().from(schema_1.founderProfiles).where((0, drizzle_orm_1.eq)(schema_1.founderProfiles.userId, user.id));
        if (existing) {
            const [updated] = await db_1.db.update(schema_1.founderProfiles)
                .set({ riskTolerance, workStyle, primaryGoal, bio, industry, stage, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.founderProfiles.userId, user.id))
                .returning();
            return res.json(updated);
        }
        const [created] = await db_1.db.insert(schema_1.founderProfiles).values({
            userId: user.id, riskTolerance, workStyle, primaryGoal, bio, industry, stage,
        }).returning();
        res.json(created);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
