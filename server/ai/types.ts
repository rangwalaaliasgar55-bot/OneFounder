/**
 * OneFounder AI Provider System - Type Definitions
 * 
 * Unified interface for all AI providers (Ollama, OpenAI, Anthropic, etc.)
 */

// ─── Message Types ────────────────────────────────────────────────────────────

export type AIRole = 'system' | 'user' | 'assistant'

export interface AIMessage {
  role: AIRole
  content: string
}

// ─── Model Types ──────────────────────────────────────────────────────────────

export interface AIModel {
  id: string
  name: string
  size: number          // bytes
  family: string        // e.g., 'qwen2', 'llama', 'mistral'
  parameters: string    // e.g., '3.1B', '8B', '14B'
  quantization: string  // e.g., 'Q4_K_M'
  contextLength: number // max context window
  capabilities: string[] // e.g., ['completion', 'tools', 'insert']
  provider: string      // e.g., 'ollama', 'openai'
}

// ─── Provider Types ───────────────────────────────────────────────────────────

export type ProviderType = 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'lmstudio' | 'openrouter' | 'termux'

export interface ProviderStatus {
  name: string
  type: ProviderType
  available: boolean
  baseUrl: string
  models: AIModel[]
  defaultModel: string | null
  latencyMs: number | null
  error: string | null
  lastChecked: Date
}

// ─── Chat Options ─────────────────────────────────────────────────────────────

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
  onToken?: (token: string) => void
}

// ─── Stream Types ─────────────────────────────────────────────────────────────

export type StreamChunkType = 'token' | 'done' | 'error' | 'mode'

export interface StreamChunk {
  type: StreamChunkType
  data: string
  model?: string
  mode?: string
  modeLabel?: string
  sessionId?: string
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ChatResponse {
  content: string
  model: string
  totalDuration: number    // ms
  evalCount: number        // tokens generated
  evalDuration: number     // ms spent generating
  promptEvalCount: number  // tokens in prompt
}

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface AIProvider {
  /** Unique name for this provider */
  readonly name: string
  
  /** Provider type identifier */
  readonly type: ProviderType
  
  /** Base URL for the provider API */
  readonly baseUrl: string
  
  /** Check if the provider is available and responding */
  isAvailable(): Promise<boolean>
  
  /** List all available models */
  listModels(): Promise<AIModel[]>
  
  /** Non-streaming chat completion */
  chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse>
  
  /** Streaming chat completion - yields tokens as they arrive */
  stream(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk>
  
  /** Simple text generation (convenience method) */
  generate(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string>
  
  /** Get provider status */
  getStatus(): Promise<ProviderStatus>
}

// ─── Error Types ──────────────────────────────────────────────────────────────

export class AIOfflineError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: string = 'PROVIDER_OFFLINE'
  ) {
    super(message)
    this.name = 'AIOfflineError'
  }
}

export class AIQuotaExceededError extends Error {
  constructor(
    message: string,
    public readonly provider: string
  ) {
    super(message)
    this.name = 'AIQuotaExceededError'
  }
}

export class AITimeoutError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly timeoutMs: number
  ) {
    super(message)
    this.name = 'AITimeoutError'
  }
}

// ─── Configuration Types ──────────────────────────────────────────────────────

export interface ProviderConfig {
  type: ProviderType
  baseUrl: string
  apiKey?: string
  defaultModel?: string
  timeout?: number
  maxRetries?: number
}

export interface AIConfig {
  providers: ProviderConfig[]
  defaultProvider: ProviderType
  defaultModel: string
}
