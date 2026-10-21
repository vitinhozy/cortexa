import type { AppData } from '@/types/domain';
import type { LearningRecommendation } from '@/types/learning';
import { emptyJourney } from './academic';
import { conceptCatalog } from './concepts';
import { estimateConceptMastery } from './mastery';
import { learningPolicy, stagePolicies } from './policy';
import { localDate, daysUntil } from '@/utils/date';

export function learnerModel(data: AppData, now = new Date()) {
  const journey = data.academicJourney ?? emptyJourney();
  const events = data.learning?.events ?? [];
  const concepts = conceptCatalog(data).map((concept) => {
    const mastery = estimateConceptMastery(data, concept.id, now);
    const related = events.filter(
      (e) => e.type !== 'MATERIAL_ANALYSIS_REVIEWED' && e.conceptIds.includes(concept.id),
    );
    return {
      ...concept,
      mastery,
      exposureCount: related.length,
      lastExposureAt: related.at(-1)?.occurredAt,
      review: data.practice?.reviews.find((r) => r.conceptId === concept.id),
      mistakes: data.mistakes.filter(
        (m) =>
          (m.conceptId ?? data.questions.find((q) => q.id === m.questionId)?.conceptId) ===
          concept.id,
      ),
      history: data.learning?.masteryHistory.filter((h) => h.conceptId === concept.id) ?? [],
    };
  });
  return {
    userId: data.user.id,
    simulated: data.workspace !== 'personal',
    journey,
    academic: {
      stage: journey.stage,
      semester: journey.semesterConfirmed ? data.user.semester : undefined,
      course: data.user.course,
      university: data.user.university || undefined,
      subjectIds: data.user.subjectIds ?? [],
      dailyMinutes: data.user.dailyMinutes ?? 30,
      goal: data.user.goal || undefined,
    },
    concepts,
    recentEvents: [...events]
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id))
      .slice(0, 30),
    pedagogy: stagePolicies[journey.stage],
  };
}
export function studyRecommendations(data: AppData, now = new Date()): LearningRecommendation[] {
  const model = learnerModel(data, now);
  const today = localDate(now);
  return model.concepts
    .map((concept) => {
      const mastery = concept.mastery;
      const due = concept.review && Date.parse(concept.review.dueAt) <= now.getTime();
      const prerequisite = data.learning?.relations
        .filter((r) => r.type === 'PREREQUISITE_OF' && r.toId === concept.id)
        .map((r) => model.concepts.find((c) => c.id === r.fromId))
        .find((c) => c && c.mastery.exposures > 0 && c.mastery.value < learningPolicy.mastery.weak);
      const exam = data.exams.some(
        (e) =>
          e.topicIds.includes(concept.topicId) && e.date >= today && daysUntil(e.date, today) <= 14,
      );
      const current =
        model.journey.currentTopicIds.includes(concept.topicId) ||
        data.user.subjectIds?.some((id) =>
          data.topics.some((t) => t.id === concept.topicId && t.subjectId === id),
        );
      const reason: LearningRecommendation['reason'] = mastery.highConfidenceErrors
        ? 'misconception'
        : prerequisite
          ? 'prerequisite'
          : due
            ? 'due'
            : mastery.exposures && mastery.value < learningPolicy.mastery.weak
              ? 'weak'
              : exam
                ? 'assessment'
                : current
                  ? 'current'
                  : 'continue';
      const explanations: Record<LearningRecommendation['reason'], string> = {
        misconception:
          'Você teve um erro com alta confiança. Compare o mecanismo e teste outra situação.',
        prerequisite: `Antes de avançar, vale retomar ${prerequisite?.name ?? 'o pré-requisito'}.`,
        due: 'O intervalo programado deste conceito chegou. Faça uma nova recuperação.',
        weak: 'A evidência recente indica que este conceito merece outra tentativa.',
        assessment: 'Este conceito pertence aos assuntos de uma avaliação que se aproxima.',
        current: 'Este conceito faz parte do que você informou estar estudando.',
        continue: mastery.exposures
          ? 'Continue em uma situação diferente, com profundidade adequada à sua etapa.'
          : 'Comece por uma prática para construir evidência; ainda não há domínio avaliado.',
      };
      const selected = prerequisite ?? concept;
      const score =
        (mastery.exposures ? 100 - mastery.value : 20) +
        mastery.highConfidenceErrors * 60 +
        (due ? 90 : 0) +
        (prerequisite ? 80 : 0) +
        (exam ? 35 : 0) +
        (current ? 20 : 0);
      return {
        topicId: selected.topicId,
        conceptId: selected.id,
        reason,
        explanation: explanations[reason],
        minutes: Math.min(data.user.dailyMinutes ?? 30, 12),
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId))
    .filter(
      (item, index, all) => all.findIndex((other) => other.conceptId === item.conceptId) === index,
    );
}
/** Only relevant structured facts, never the full chat/material history. */
export function learnerContext(data: AppData, query: string, topicId?: string) {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  const words = normalize(query)
    .split(/\W+/)
    .filter((w) => w.length > 3);
  const model = learnerModel(data);
  const concepts = model.concepts
    .filter(
      (c) =>
        c.topicId === topicId ||
        words.some((w) =>
          normalize(
            `${c.name} ${data.topics.find((t) => t.id === c.topicId)?.name ?? ''}`,
          ).includes(w),
        ),
    )
    .slice(0, 3);
  return {
    academicStage: model.academic.stage,
    learningObjective: model.pedagogy.objective,
    goal: model.academic.goal,
    concepts: concepts.map((c) => ({
      id: c.id,
      name: c.name,
      mastery: c.mastery.exposures ? c.mastery.value : null,
      objectiveAttempts: c.mastery.objectiveExposures,
      highConfidenceErrors: c.mastery.highConfidenceErrors,
      lastReviewedAt: c.mastery.lastReviewedAt,
      sourceIds: c.sourceIds.slice(0, 3),
    })),
  };
}
