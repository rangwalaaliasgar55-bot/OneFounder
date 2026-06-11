import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, AIMessage } from './provider'

export class ClaudeProvider implements AIProvider {
  private client: Anthropic
  private model: string

  constructor(
    apiKey: string,
    baseURL?: string,
    model = 'claude-haiku-4-5'
  ) {
    this.model = model
    this.client = new Anthropic({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    })
  }

  async chat(messages: AIMessage[]): Promise<string> {
    const system = messages.find(m => m.role === 'system')?.content
    const userMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: userMessages,
    })

    return (response.content[0] as any)?.text || ''
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: AIMessage[] = []
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
    messages.push({ role: 'user', content: prompt })
    return this.chat(messages)
  }

  async summarize(text: string): Promise<string> {
    return this.generate(
      `Summarize the following text concisely:\n\n${text}`,
      'You are a helpful assistant that creates concise, accurate summaries.'
    )
  }

  async analyze(text: string, instruction: string): Promise<string> {
    return this.generate(
      `${instruction}\n\nText to analyze:\n${text}`,
      'You are an expert business analyst. Provide structured, actionable insights.'
    )
  }

  async research(topic: string): Promise<string> {
    return this.generate(
      `Research and provide comprehensive insights about: ${topic}`,
      'You are a business research expert. Provide data-driven insights, market analysis, and strategic recommendations.'
    )
  }

  async *stream(messages: AIMessage[]): AsyncGenerator<string> {
    const system = messages.find(m => m.role === 'system')?.content
    const userMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: userMessages,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }
}
