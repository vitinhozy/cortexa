import type { Repository } from './contracts';
import type { AssessmentGoal, AssessmentState } from '@/types/assessment';
import { validAssessmentFramework, validAssessments } from '@/features/study/assessments';
import { uid } from '@/utils/date';
const empty = (): AssessmentState => ({ schemaVersion: 1, frameworks: [], goals: [] });
export function createAssessmentService(repo: Repository) {
  return {
    async importFramework(input: unknown) {
      if (!validAssessmentFramework(input))
        throw new Error(
          'Matriz inválida. Informe fonte, documento, versão, etapas e competências consistentes.',
        );
      const state = repo.getSnapshot().assessments ?? empty();
      const previous = state.frameworks.find(
        (f) => f.id === input.id && f.version === input.version,
      );
      if (previous) {
        if (JSON.stringify(previous) !== JSON.stringify(input))
          throw new Error(
            'Uma versão publicada não pode ser sobrescrita. Cadastre uma nova versão.',
          );
        return;
      }
      const frozen = JSON.parse(JSON.stringify(input)) as typeof input;
      repo.update((data) => ({
        ...data,
        assessments: {
          ...(data.assessments ?? empty()),
          frameworks: [...(data.assessments?.frameworks ?? []), frozen],
        },
      }));
    },
    async addGoal(input: Omit<AssessmentGoal, 'id'>) {
      const goal = { ...input, id: uid('assessment-goal') };
      repo.update((data) => {
        const state = data.assessments ?? empty();
        const next = { ...state, goals: [...state.goals, goal] };
        if (!validAssessments(next))
          throw new Error('Escolha uma versão e uma etapa cadastradas, com data válida.');
        return { ...data, assessments: next };
      });
      return goal;
    },
  };
}
