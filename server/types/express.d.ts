import 'express'

declare module 'express' {
  interface Request {
    user?: {
      id: string
      name?: string
      email: string
      image?: string
      isAdmin?: boolean
      tokenBalance?: number
      tokenUsed?: number
      onboardingCompleted?: boolean
      ollamaConfigured?: boolean
      selectedModel?: string
      modelVerifiedAt?: string | null
    }
    session?: {
      id: string
      userId: string
      expiresAt: Date
    }
    tokenCheckPassed?: boolean
  }
}
