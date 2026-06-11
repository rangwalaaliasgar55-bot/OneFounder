"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAndStoreMemories = extractAndStoreMemories;
exports.getTopMemories = getTopMemories;
exports.upsertMemory = upsertMemory;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("./index");
async function extractAndStoreMemories(userId, userMessage, assistantResponse, source = 'chat') {
    try {
        const ai = await (0, index_1.getAIProvider)();
        const extractionPrompt = `Analyze this conversation and extract any durable, important facts about this founder that should be remembered for future conversations.

User said: "${userMessage}"
AI responded: "${assistantResponse.substring(0, 500)}"

Extract ONLY information that is:
- A stated goal, aspiration, or priority
- A business decision made
- A personal preference or working style insight
- A key business fact (company name, industry, customer type, etc.)
- A commitment or deadline they mentioned
- A pain point or challenge they're facing

Return a JSON array (can be empty [] if nothing worth storing). Each memory:
{
  "type": "goal|decision|preference|fact|pattern|reflection",
  "content": "concise 1-sentence memory",
  "importance": 1-10,
  "tags": ["tag1","tag2"]
}

Return ONLY the JSON array, nothing else.`;
        let memories = [];
        try {
            const raw = await ai.generate(extractionPrompt, 'You extract structured memories from conversations. Return ONLY valid JSON array.');
            const match = raw.match(/\[[\s\S]*\]/);
            if (match)
                memories = JSON.parse(match[0]);
        }
        catch { }
        if (!Array.isArray(memories) || memories.length === 0)
            return;
        const existing = await db_1.db.select({ content: schema_1.aiMemories.content })
            .from(schema_1.aiMemories)
            .where((0, drizzle_orm_1.eq)(schema_1.aiMemories.userId, userId))
            .limit(50);
        const existingContents = existing.map(e => e.content.toLowerCase());
        for (const mem of memories) {
            if (!mem.content || typeof mem.content !== 'string')
                continue;
            const isDuplicate = existingContents.some(e => e.includes(mem.content.toLowerCase().substring(0, 30)) ||
                mem.content.toLowerCase().includes(e.substring(0, 30)));
            if (isDuplicate)
                continue;
            await db_1.db.insert(schema_1.aiMemories).values({
                userId,
                type: mem.type || 'fact',
                content: mem.content,
                source,
                importance: Math.min(10, Math.max(1, Number(mem.importance) || 5)),
                tags: Array.isArray(mem.tags) ? mem.tags : [],
            });
        }
    }
    catch { }
}
async function getTopMemories(userId, limit = 10) {
    const memories = await db_1.db.select()
        .from(schema_1.aiMemories)
        .where((0, drizzle_orm_1.eq)(schema_1.aiMemories.userId, userId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.aiMemories.importance))
        .limit(limit);
    await Promise.all(memories.map(m => db_1.db.update(schema_1.aiMemories)
        .set({
        referenceCount: (m.referenceCount || 0) + 1,
        lastReferencedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.aiMemories.id, m.id))));
    return memories.map(m => `[${m.type}] ${m.content}`);
}
async function upsertMemory(userId, type, content, source, importance = 5) {
    await db_1.db.insert(schema_1.aiMemories).values({
        userId,
        type,
        content,
        source,
        importance,
        tags: [],
    });
}
