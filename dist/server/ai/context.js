"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assembleFounderContext = assembleFounderContext;
exports.buildSystemPromptWithContext = buildSystemPromptWithContext;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function assembleFounderContext(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [profile, allIdeas, allProjects, allTasks, allLeads, allContent, allFinance, memories, recentActivity, recentInsights, journey,] = await Promise.all([
        db_1.db.select().from(schema_1.founderProfiles).where((0, drizzle_orm_1.eq)(schema_1.founderProfiles.userId, userId)).limit(1),
        db_1.db.select().from(schema_1.businessIdeas).where((0, drizzle_orm_1.eq)(schema_1.businessIdeas.userId, userId)).orderBy((0, drizzle_orm_1.desc)(schema_1.businessIdeas.updatedAt)).limit(10),
        db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.userId, userId)).orderBy((0, drizzle_orm_1.desc)(schema_1.projects.updatedAt)).limit(10),
        db_1.db.select().from(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)).orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.updatedAt)).limit(20),
        db_1.db.select().from(schema_1.leads).where((0, drizzle_orm_1.eq)(schema_1.leads.userId, userId)).orderBy((0, drizzle_orm_1.desc)(schema_1.leads.updatedAt)).limit(10),
        db_1.db.select().from(schema_1.contentPieces).where((0, drizzle_orm_1.eq)(schema_1.contentPieces.userId, userId)).orderBy((0, drizzle_orm_1.desc)(schema_1.contentPieces.updatedAt)).limit(10),
        db_1.db.select().from(schema_1.financeEntries).where((0, drizzle_orm_1.eq)(schema_1.financeEntries.userId, userId)).orderBy((0, drizzle_orm_1.desc)(schema_1.financeEntries.date)).limit(20),
        db_1.db.select().from(schema_1.aiMemories)
            .where((0, drizzle_orm_1.eq)(schema_1.aiMemories.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.aiMemories.importance))
            .limit(15),
        db_1.db.select().from(schema_1.userActivityLog)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userActivityLog.userId, userId), (0, drizzle_orm_1.gte)(schema_1.userActivityLog.createdAt, sevenDaysAgo)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.userActivityLog.createdAt))
            .limit(30),
        db_1.db.select().from(schema_1.aiInsights)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.aiInsights.userId, userId), (0, drizzle_orm_1.eq)(schema_1.aiInsights.dismissed, false)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.aiInsights.createdAt))
            .limit(5),
        db_1.db.select().from(schema_1.journeyMilestones)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.journeyMilestones.userId, userId), (0, drizzle_orm_1.eq)(schema_1.journeyMilestones.completed, true)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.journeyMilestones.completedAt))
            .limit(5),
    ]);
    const p = profile[0];
    const pendingTasks = allTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    const doneTasks = allTasks.filter(t => t.status === 'done');
    const activeLeads = allLeads.filter(l => !['won', 'lost'].includes(l.status ?? ''));
    const wonLeads = allLeads.filter(l => l.status === 'won');
    const mrr = allFinance.filter(f => f.type === 'subscription' && f.recurring).reduce((s, f) => s + f.amount, 0);
    const totalRevenue = allFinance.filter(f => f.type === 'revenue').reduce((s, f) => s + f.amount, 0);
    const totalExpenses = allFinance.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0);
    const activeIdeas = allIdeas.filter(i => i.status === 'building' || i.status === 'validated');
    const activeProjects = allProjects.filter(p => p.status === 'active');
    const publishedContent = allContent.filter(c => c.status === 'published');
    const profileSection = p
        ? `Founder Stage: ${p.stage} | Industry: ${p.industry || 'not set'} | Primary Goal: ${p.primaryGoal} | Risk Tolerance: ${p.riskTolerance} | Work Style: ${p.workStyle}${p.bio ? ` | Bio: ${p.bio}` : ''}`
        : 'Founder profile not yet set up';
    const businessSnapshot = [
        `MRR: $${mrr} | Revenue: $${totalRevenue} | Expenses: $${totalExpenses} | Profit: $${totalRevenue - totalExpenses}`,
        `Ideas: ${allIdeas.length} total (${activeIdeas.length} active) | Projects: ${allProjects.length} (${activeProjects.length} active)`,
        `Tasks: ${pendingTasks.length} pending, ${doneTasks.length} done`,
        `Leads: ${allLeads.length} total (${activeLeads.length} active, ${wonLeads.length} won)`,
        `Content: ${allContent.length} pieces (${publishedContent.length} published)`,
        activeIdeas.length > 0 ? `Active ideas: ${activeIdeas.map(i => i.title).join(', ')}` : '',
        activeProjects.length > 0 ? `Active projects: ${activeProjects.map(p => p.name).join(', ')}` : '',
    ].filter(Boolean).join('\n');
    const memoriesSection = memories.length > 0
        ? memories.map(m => `[${m.type.toUpperCase()}] ${m.content}`).join('\n')
        : 'No memories stored yet';
    const urgentItems = [
        ...pendingTasks.filter(t => t.priority === 'high').slice(0, 3).map(t => `HIGH PRIORITY TASK: ${t.title}`),
        ...allLeads.filter(l => l.status === 'proposal' || l.status === 'negotiation').slice(0, 3).map(l => `LEAD NEEDS ATTENTION: ${l.name} (${l.status})`),
        ...activeProjects.filter(p => p.dueDate && new Date(p.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).slice(0, 2).map(p => `PROJECT DUE SOON: ${p.name}`),
    ].join('\n') || 'No urgent items flagged';
    const activitySummary = recentActivity.length > 0
        ? (() => {
            const grouped = {};
            recentActivity.forEach(a => { grouped[a.action] = (grouped[a.action] || 0) + 1; });
            return Object.entries(grouped).map(([k, v]) => `${k}: ${v}x`).join(', ');
        })()
        : 'No activity logged this week';
    const financialContext = mrr > 0
        ? `Recurring revenue of $${mrr}/mo. Total tracked revenue: $${totalRevenue}. ${wonLeads.length} paying customers.`
        : totalRevenue > 0
            ? `$${totalRevenue} in one-time revenue tracked. No recurring subscriptions yet. Focus on converting leads to MRR.`
            : 'Pre-revenue stage. Focus is on getting first paying customer.';
    return {
        profile: p || null,
        goals: p?.primaryGoal || 'grow the business',
        stage: p?.stage || 'idea',
        industry: p?.industry || 'general',
        recentActivity: activitySummary,
        businessSnapshot,
        memories: memoriesSection,
        patterns: activitySummary,
        urgentItems,
        financialContext,
    };
}
function buildSystemPromptWithContext(basePrompt, context) {
    return `${basePrompt}

=== FOUNDER CONTEXT (use this to personalize every response) ===
${context.profile ? context.profile.bio || '' : ''}
Stage: ${context.stage} | Industry: ${context.industry} | Goal: ${context.goals}

BUSINESS SNAPSHOT:
${context.businessSnapshot}

FINANCIAL CONTEXT:
${context.financialContext}

URGENT ITEMS:
${context.urgentItems}

PERSISTENT MEMORIES ABOUT THIS FOUNDER:
${context.memories}

RECENT ACTIVITY THIS WEEK:
${context.recentActivity}
=== END CONTEXT ===

Always reference this context to give specific, personalized advice rather than generic responses.
Never say "I don't know your situation" — you have their full context above.`;
}
