import type { AcademicStage } from '@/types/academic';
import type { QuestionFormat } from '@/types/practice';
export const learningPolicy = {
  version: 'cortexa-learning-1',
  mastery: {
    recentAttempts: 30,
    recencyDays: 45,
    retentionDays: 180,
    minimumObjectiveEvidence: 3,
    weak: 70,
    review: 75,
    selfReportWeight: 0.25,
  },
  review: { retryMinutes: 10, uncertainDays: 1, confidentMinDays: 3, maximumDays: 30 },
};
export const stagePolicies: Record<
  AcademicStage,
  { formats: QuestionFormat[]; objective: string; startingLevel: number }
> = {
  UNKNOWN: {
    formats: ['concept', 'application', 'mechanism', 'clinical'],
    objective: 'Reconhecer e aplicar o conceito, ajustando a profundidade ao desempenho.',
    startingLevel: 2,
  },
  FOUNDATIONS: {
    formats: ['concept', 'mechanism', 'application'],
    objective: 'Explicar os fundamentos e o mecanismo antes de avançar para aplicações.',
    startingLevel: 1,
  },
  CLINICAL: {
    formats: ['clinical', 'laboratory', 'differential', 'application'],
    objective: 'Relacionar sinais e informações de exames ao diagnóstico diferencial.',
    startingLevel: 3,
  },
  INTERNSHIP: {
    formats: ['management', 'progressive', 'clinical', 'integration'],
    objective: 'Priorizar informações e justificar decisões em situações clínicas fictícias.',
    startingLevel: 4,
  },
  RESIDENCY_PREP: {
    formats: ['integration', 'differential', 'clinical', 'laboratory'],
    objective: 'Resolver situações de avaliação com precisão e revisar a estratégia de resposta.',
    startingLevel: 3,
  },
  RESIDENCY: {
    formats: ['integration', 'management', 'progressive', 'differential'],
    objective: 'Integrar conceitos e justificar decisões complexas no contexto da especialidade.',
    startingLevel: 5,
  },
};
