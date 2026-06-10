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
    const reports = await db_1.db.select().from(schema_1.researchReports)
        .where((0, drizzle_orm_1.eq)(schema_1.researchReports.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.researchReports.createdAt));
    res.json(reports);
});
router.post('/analyze', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const { niche, ideaId } = req.body;
    if (!niche)
        return res.status(400).json({ error: 'Niche required' });
    const prompt = `Perform comprehensive market research for: "${niche}"

Provide detailed analysis including:

1. TOP 5 COMPETITORS: name, website, strengths, weaknesses, pricing
2. MARKET TRENDS: 5 key trends shaping this market
3. OPPORTUNITIES: 5 untapped opportunities
4. KEYWORDS: 10 high-value keywords with search volume estimates
5. SWOT ANALYSIS: detailed SWOT
6. RISKS: top 5 risks and mitigation strategies
7. MARKET SIZE: TAM, SAM, SOM estimates

Return as valid JSON with keys: competitors, trends, opportunities, keywords, swot, risks, marketSize`;
    try {
        const ai = await (0, ai_1.getAIProvider)();
        const response = await ai.generate(prompt, 'You are a market research expert. Return ONLY valid JSON.');
        let data = {};
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch)
                data = JSON.parse(jsonMatch[0]);
        }
        catch {
            data = {};
        }
        const [report] = await db_1.db.insert(schema_1.researchReports).values({
            userId: user.id,
            ideaId: ideaId || null,
            title: `Market Research: ${niche}`,
            niche,
            competitors: data.competitors || [],
            swot: data.swot || {},
            trends: data.trends || [],
            opportunities: data.opportunities || [],
            keywords: data.keywords || [],
            risks: data.risks || [],
            fullReport: response,
        }).returning();
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [report] = await db_1.db.select().from(schema_1.researchReports)
        .where((0, drizzle_orm_1.eq)(schema_1.researchReports.id, req.params.id));
    if (!report || report.userId !== user.id)
        return res.status(404).json({ error: 'Not found' });
    res.json(report);
});
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    await db_1.db.delete(schema_1.researchReports).where((0, drizzle_orm_1.eq)(schema_1.researchReports.id, req.params.id));
    res.json({ success: true });
});
exports.default = router;
