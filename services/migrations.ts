import type { AppData } from '@/types/domain';
import { emptyJourney } from '@/features/study/academic';
import { synchronizeConcepts } from '@/features/study/concepts';
import { appendStudyEvent, eventContext } from '@/features/study/events';
import { projectKnowledge } from '@/features/study/mastery';

/** Additive, idempotent: seeded aggregate scores never become study evidence. */
export function migrateSnapshot(data: AppData): AppData {
  const attempts = data.attempts.map((attempt) => {
    const question = data.questions.find((q) => q.id === attempt.questionId);
    if (attempt.questionSnapshot || !question) return attempt;
    return {
      ...attempt,
      conceptId: attempt.conceptId ?? question.conceptId ?? question.topicId,
      topicId: attempt.topicId ?? question.topicId,
      academicStage: attempt.academicStage ?? ('UNKNOWN' as const),
      questionSnapshot: JSON.parse(JSON.stringify(question)) as typeof question,
      snapshotOrigin: 'legacy-current-bank' as const,
    };
  });
  let next = synchronizeConcepts({
    ...data,
    attempts,
    academicJourney: data.academicJourney ?? {
      ...emptyJourney(),
      semesterConfirmed: data.workspace !== 'personal' || data.user.onboardingComplete === true,
    },
  });
  for (const attempt of attempts) {
    const question =
      attempt.questionSnapshot ?? data.questions.find((q) => q.id === attempt.questionId);
    if (!question) continue;
    const conceptId = attempt.conceptId ?? question.conceptId ?? question.topicId;
    next = appendStudyEvent(next, {
      ...eventContext(
        data,
        `attempt:${attempt.id}`,
        attempt.createdAt,
        [conceptId],
        question.sourceIds,
      ),
      provenance: 'legacy',
      goal: undefined,
      academicStage: attempt.academicStage ?? 'UNKNOWN',
      type: 'QUESTION_ATTEMPT',
      attemptId: attempt.id,
      question,
      correct: attempt.correct,
      confidence: attempt.confidence,
      sessionId: attempt.practiceSessionId,
      responseTimeSeconds: attempt.responseTimeSeconds,
    });
  }
  for (const review of data.reviews) {
    const card = data.flashcards.find((c) => c.id === review.flashcardId);
    const id = review.conceptId ?? card?.conceptId;
    next = appendStudyEvent(next, {
      ...eventContext(data, `review:${review.id}`, review.createdAt, id ? [id] : []),
      provenance: 'legacy',
      goal: undefined,
      academicStage: review.academicStage ?? 'UNKNOWN',
      type: 'FLASHCARD_REVIEW',
      reviewId: review.id,
      flashcardId: review.flashcardId,
      rating: review.rating,
    });
  }
  for (const session of data.sessions.filter((s) => s.endedAt)) {
    if (data.practice?.sessions.some((s) => s.id === session.id)) continue;
    next = appendStudyEvent(next, {
      ...eventContext(data, `study:${session.id}`, session.endedAt!, [], session.sourceIds),
      provenance: 'legacy',
      goal: undefined,
      academicStage: session.academicStage ?? 'UNKNOWN',
      type: 'DOCUMENT_STUDIED',
      topicId: session.topicId,
      minutes: session.minutes,
      sessionId: session.id,
    });
  }
  return projectKnowledge(next);
}
