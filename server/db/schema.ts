import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'editor', 'viewer'])
export const ideaStatusEnum = pgEnum('idea_status', ['draft', 'validated', 'building', 'launched'])
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'cancelled'])
export const leadStatusEnum = pgEnum('lead_status', ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])
export const contentTypeEnum = pgEnum('content_type', ['blog', 'landing_page', 'linkedin', 'twitter', 'newsletter', 'email', 'ad_copy', 'product_description'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const businessIdeas = pgTable('business_ideas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type'),
  status: ideaStatusEnum('status').default('draft'),
  competition: text('competition'),
  revenuePotential: text('revenue_potential'),
  marketSize: text('market_size'),
  difficulty: text('difficulty'),
  roadmap: jsonb('roadmap'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const researchReports = pgTable('research_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ideaId: uuid('idea_id').references(() => businessIdeas.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  niche: text('niche'),
  competitors: jsonb('competitors'),
  swot: jsonb('swot'),
  trends: jsonb('trends'),
  opportunities: jsonb('opportunities'),
  keywords: jsonb('keywords'),
  risks: jsonb('risks'),
  fullReport: text('full_report'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const businessPlans = pgTable('business_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ideaId: uuid('idea_id').references(() => businessIdeas.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  businessModel: text('business_model'),
  pricing: jsonb('pricing'),
  customerProfile: text('customer_profile'),
  acquisitionStrategy: text('acquisition_strategy'),
  launchStrategy: text('launch_strategy'),
  growthStrategy: text('growth_strategy'),
  financialProjections: jsonb('financial_projections'),
  fullPlan: text('full_plan'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ideaId: uuid('idea_id').references(() => businessIdeas.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('active'),
  color: text('color').default('#6366f1'),
  emoji: text('emoji').default('🚀'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  milestoneId: uuid('milestone_id').references(() => milestones.id, { onDelete: 'set null' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('todo'),
  priority: text('priority').default('medium'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const contentPieces = pgTable('content_pieces', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: contentTypeEnum('type').default('blog'),
  content: text('content'),
  prompt: text('prompt'),
  status: text('status').default('draft'),
  tags: jsonb('tags'),
  metadata: jsonb('metadata'),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  company: text('company'),
  phone: text('phone'),
  status: leadStatusEnum('status').default('lead'),
  source: text('source'),
  notes: text('notes'),
  value: integer('value'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  model: text('model'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const knowledgeBase = pgTable('knowledge_base', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  type: text('type').default('note'),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
