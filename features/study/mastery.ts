import type { AppData, Question } from '@/types/domain';
import type { ConceptMastery } from '@/types/practice';
import { conceptCatalog, questionConceptId } from './concepts';
import { learningPolicy } from './policy';

export const questionLevel = (question: Question) =>
  question.level ?? { Fácil: 1, Média: 3, Difícil: 5 }[question.difficulty];
/** Rebuild derived caches after an upgrade; source attempts and events remain intact. */
export function projectKnowledge(data: AppData, now = new Date()): AppData {
  const measured = conceptCatalog(data)
    .map((c) => estimateConceptMastery(data, c.id, now))
    .filter((m) => m.exposures > 0);
  if (!measured.length) return data;
  const state = data.practice ?? { sessions: [], mastery: [], reviews: [] };
  const metrics = data.metrics.map((metric) => {
    const concepts = measured.filter((c) => c.topicId === metric.topicId);
    if (!concepts.length) return metric;
    const attempts = data.attempts.filter(
      (a) =>
        (a.topicId ??
          a.questionSnapshot?.topicId ??
          data.questions.find((q) => q.id === a.questionId)?.topicId) === metric.topicId,
    );
    return {
      ...metric,
      mastery: Math.round(
        concepts.reduce((sum, c) => sum + c.value * c.exposures, 0) /
          concepts.reduce((sum, c) => sum + c.exposures, 0),
      ),
      answered: data.workspace === 'personal' ? attempts.length : metric.answered,
      correct:
        data.workspace === 'personal' ? attempts.filter((a) => a.correct).length : metric.correct,
    };
  });
  return {
    ...data,
    metrics,
    practice: {
      ...state,
      mastery: [
        ...state.mastery.filter(
          (m) => !measured.some((current) => current.conceptId === m.conceptId),
        ),
        ...measured,
      ],
    },
  };
}
export function estimateConceptMastery(
  data: AppData,
  id: string,
  now = new Date(),
): ConceptMastery {
  const questions = new Map(data.questions.map((q) => [q.id, q]));
  const history = data.attempts
    .filter(
      (attempt) =>
        (attempt.conceptId ??
          (questions.get(attempt.questionId) &&
            questionConceptId(questions.get(attempt.questionId)!))) === id,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const reviews = data.reviews.filter(
    (review) =>
      (review.conceptId ??
        data.flashcards.find((card) => card.id === review.flashcardId)?.conceptId) === id,
  );
  const attempts = history.slice(-learningPolicy.mastery.recentAttempts);
  let numerator = 1;
  let denominator = 2;
  let correctStreak = 0;
  let errorStreak = 0;
  for (const attempt of attempts) {
    const age = Math.max(0, (now.getTime() - Date.parse(attempt.createdAt)) / 86400000);
    const question = attempt.questionSnapshot ?? questions.get(attempt.questionId);
    const level = attempt.level ?? (question ? questionLevel(question) : 2);
    const weight = Math.exp(-age / learningPolicy.mastery.recencyDays) * (0.8 + level * 0.12);
    const evidence = attempt.correct
      ? { certain: 1, unsure: 0.7, guess: 0.4 }[attempt.confidence ?? 'unsure']
      : attempt.confidence === 'certain'
        ? 0
        : 0.1;
    numerator += weight * evidence;
    denominator += weight;
    correctStreak = attempt.correct ? correctStreak + 1 : 0;
    errorStreak = attempt.correct ? 0 : errorStreak + 1;
  }
  for (const review of reviews.slice(-learningPolicy.mastery.recentAttempts)) {
    const age = Math.max(0, (now.getTime() - Date.parse(review.createdAt)) / 86400000);
    const weight =
      learningPolicy.mastery.selfReportWeight * Math.exp(-age / learningPolicy.mastery.recencyDays);
    numerator += weight * { again: 0, hard: 0.35, good: 0.75, easy: 0.9 }[review.rating];
    denominator += weight;
  }
  const lastDate = [...attempts.map((a) => a.createdAt), ...reviews.map((r) => r.createdAt)]
    .sort()
    .at(-1);
  const days = lastDate ? Math.max(0, (now.getTime() - Date.parse(lastDate)) / 86400000) : 0;
  const retention = Math.exp(-Math.max(0, days - 3) / learningPolicy.mastery.retentionDays);
  const exposures = history.length + reviews.length;
  const value = exposures
    ? Math.round(
        Math.min(
          100,
          Math.max(
            0,
            (numerator / denominator) * 100 * retention +
              Math.min(5, correctStreak) -
              Math.min(5, errorStreak),
          ),
        ),
      )
    : 0;
  return {
    conceptId: id,
    topicId:
      data.learning?.concepts.find((c) => c.id === id)?.topicId ??
      data.questions.find((q) => questionConceptId(q) === id)?.topicId ??
      history.at(-1)?.topicId ??
      '',
    value,
    exposures,
    objectiveExposures: history.length,
    selfReportedExposures: reviews.length,
    correctStreak,
    errorStreak,
    highConfidenceErrors: attempts.slice(-5).filter((a) => !a.correct && a.confidence === 'certain')
      .length,
    lastReviewedAt: lastDate,
    sufficientEvidence: attempts.length >= learningPolicy.mastery.minimumObjectiveEvidence,
  };
}
