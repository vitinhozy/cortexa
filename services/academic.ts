import type { AcademicJourneyInput } from '@/types/academic';
import type { Repository } from './contracts';
import { updateJourney } from '@/features/study/academic';
import { uid } from '@/utils/date';
export function createAcademicService(repo: Repository) {
  return {
    async save(input: AcademicJourneyInput) {
      const now = new Date().toISOString();
      repo.update((data) => ({
        ...data,
        academicJourney: updateJourney(data, input, now, uid('stage')),
      }));
    },
  };
}
