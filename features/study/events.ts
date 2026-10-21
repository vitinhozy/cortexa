import type { AppData, Question, QuestionAttempt, User } from '@/types/domain';
import type { StudyEvent } from '@/types/learning';
import { emptyLearning, conceptCatalog, questionConceptId, synchronizeConcepts } from './concepts';
import { estimateConceptMastery } from './mastery';
import { learningPolicy } from './policy';
import { addDays, localDate } from '@/utils/date';

export function eventContext(
  data: AppData,
  id: string,
  occurredAt: string,
  conceptIds: string[] = [],
  sourceIds: string[] = [],
) {
  return {
    id,
    schemaVersion: 1 as const,
    userId: data.user.id,
    occurredAt,
    academicStage: data.academicJourney?.stage ?? ('UNKNOWN' as const),
    conceptIds,
    sourceIds,
    simulated: data.workspace !== 'personal',
    provenance: 'recorded' as const,
    goal: data.user.goal || undefined,
  };
}
export function appendStudyEvent(data: AppData, event: StudyEvent): AppData {
  const learning = data.learning ?? emptyLearning();
  if (learning.events.some((e) => e.id === event.id)) return data;
  if (event.userId !== data.user.id) throw new Error('O evento não pertence a este espaço.');
  return { ...data, learning: { ...learning, events: [...learning.events, event] } };
}
export function registerActivity(user: User, xp: number, now: Date): User {
  const today = localDate(now);
  return {
    ...user,
    xp: user.xp + xp,
    lastStudyDate: today,
    streak:
      user.lastStudyDate === today
        ? user.streak
        : user.lastStudyDate === addDays(today, -1)
          ? user.streak + 1
          : 1,
  };
}
export function refreshMastery(
  data: AppData,
  before: AppData,
  conceptId: string,
  event: StudyEvent,
  now: Date,
  outcome?: {
    correct: boolean;
    confidence?: QuestionAttempt['confidence'];
    rating?: 'again' | 'hard' | 'good' | 'easy';
  },
): AppData {
  const mastery = estimateConceptMastery(data, conceptId, now);
  const prior = estimateConceptMastery(before, conceptId, now);
  const state = data.practice ?? { sessions: [], mastery: [], reviews: [] };
  const priorReview = state.reviews.find((r) => r.conceptId === conceptId);
  const intervalDays = outcome?.rating
    ? {
        again: 0,
        hard: 1,
        good: Math.min(30, Math.max(3, (priorReview?.intervalDays ?? 1) * 2)),
        easy: Math.min(30, Math.max(7, (priorReview?.intervalDays ?? 1) * 3)),
      }[outcome.rating]
    : !outcome?.correct
      ? 0
      : outcome.confidence !== 'certain'
        ? learningPolicy.review.uncertainDays
        : Math.min(
            learningPolicy.review.maximumDays,
            Math.max(learningPolicy.review.confidentMinDays, (priorReview?.intervalDays ?? 1) * 2),
          );
  const review = {
    conceptId,
    topicId: mastery.topicId,
    intervalDays,
    dueAt: new Date(
      now.getTime() +
        (intervalDays ? intervalDays * 86400000 : learningPolicy.review.retryMinutes * 60000),
    ).toISOString(),
    lastAttemptId: event.type === 'QUESTION_ATTEMPT' ? event.attemptId : event.id,
  };
  const concepts = conceptCatalog(data)
    .filter((c) => c.topicId === mastery.topicId)
    .map((c) => estimateConceptMastery(data, c.id, now))
    .filter((c) => c.exposures);
  const topicValue = Math.round(
    concepts.reduce((sum, c) => sum + c.value * c.exposures, 0) /
      Math.max(
        1,
        concepts.reduce((sum, c) => sum + c.exposures, 0),
      ),
  );
  const previousMetric = before.metrics.find((m) => m.topicId === mastery.topicId);
  const questionEvent = event.type === 'QUESTION_ATTEMPT';
  const learning = data.learning ?? emptyLearning();
  return {
    ...data,
    practice: {
      ...state,
      mastery: [...state.mastery.filter((m) => m.conceptId !== conceptId), mastery],
      reviews: [...state.reviews.filter((r) => r.conceptId !== conceptId), review],
    },
    metrics: [
      ...data.metrics.filter((m) => m.topicId !== mastery.topicId),
      {
        topicId: mastery.topicId,
        mastery: topicValue,
        answered: (previousMetric?.answered ?? 0) + Number(questionEvent),
        correct: (previousMetric?.correct ?? 0) + Number(questionEvent && event.correct),
        lastStudiedAt: localDate(now),
      },
    ],
    learning: {
      ...learning,
      masteryHistory: [
        ...learning.masteryHistory,
        {
          eventId: event.id,
          conceptId,
          before: prior.exposures ? prior.value : null,
          after: mastery.value,
          calculatedAt: now.toISOString(),
          algorithmVersion: learningPolicy.version,
          academicStage: event.academicStage,
        },
      ],
    },
  };
}
export function applyQuestionAttempt(
  data: AppData,
  attempt: QuestionAttempt,
  question: Question,
  now: Date,
): AppData {
  if (data.attempts.some((a) => a.id === attempt.id)) return data;
  const id = questionConceptId(question);
  const frozenQuestion = JSON.parse(JSON.stringify(question)) as Question;
  const before = synchronizeConcepts(data);
  const recorded = {
    ...attempt,
    conceptId: id,
    topicId: question.topicId,
    questionSnapshot: frozenQuestion,
    snapshotOrigin: 'recorded' as const,
    academicStage: attempt.academicStage ?? data.academicJourney?.stage ?? ('UNKNOWN' as const),
  };
  const event: StudyEvent = {
    ...eventContext(data, `attempt:${attempt.id}`, attempt.createdAt, [id], question.sourceIds),
    academicStage: recorded.academicStage,
    type: 'QUESTION_ATTEMPT',
    assessmentContext: attempt.assessmentContext,
    attemptId: attempt.id,
    question: frozenQuestion,
    correct: attempt.correct,
    confidence: attempt.confidence,
    sessionId: attempt.practiceSessionId,
    responseTimeSeconds: attempt.responseTimeSeconds,
  };
  let next = appendStudyEvent(
    {
      ...before,
      attempts: [...data.attempts, recorded],
      user: {
        ...registerActivity(data.user, attempt.correct ? 15 : 5, now),
        answered: data.user.answered + 1,
        correct: data.user.correct + Number(attempt.correct),
      },
    },
    event,
  );
  next = refreshMastery(next, before, id, event, now, attempt);
  if (!attempt.correct)
    next = {
      ...next,
      mistakes: [
        {
          id: `mistake:${attempt.id}`,
          attemptId: attempt.id,
          questionId: question.id,
          topicId: question.topicId,
          conceptId: id,
          conceptName: question.conceptName,
          confidence: attempt.confidence,
          exposures: estimateConceptMastery(next, id, now).exposures,
          createdAt: attempt.createdAt,
          selectedOptionId: attempt.selectedOptionId,
          correctOptionId: question.correctOptionId,
          probableCause: question.probableCause,
          masteryBefore: estimateConceptMastery(before, id, now).exposures
            ? estimateConceptMastery(before, id, now).value
            : undefined,
          masteryAfter: estimateConceptMastery(next, id, now).value,
          academicStage: recorded.academicStage,
        },
        ...next.mistakes,
      ],
    };
  return next;
}
