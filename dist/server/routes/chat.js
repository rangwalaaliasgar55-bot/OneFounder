"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const ai_1 = require("../ai");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
router.get('/sessions', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const messages = await db_1.db.select().from(schema_1.chatMessages)
        .where((0, drizzle_orm_1.eq)(schema_1.chatMessages.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.chatMessages.createdAt));
    const sessions = new Map();
    messages.forEach(m => {
        if (!sessions.has(m.sessionId)) {
            sessions.set(m.sessionId, {
                id: m.sessionId,
                lastMessage: m.content.substring(0, 80),
                createdAt: m.createdAt,
                role: m.role,
            });
        }
    });
    res.json(Array.from(sessions.values()));
});
router.get('/:sessionId', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const messages = await db_1.db.select().from(schema_1.chatMessages)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatMessages.userId, user.id), (0, drizzle_orm_1.eq)(schema_1.chatMessages.sessionId, req.params.sessionId)))
        .orderBy(schema_1.chatMessages.createdAt);
    res.json(messages);
});
router.post('/send', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const { message, sessionId, agentType } = req.body;
    if (!message)
        return res.status(400).json({ error: 'Message required' });
    const session = sessionId || (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.chatMessages).values({
        userId: user.id,
        sessionId: session,
        role: 'user',
        content: message,
    });
    const history = await db_1.db.select().from(schema_1.chatMessages)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatMessages.userId, user.id), (0, drizzle_orm_1.eq)(schema_1.chatMessages.sessionId, session)))
        .orderBy(schema_1.chatMessages.createdAt);
    const agentPrompts = {
        ceo: 'You are the CEO Agent for OneFounder. You help with business strategy, decision-making, prioritization, and high-level planning. Be strategic, decisive, and results-focused.',
        marketing: 'You are the Marketing Agent. You help with growth strategies, content marketing, brand positioning, and customer acquisition. Be creative and data-driven.',
        seo: 'You are the SEO Agent. You help with keyword research, content optimization, technical SEO, and ranking strategies. Be specific and actionable.',
        sales: 'You are the Sales Agent. You help with lead generation, outreach scripts, proposals, and closing strategies. Be persuasive and practical.',
        research: 'You are the Research Agent. You analyze competitors, markets, and opportunities. Provide data-driven insights and strategic recommendations.',
        operations: 'You are the Operations Agent. You help optimize workflows, processes, and business systems for maximum efficiency.',
        product: 'You are the Product Agent. You help with product planning, feature prioritization, user stories, and product strategy.',
        founder: `You are the Founder AI, the personal AI assistant of OneFounder. You are a brilliant, experienced startup advisor and business strategist. Help this founder build and grow their business with practical, actionable advice. Be direct, insightful, and encouraging.`,
    };
    const systemPrompt = agentPrompts[agentType] || agentPrompts.founder;
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content }))
    ];
    try {
        const ai = await (0, ai_1.getAIProvider)();
        const response = await ai.chat(messages);
        const [saved] = await db_1.db.insert(schema_1.chatMessages).values({
            userId: user.id,
            sessionId: session,
            role: 'assistant',
            content: response,
            model: 'ollama',
        }).returning();
        res.json({ message: saved, sessionId: session });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
