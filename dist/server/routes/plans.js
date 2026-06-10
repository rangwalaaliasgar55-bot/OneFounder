"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const ai_1 = require("../ai");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const plans = await db_1.db.select().from(schema_1.businessPlans)
        .where((0, drizzle_orm_1.eq)(schema_1.businessPlans.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.businessPlans.createdAt));
    res.json(plans);
});
router.post('/generate', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const { title, businessType, targetMarket, uniqueValue, ideaId } = req.body;
    const prompt = `Create a comprehensive business plan for:
- Business: ${title}
- Type: ${businessType || 'SaaS'}
- Target Market: ${targetMarket || 'Small businesses'}
- Unique Value: ${uniqueValue || 'AI-powered automation'}

Include:
1. BUSINESS MODEL: Revenue streams, pricing strategy, unit economics
2. CUSTOMER PROFILE: Demographics, psychographics, pain points, jobs-to-be-done
3. PRICING STRATEGY: Tiers, pricing psychology, competitive positioning
4. ACQUISITION STRATEGY: Top 5 channels, cost per acquisition estimates, timeline
5. LAUNCH STRATEGY: Pre-launch, launch day, post-launch (90 days)
6. GROWTH STRATEGY: 6-month, 12-month, 24-month milestones
7. FINANCIAL PROJECTIONS: Month 1-12 revenue projections

Return as JSON with keys: businessModel, customerProfile, pricing, acquisitionStrategy, launchStrategy, growthStrategy, financialProjections`;
    try {
        const ai = await (0, ai_1.getAIProvider)();
        const response = await ai.generate(prompt, 'You are a startup business advisor. Return ONLY valid JSON.');
        let data = {};
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch)
                data = JSON.parse(jsonMatch[0]);
        }
        catch {
            data = {};
        }
        const [plan] = await db_1.db.insert(schema_1.businessPlans).values({
            userId: user.id,
            ideaId: ideaId || null,
            title,
            businessModel: data.businessModel,
            customerProfile: data.customerProfile,
            pricing: data.pricing,
            acquisitionStrategy: data.acquisitionStrategy,
            launchStrategy: data.launchStrategy,
            growthStrategy: data.growthStrategy,
            financialProjections: data.financialProjections,
            fullPlan: response,
        }).returning();
        res.json(plan);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [plan] = await db_1.db.select().from(schema_1.businessPlans)
        .where((0, drizzle_orm_1.eq)(schema_1.businessPlans.id, req.params.id));
    if (!plan || plan.userId !== user.id)
        return res.status(404).json({ error: 'Not found' });
    res.json(plan);
});
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    await db_1.db.delete(schema_1.businessPlans).where((0, drizzle_orm_1.eq)(schema_1.businessPlans.id, req.params.id));
    res.json({ success: true });
});
exports.default = router;
