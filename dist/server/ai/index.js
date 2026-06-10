"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIProvider = getAIProvider;
exports.getAIStatus = getAIStatus;
const claude_1 = require("./claude");
const ollama_1 = require("./ollama");
const mock_1 = require("./mock");
let aiProvider = null;
let activeProviderName = 'mock';
async function getAIProvider() {
    if (aiProvider)
        return aiProvider;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
        console.log('✅ Claude AI provider connected (claude-sonnet-4-20250514)');
        activeProviderName = 'claude';
        aiProvider = new claude_1.ClaudeProvider(anthropicKey);
        return aiProvider;
    }
    const ollama = new ollama_1.OllamaProvider(process.env.OLLAMA_BASE_URL || 'http://localhost:11434', process.env.OLLAMA_MODEL || 'llama3.2');
    const available = await ollama.isAvailable();
    if (available) {
        console.log('✅ Ollama AI provider connected');
        activeProviderName = 'ollama';
        aiProvider = ollama;
    }
    else {
        console.log('⚠️  No AI provider available, using demo mode.');
        activeProviderName = 'mock';
        aiProvider = new mock_1.MockAIProvider();
    }
    return aiProvider;
}
async function getAIStatus() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
        return { available: true, provider: 'claude', models: ['claude-sonnet-4-20250514'] };
    }
    const ollama = new ollama_1.OllamaProvider(process.env.OLLAMA_BASE_URL || 'http://localhost:11434', process.env.OLLAMA_MODEL || 'llama3.2');
    const available = await ollama.isAvailable();
    if (available) {
        const models = await ollama.listModels();
        return { available: true, provider: 'ollama', models };
    }
    return { available: false, provider: 'mock' };
}
