import type { AIModel } from '@/types/ai';
/** No vendor IDs or real prices: models for dependency-injection tests only. */
export const syntheticModels: AIModel[] = [
  {
    id: 'test-economical',
    provider: 'test-provider',
    capability: 'economical',
    costTier: 0,
    tasks: [
      'title',
      'classification',
      'summary',
      'question-generation',
      'flashcards',
      'extraction',
    ],
  },
  {
    id: 'test-standard',
    provider: 'test-provider',
    capability: 'standard',
    costTier: 1,
    tasks: ['clinical-case', 'tutoring', 'scientific-research'],
    verifiedRetrieval: true,
  },
  {
    id: 'test-advanced',
    provider: 'test-provider',
    capability: 'advanced',
    costTier: 2,
    tasks: ['complex-reasoning', 'tutoring'],
  },
];
