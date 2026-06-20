/**
 * OpenAPI 3.0 specification for OneFounder API.
 * Auto-serves at /api/docs via swagger-ui-express.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'OneFounder Supreme API',
    description: 'The AI Operating System for Founders — complete API for building, managing, and growing your startup.',
    version: '4.0.0',
    contact: { name: 'OneFounder', url: 'https://onefoundr.app' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: 'https://onefoundr.app', description: 'Production' },
    { url: 'http://localhost:3001', description: 'Local Development' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Session cookie (Better Auth)',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for programmatic access',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          version: { type: 'string', example: '4.0.0' },
          uptime: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ChatMessage: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1, maxLength: 4000 },
          sessionId: { type: 'string', format: 'uuid' },
          model: { type: 'string' },
          agentType: { type: 'string', enum: ['founder', 'code', 'seo', 'security', 'data', 'research', 'finance', 'product', 'startup', 'marketing', 'sales', 'devops', 'legal', 'social', 'content', 'hiring', 'design'] },
        },
      },
      ChatResponse: {
        type: 'object',
        properties: {
          message: { type: 'object' },
          sessionId: { type: 'string' },
          mode: { type: 'string' },
          modeLabel: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          secondaryModes: { type: 'array', items: { type: 'string' } },
          contextSources: { type: 'array', items: { type: 'string' } },
          webSearchUsed: { type: 'boolean' },
        },
      },
      Idea: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          competition: { type: 'string' },
          revenuePotential: { type: 'string' },
          marketSize: { type: 'string' },
          difficulty: { type: 'string' },
        },
      },
      Lead: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string' },
          company: { type: 'string' },
          phone: { type: 'string' },
          status: { type: 'string' },
          source: { type: 'string' },
          value: { type: 'number' },
        },
      },
      FinanceEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['income', 'expense', 'investment'] },
          amount: { type: 'number' },
          description: { type: 'string' },
          category: { type: 'string' },
          currency: { type: 'string' },
        },
      },
      GrowthProgress: {
        type: 'object',
        properties: {
          xp: { type: 'number' },
          level: { type: 'number' },
          title: { type: 'string' },
          streak: { type: 'number' },
          achievements: { type: 'array', items: { type: 'string' } },
          nextLevelXP: { type: 'number' },
          progress: { type: 'number' },
        },
      },
      Memory: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          content: { type: 'string' },
          importance: { type: 'number' },
          tags: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns server health status, version, and uptime.',
        responses: {
          200: { description: 'Healthy', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
        },
      },
    },
    '/api/ready': {
      get: {
        tags: ['System'],
        summary: 'Readiness check',
        description: 'Checks DB and Ollama connectivity. Returns 503 if degraded.',
        responses: {
          200: { description: 'Ready' },
          503: { description: 'Degraded' },
        },
      },
    },
    '/api/chat/send': {
      post: {
        tags: ['AI Chat'],
        summary: 'Send message to AI',
        description: 'Send a message to the OneFounder AI brain. Auto-routes to the best expert mode.',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatMessage' } } },
        },
        responses: {
          200: { description: 'AI response', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatResponse' } } } },
          401: { description: 'Unauthorized' },
          429: { description: 'Rate limited or out of tokens' },
        },
      },
    },
    '/api/chat/stream': {
      post: {
        tags: ['AI Chat'],
        summary: 'Stream AI response',
        description: 'Server-sent events stream for real-time AI responses.',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatMessage' } } },
        },
        responses: {
          200: { description: 'SSE stream', content: { 'text/event-stream': {} } },
        },
      },
    },
    '/api/ideas': {
      get: {
        tags: ['Ideas'],
        summary: 'List ideas',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of ideas' } },
      },
    },
    '/api/ideas/generate': {
      post: {
        tags: ['Ideas'],
        summary: 'Generate business ideas with AI',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  skills: { type: 'string' },
                  interests: { type: 'string' },
                  budget: { type: 'string' },
                  availableTime: { type: 'string' },
                  location: { type: 'string' },
                  experience: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Generated ideas' } },
      },
    },
    '/api/leads': {
      get: {
        tags: ['CRM'],
        summary: 'List leads',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of leads' } },
      },
      post: {
        tags: ['CRM'],
        summary: 'Create lead',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, email: { type: 'string' }, company: { type: 'string' }, phone: { type: 'string' }, status: { type: 'string' }, source: { type: 'string' }, value: { type: 'number' } } } } },
        },
        responses: { 200: { description: 'Created lead' } },
      },
    },
    '/api/finance': {
      get: {
        tags: ['Finance'],
        summary: 'List finance entries',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of entries' } },
      },
      post: {
        tags: ['Finance'],
        summary: 'Create finance entry',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FinanceEntry' } } },
        },
        responses: { 200: { description: 'Created entry' } },
      },
    },
    '/api/memory': {
      get: {
        tags: ['Memory'],
        summary: 'List AI memories',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of memories' } },
      },
    },
    '/api/memory/stats': {
      get: {
        tags: ['Memory'],
        summary: 'Memory statistics',
        description: 'Returns memory count by category, average importance, stale count.',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Memory stats' } },
      },
    },
    '/api/growth/progress': {
      get: {
        tags: ['Growth'],
        summary: 'Founder progress',
        description: 'Returns XP, level, streak, achievements, and next unlock targets.',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Progress data', content: { 'application/json': { schema: { $ref: '#/components/schemas/GrowthProgress' } } } } },
      },
    },
    '/api/growth/leaderboard': {
      get: {
        tags: ['Growth'],
        summary: 'Leaderboard',
        description: 'Top 20 founders ranked by XP.',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Leaderboard' } },
      },
    },
    '/api/growth/achievements': {
      get: {
        tags: ['Growth'],
        summary: 'All achievements',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Achievement list' } },
      },
    },
    '/api/api-keys': {
      get: {
        tags: ['API Platform'],
        summary: 'List API keys',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of keys' } },
      },
      post: {
        tags: ['API Platform'],
        summary: 'Generate API key',
        description: 'Creates a new API key. Key is shown only once.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } }, rateLimit: { type: 'number' }, expiresInDays: { type: 'number' } } } } },
        },
        responses: { 200: { description: 'Created key (shown once)' } },
      },
    },
    '/api/agents/execute': {
      post: {
        tags: ['Multi-Agent'],
        summary: 'Execute multi-agent task',
        description: 'Runs multiple specialist agents in parallel and synthesizes results.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['query'], properties: { query: { type: 'string' }, agents: { type: 'array', items: { type: 'string' } } } } } },
        },
        responses: { 200: { description: 'Agent results' } },
      },
    },
  },
  tags: [
    { name: 'System', description: 'Health and readiness endpoints' },
    { name: 'AI Chat', description: 'Chat with OneFounder AI brain' },
    { name: 'Multi-Agent', description: 'Multi-agent parallel execution' },
    { name: 'Ideas', description: 'Idea generation and management' },
    { name: 'CRM', description: 'Lead and customer management' },
    { name: 'Finance', description: 'Revenue, expenses, and financial tracking' },
    { name: 'Memory', description: 'AI memory system' },
    { name: 'Growth', description: 'XP, levels, achievements, streaks' },
    { name: 'API Platform', description: 'API key management' },
  ],
}
