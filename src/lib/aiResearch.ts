export interface ResearchInsight {
  id: string;
  problem: string;
  whyItMatters: string;
  solution: string;
  sourceTitle: string;
  sourceUrl: string;
}

export const researchInsights: ResearchInsight[] = [
  {
    id: 'governance-gap',
    problem: 'Agentic AI adoption is moving faster than governance and oversight.',
    whyItMatters:
      'Organizations are operationalizing AI before control systems mature, which creates audit, safety, and accountability gaps.',
    solution:
      'Maintain an AI system inventory, require role-based approvals for higher-risk changes, and make human review visible instead of assumed.',
    sourceTitle: 'Deloitte State of AI in the Enterprise 2026',
    sourceUrl:
      'https://deloitte.com/us/en/what-we-do/capabilities/applied-artificial-intelligence/content/state-of-ai-in-the-enterprise.html',
  },
  {
    id: 'data-exposure',
    problem: 'Sensitive data exposure is one of the top enterprise AI risks.',
    whyItMatters:
      'Data can leak through prompts, tool calls, and poorly governed AI workflows even when teams think they are only experimenting.',
    solution:
      'Classify automation and AI systems by sensitivity, restrict who can activate risky flows, and document fallback paths before production use.',
    sourceTitle: 'CSA State of AI Security and Governance',
    sourceUrl: 'https://cloudsecurityalliance.org/artifacts/the-state-of-ai-security-and-governance',
  },
  {
    id: 'shadow-ai',
    problem: 'A very large share of enterprise data is going into high-risk AI tools.',
    whyItMatters:
      'Teams move faster than policy, leading to “shadow AI” usage, accidental disclosure, and fragmented trust in outputs.',
    solution:
      'Track tool risk, create approved workflows, export clean board reports, and keep an audit trail of sensitive automation and AI decisions.',
    sourceTitle: 'Cyberhaven 2025 AI Adoption & Risk Report',
    sourceUrl: 'https://www.cyberhaven.com/resources/report/2025-ai-adoption-risk-report',
  },
  {
    id: 'automation-bias',
    problem: 'People often over-trust automated outputs when they look confident or efficient.',
    whyItMatters:
      'Automation bias can quietly shift judgment away from humans, especially in customer-facing or policy-relevant workflows.',
    solution:
      'Keep decision verification logs, store evidence status, and make “needs review” states normal rather than invisible.',
    sourceTitle: 'OECD Governing with Artificial Intelligence',
    sourceUrl:
      'https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/06/governing-with-artificial-intelligence_398fa287/795de142-en.pdf',
  },
];
