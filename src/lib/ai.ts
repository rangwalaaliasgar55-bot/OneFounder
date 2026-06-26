export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  tokensUsed: number;
}

const MOCK_RESPONSES = [
  "Here's a strategic take based on your current position: focus on the highest-leverage action available to you right now. For most early-stage founders, that means talking to more customers before writing more code. Validate the problem, then validate the solution. What specific area would you like to dig into?",
  "Looking at this from first principles, the key question is: what is the one thing that, if you solved it, would make everything else easier or unnecessary? Identify that bottleneck and attack it directly. Avoid spreading your attention across too many fronts at once.",
  "Based on the data you have, the most impactful next step is to instrument your funnel so you can see exactly where users drop off. You can't optimize what you can't measure. Start with the critical path: signup to activation to retention.",
];

export async function askAI(
  messages: AIMessage[],
  system: string,
): Promise<AIResponse> {
  const provider = import.meta.env.VITE_AI_PROVIDER ?? 'mock';
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const activeProvider =
    provider === 'anthropic' && !anthropicKey
      ? 'mock'
      : provider === 'openai' && !openaiKey
        ? 'mock'
        : provider;

  try {
    if (activeProvider === 'anthropic' && anthropicKey) {
      return await callAnthropic(messages, system, anthropicKey);
    }
    if (activeProvider === 'openai' && openaiKey) {
      return await callOpenAI(messages, system, openaiKey);
    }
  } catch (err) {
    console.error('AI request failed, falling back to mock:', err);
  }

  return mockResponse(messages);
}

async function callAnthropic(
  messages: AIMessage[],
  system: string,
  apiKey: string,
): Promise<AIResponse> {
  const model = import.meta.env.VITE_ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data.content?.map((c: { text: string }) => c.text).join('') ?? '';
  const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
  return { text, tokensUsed };
}

async function callOpenAI(
  messages: AIMessage[],
  system: string,
  apiKey: string,
): Promise<AIResponse> {
  const model = import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  const tokensUsed = data.usage?.total_tokens ?? 0;
  return { text, tokensUsed };
}

async function mockResponse(messages: AIMessage[]): Promise<AIResponse> {
  await new Promise((r) => setTimeout(r, 1000));
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const idx = (lastUserMsg?.content.length ?? 0) % MOCK_RESPONSES.length;
  const text = MOCK_RESPONSES[idx];
  const tokensUsed = Math.ceil((lastUserMsg?.content.length ?? 0) / 4) + 120;
  return { text, tokensUsed };
}
