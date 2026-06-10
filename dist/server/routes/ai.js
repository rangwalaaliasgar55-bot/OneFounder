"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ai_1 = require("../ai");
const router = (0, express_1.Router)();
router.get('/status', auth_1.requireAuth, async (req, res) => {
    const status = await (0, ai_1.getAIStatus)();
    res.json(status);
});
router.post('/chat', auth_1.requireAuth, async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array required' });
    }
    try {
        const ai = await (0, ai_1.getAIProvider)();
        const response = await ai.chat(messages);
        res.json({ content: response });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/generate', auth_1.requireAuth, async (req, res) => {
    const { prompt, systemPrompt } = req.body;
    if (!prompt)
        return res.status(400).json({ error: 'Prompt required' });
    try {
        const ai = await (0, ai_1.getAIProvider)();
        const response = await ai.generate(prompt, systemPrompt);
        res.json({ content: response });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/research', auth_1.requireAuth, async (req, res) => {
    const { topic } = req.body;
    if (!topic)
        return res.status(400).json({ error: 'Topic required' });
    try {
        const ai = await (0, ai_1.getAIProvider)();
        const response = await ai.research(topic);
        res.json({ content: response });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
