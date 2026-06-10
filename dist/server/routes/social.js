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
    const posts = await db_1.db.select().from(schema_1.socialPosts)
        .where((0, drizzle_orm_1.eq)(schema_1.socialPosts.userId, user.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.socialPosts.createdAt));
    res.json(posts);
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const { platform, content, hashtags, scheduledAt } = req.body;
    const [post] = await db_1.db.insert(schema_1.socialPosts).values({
        userId: user.id,
        platform,
        content,
        hashtags: hashtags || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    }).returning();
    res.json(post);
});
router.post('/generate', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const { platform, topic, tone, businessContext } = req.body;
    const platformGuides = {
        linkedin: 'Professional tone, 1300 chars max, storytelling hook, industry insights, 3-5 hashtags',
        twitter: 'Punchy, max 280 chars, conversational, 1-2 hashtags, strong hook',
        instagram: 'Visual-first caption, emojis welcome, 30 hashtags max, call to action',
        tiktok: 'Gen Z friendly, trendy language, 150 chars, viral hook, 5-7 hashtags',
        facebook: 'Conversational, 500 chars, community-focused, question to drive comments',
    };
    const prompt = `Write a ${platform} post about: ${topic}
Tone: ${tone || 'professional and engaging'}
Business context: ${businessContext || 'startup founder sharing insights'}
Platform guide: ${platformGuides[platform] || 'engaging and on-brand'}

Return JSON: { "content": "post text", "hashtags": ["tag1", "tag2"] }`;
    try {
        const ai = await (0, ai_1.getAIProvider)();
        const response = await ai.generate(prompt, 'You are a social media expert. Return ONLY valid JSON.');
        let result = { content: '', hashtags: [] };
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch)
                result = JSON.parse(jsonMatch[0]);
        }
        catch {
            result = {
                content: `🚀 ${topic}\n\nAs a founder, I've learned that the best solutions come from real problems. Here's what I discovered...\n\n[Add your story here]\n\n#startup #founder #entrepreneurship`,
                hashtags: ['startup', 'founder', 'entrepreneurship'],
            };
        }
        const [post] = await db_1.db.insert(schema_1.socialPosts).values({
            userId: user.id,
            platform: platform,
            content: result.content,
            hashtags: result.hashtags,
        }).returning();
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.patch('/:id', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [updated] = await db_1.db.update(schema_1.socialPosts)
        .set({ ...req.body, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.socialPosts.id, req.params.id))
        .returning();
    res.json(updated);
});
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    await db_1.db.delete(schema_1.socialPosts).where((0, drizzle_orm_1.eq)(schema_1.socialPosts.id, req.params.id));
    res.json({ success: true });
});
exports.default = router;
