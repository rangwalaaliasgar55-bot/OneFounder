/**
 * Zod validation schemas for every API route.
 * Import and apply via validate(schema) middleware.
 */
import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────────────────────────
const uuid = z.string().uuid()
const optionalString = z.string().optional()
const optionalNumber = z.number().optional()

// ── Auth ─────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
})

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
})

// ── Chat ─────────────────────────────────────────────────────────────────────
export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: uuid.optional(),
  model: optionalString,
  agentType: optionalString,
})

export const ChatStreamSchema = ChatMessageSchema

// ── AI ───────────────────────────────────────────────────────────────────────
export const AIChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().max(8000),
  })).min(1).max(50),
})

export const AIGenerateSchema = z.object({
  prompt: z.string().min(1).max(8000),
  systemPrompt: z.string().max(8000).optional(),
})

export const AIResearchSchema = z.object({
  topic: z.string().min(1).max(300),
})

// ── Expert ───────────────────────────────────────────────────────────────────
export const ExpertChatSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: uuid.optional(),
  mode: z.string().optional(),
})

export const ExpertCodeReviewSchema = z.object({
  code: z.string().min(1).max(20000),
})

// ── Agents ───────────────────────────────────────────────────────────────────
export const AgentRunSchema = z.object({
  query: z.string().min(1).max(4000),
  agents: z.array(z.string()).min(1).max(5).optional(),
  stream: z.boolean().optional(),
})

export const AgentSingleSchema = z.object({
  query: z.string().min(1).max(4000),
  agents: z.array(z.string()).min(1).max(5).optional(),
})

// ── Admin ────────────────────────────────────────────────────────────────────
export const AdminTokenGrantSchema = z.object({
  amount: z.number().int().min(1).max(10000),
  note: z.string().max(500).optional(),
})

export const AdminTokenSetSchema = z.object({
  balance: z.number().int().min(0).max(100000),
})

// ── Content ──────────────────────────────────────────────────────────────────
export const ContentCreateSchema = z.object({
  type: z.string().min(1).max(50),
  topic: z.string().min(1).max(500),
  tone: z.string().max(50).optional(),
  audience: z.string().max(200).optional(),
  keywords: z.string().max(500).optional(),
})

export const ContentUpdateSchema = z.object({
  title: optionalString,
  content: optionalString,
  type: optionalString,
  status: optionalString,
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const ContentRepurposeSchema = z.object({
  sourceContent: z.string().min(1).max(20000),
  sourceTopic: z.string().max(500).optional(),
  sourceType: z.string().max(50).optional(),
  platforms: z.array(z.string()).min(1).max(10),
  tone: z.string().max(50).optional(),
  audience: z.string().max(200).optional(),
})

// ── Finance ──────────────────────────────────────────────────────────────────
export const FinanceEntrySchema = z.object({
  type: z.enum(['income', 'expense', 'investment']),
  amount: z.number().positive().max(10_000_000),
  description: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  recurring: z.boolean().optional(),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  date: z.string().optional(),
  currency: z.string().max(10).optional(),
})

// ── Founder Profile ──────────────────────────────────────────────────────────
export const FounderProfileSchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  workStyle: z.enum(['builder', 'marketer', 'operator']).optional(),
  primaryGoal: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  industry: z.string().max(200).optional(),
  stage: z.enum(['idea', 'mvp', 'launched', 'growing', 'scaling']).optional(),
})

// ── Ideas ────────────────────────────────────────────────────────────────────
export const IdeaGenerateSchema = z.object({
  skills: z.string().max(500).optional(),
  interests: z.string().max(500).optional(),
  budget: z.string().max(100).optional(),
  availableTime: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  experience: z.string().max(500).optional(),
})

export const IdeaUpdateSchema = z.object({
  title: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  type: optionalString,
  status: optionalString,
  competition: optionalString,
  revenuePotential: optionalString,
  marketSize: optionalString,
  difficulty: optionalString,
  roadmap: optionalString,
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ── Intelligence ─────────────────────────────────────────────────────────────
export const IntelligenceCreateSchema = z.object({
  type: z.string().min(1).max(50),
  content: z.string().min(1).max(10000),
  source: z.string().max(500).optional(),
  importance: z.number().int().min(1).max(10).optional(),
  tags: z.string().max(500).optional(),
})

export const IntelligenceTrackSchema = z.object({
  action: z.string().min(1).max(100),
  module: z.string().min(1).max(100),
  entityId: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ── Journey ──────────────────────────────────────────────────────────────────
export const JourneyUpdateSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
})

// ── Knowledge ────────────────────────────────────────────────────────────────
export const KnowledgeCreateSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
  type: z.string().max(50).optional(),
  tags: z.string().max(500).optional(),
})

export const KnowledgeUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).max(50000).optional(),
  type: optionalString,
  tags: optionalString,
})

// ── Leads ────────────────────────────────────────────────────────────────────
export const LeadCreateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(255).optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  value: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const LeadUpdateSchema = LeadCreateSchema.partial()

// ── Memory ───────────────────────────────────────────────────────────────────
export const MemoryCreateSchema = z.object({
  type: z.string().max(50).optional(),
  content: z.string().min(1).max(10000),
  importance: z.number().int().min(1).max(10).optional(),
  tags: z.string().max(500).optional(),
})

// ── Ollama ───────────────────────────────────────────────────────────────────
export const OllamaModelSchema = z.object({
  model: z.string().min(1).max(200),
})

// ── Plans ────────────────────────────────────────────────────────────────────
export const PlanCreateSchema = z.object({
  title: z.string().min(1).max(300),
  businessType: z.string().max(200).optional(),
  targetMarket: z.string().max(500).optional(),
  uniqueValue: z.string().max(1000).optional(),
  ideaId: uuid.optional(),
})

// ── Projects ─────────────────────────────────────────────────────────────────
export const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(20).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const ProjectUpdateSchema = ProjectCreateSchema.partial()

export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(20).optional(),
  assignee: z.string().max(200).optional(),
  dueDate: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const TaskUpdateSchema = TaskCreateSchema.partial()

// ── SEO ──────────────────────────────────────────────────────────────────────
export const SEOAnalyzeSchema = z.object({
  url: z.string().url().max(2000).optional(),
  content: z.string().max(20000).optional(),
  keywords: z.string().max(500).optional(),
})

export const SEOKeywordSchema = z.object({
  topic: z.string().min(1).max(500),
  count: z.number().int().min(1).max(50).optional(),
})

// ── Social ───────────────────────────────────────────────────────────────────
export const SocialPostSchema = z.object({
  platform: z.string().min(1).max(50),
  content: z.string().min(1).max(10000),
  scheduledAt: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const SocialGenerateSchema = z.object({
  topic: z.string().min(1).max(500),
  platform: z.string().min(1).max(50),
  tone: z.string().max(50).optional(),
})

// ── Research ─────────────────────────────────────────────────────────────────
export const ResearchSchema = z.object({
  topic: z.string().min(1).max(500),
  depth: z.enum(['quick', 'standard', 'deep']).optional(),
})

// ── CEO ──────────────────────────────────────────────────────────────────────
export const CEOAnalysisSchema = z.object({
  businessContext: z.string().min(1).max(5000),
  currentGoals: z.string().max(2000).optional(),
})

// ── WordPress ────────────────────────────────────────────────────────────────
export const WordPressConnectSchema = z.object({
  url: z.string().url().max(500),
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
})

// ── Params ───────────────────────────────────────────────────────────────────
export const IdParamSchema = z.object({
  id: uuid,
})

export const SessionIdParamSchema = z.object({
  sessionId: uuid,
})
