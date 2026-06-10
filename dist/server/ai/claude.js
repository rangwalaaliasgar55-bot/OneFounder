"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeProvider = void 0;
class ClaudeProvider {
    apiKey;
    model;
    constructor(apiKey, model = 'claude-sonnet-4-20250514') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async chat(messages) {
        const system = messages.find(m => m.role === 'system')?.content;
        const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
        }));
        const body = {
            model: this.model,
            max_tokens: 4096,
            messages: userMessages,
        };
        if (system)
            body.system = system;
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Claude API error ${response.status}: ${err}`);
        }
        const data = await response.json();
        return data.content?.[0]?.text || '';
    }
    async generate(prompt, systemPrompt) {
        const messages = [];
        if (systemPrompt)
            messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });
        return this.chat(messages);
    }
    async summarize(text) {
        return this.generate(`Summarize the following text concisely:\n\n${text}`, 'You are a helpful assistant that creates concise, accurate summaries.');
    }
    async analyze(text, instruction) {
        return this.generate(`${instruction}\n\nText to analyze:\n${text}`, 'You are an expert business analyst. Provide structured, actionable insights.');
    }
    async research(topic) {
        return this.generate(`Research and provide comprehensive insights about: ${topic}`, 'You are a business research expert. Provide data-driven insights, market analysis, and strategic recommendations.');
    }
}
exports.ClaudeProvider = ClaudeProvider;
