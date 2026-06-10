"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIProvider = void 0;
class MockAIProvider {
    async generate(prompt, systemPrompt) {
        await new Promise(r => setTimeout(r, 800));
        return `[AI Demo Mode] Response to: "${prompt.substring(0, 60)}..."\n\nTo enable real AI, install Ollama (ollama.ai) and run: ollama pull llama3.2`;
    }
    async chat(messages) {
        await new Promise(r => setTimeout(r, 800));
        const last = messages[messages.length - 1];
        return `[AI Demo Mode] I received your message: "${last.content.substring(0, 80)}"\n\nTo enable real AI responses, install Ollama and pull a model (e.g., llama3.2, deepseek-r1, qwen2.5).`;
    }
    async summarize(text) {
        await new Promise(r => setTimeout(r, 500));
        return `[Demo Summary] This content covers key business topics and strategic insights relevant to your goals.`;
    }
    async analyze(text, instruction) {
        await new Promise(r => setTimeout(r, 600));
        return `[Demo Analysis] Based on the provided content, here are key insights:\n\n• Strong market opportunity identified\n• Competitive landscape is manageable\n• Clear path to profitability exists\n• Recommended next steps: validate with customers`;
    }
    async research(topic) {
        await new Promise(r => setTimeout(r, 700));
        return `[Demo Research] Topic: ${topic}\n\nMarket Overview:\n• Growing market with 15-25% YoY growth\n• Multiple underserved niches available\n• Digital-first approach provides competitive advantage\n\nOpportunities:\n• B2B SaaS positioning\n• Recurring revenue model\n• Clear target customer segment`;
    }
}
exports.MockAIProvider = MockAIProvider;
