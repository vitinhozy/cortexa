import type { AppData } from '@/types/domain';
import { isDue } from './engine';
import { learnerModel } from './learner';

// Contexto mínimo para recomendações. Textos de materiais e conversas são carregados
// apenas sob demanda pelo futuro serviço remoto, nunca por telemetria.
export function studentContext(data: AppData, now = new Date()) {
  const learner = learnerModel(data, now);
  const measured = data.metrics.filter(
    (m) =>
      m.answered > 0 ||
      data.reviews.some((r) =>
        data.flashcards.some((f) => f.id === r.flashcardId && f.topicId === m.topicId),
      ),
  );
  return {
    mode: data.workspace ?? 'demo',
    academic: learner.academic,
    academicJourney: learner.journey,
    dueFlashcardIds: data.flashcards
      .filter((card) => isDue(card.dueAt, now))
      .map((card) => card.id),
    weakTopicIds: measured.filter((m) => m.mastery < 50).map((m) => m.topicId),
    mistakeIds: data.mistakes.map((mistake) => mistake.id),
    materialIds: data.materials.map((material) => material.id),
    exams: data.exams,
  };
}
