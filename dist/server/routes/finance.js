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
    const entries = await db_1.db.select().from(schema_1.financeEntries)
        .where((0, drizzle_orm_1.eq)(schema_1.financeEntries.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.financeEntries.date));
    res.json(entries);
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const { type, amount, description, category, recurring, recurringInterval, date } = req.body;
    const [entry] = await db_1.db.insert(schema_1.financeEntries).values({
        userId: user.id,
        type,
        amount: Math.round(parseFloat(amount) * 100),
        description,
        category: category || 'Other',
        recurring: recurring || false,
        recurringInterval: recurringInterval || null,
        date: date ? new Date(date) : new Date(),
    }).returning();
    res.json({ ...entry, amount: entry.amount / 100 });
});
router.patch('/:id', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const updateData = { ...req.body, updatedAt: new Date() };
    if (updateData.amount)
        updateData.amount = Math.round(parseFloat(updateData.amount) * 100);
    const [updated] = await db_1.db.update(schema_1.financeEntries)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(schema_1.financeEntries.id, req.params.id))
        .returning();
    res.json({ ...updated, amount: updated.amount / 100 });
});
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    await db_1.db.delete(schema_1.financeEntries).where((0, drizzle_orm_1.eq)(schema_1.financeEntries.id, req.params.id));
    res.json({ success: true });
});
router.get('/summary', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const entries = await db_1.db.select().from(schema_1.financeEntries)
        .where((0, drizzle_orm_1.eq)(schema_1.financeEntries.userId, user.id));
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonth = entries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const revenue = thisMonth.filter(e => e.type === 'revenue').reduce((s, e) => s + e.amount, 0);
    const expenses = thisMonth.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const subscriptions = entries.filter(e => e.type === 'subscription' && e.recurring).reduce((s, e) => s + e.amount, 0);
    res.json({
        mrr: subscriptions / 100,
        monthRevenue: revenue / 100,
        monthExpenses: expenses / 100,
        profit: (revenue - expenses) / 100,
        totalEntries: entries.length,
    });
});
exports.default = router;
