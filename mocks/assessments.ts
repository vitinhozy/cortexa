import type { AssessmentFramework } from '@/types/assessment';
/** Synthetic test configuration. Not an official exam or regulatory interpretation. */
export function syntheticAssessment(version = 'test-1'): AssessmentFramework {
  const source = {
    title: 'Documento fictício para testes',
    url: 'https://example.org/synthetic-assessment',
    documentId: 'synthetic-test-only',
    publishedAt: '2000-01-01',
    kind: 'personal' as const,
  };
  return {
    id: 'synthetic-assessment',
    title: 'Avaliação fictícia para testes',
    version,
    regulation: {
      id: 'synthetic-rule',
      version,
      source,
      status: 'REGULATED',
      effectiveFrom: '2000-01-01',
      courseEntryFrom: '2002-06-15',
    },
    stages: [{ id: 'test-stage', title: 'Etapa fictícia', academicYear: 2 }],
    competencies: [
      {
        id: 'test-competency',
        name: 'Competência fictícia',
        domain: 'Domínio de teste',
        conceptIds: ['acid-compensation'],
      },
    ],
    blueprint: {
      version,
      source,
      entries: [{ stageId: 'test-stage', competencyId: 'test-competency', weight: 1 }],
    },
  };
}
