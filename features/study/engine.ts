import type { AppData, Flashcard, PlanBlock, ReviewRating } from '@/types/domain';
import { addDays, daysUntil, localDate } from '@/utils/date';
export function masteryLabel(value: number): string {
  return value < 50
    ? 'Precisa revisar'
    : value < 75
      ? 'Em desenvolvimento'
      : value < 90
        ? 'Bom domínio'
        : 'Domínio alto';
}
export function recommendTopics(data: AppData, today = localDate()) {
  return data.topics
    .map((topic) => {
      const metric = data.metrics.find((item) => item.topicId === topic.id)!;
      const errors = data.mistakes.filter((item) => item.topicId === topic.id).length;
      const due = data.flashcards.filter(
        (item) => item.topicId === topic.id && item.dueAt.slice(0, 10) <= today,
      ).length;
      const nearExam = data.exams.some(
        (exam) =>
          exam.topicIds.includes(topic.id) &&
          exam.date >= today &&
          daysUntil(exam.date, today) <= 7,
      );
      const stale = metric.lastStudiedAt
        ? Math.min(10, daysUntil(today, metric.lastStudiedAt.slice(0, 10)))
        : 10;
      const studiedMinutes = data.sessions
        .filter((s) => s.topicId === topic.id && s.startedAt.slice(0, 10) === today)
        .reduce((sum, s) => sum + s.minutes, 0);
      return {
        topic,
        metric,
        score:
          (100 - metric.mastery) * 0.65 +
          Math.min(errors, 5) * 3 +
          Math.min(due, 5) * 2 +
          (nearExam ? 12 : 0) +
          stale -
          Math.min(studiedMinutes, 20) * 0.5,
        reason:
          metric.mastery < 50
            ? 'Seu domínio indica que vale revisar este assunto primeiro.'
            : errors > 0
              ? 'Retome os conceitos que apareceram nos seus erros.'
              : 'Consolide este assunto antes da próxima prova.',
      };
    })
    .sort((a, b) => b.score - a.score);
}
export function scheduleReview(card: Flashcard, rating: ReviewRating, now = new Date()): Flashcard {
  const intervalDays =
    rating === 'again'
      ? 0
      : rating === 'hard'
        ? 1
        : rating === 'good'
          ? Math.max(3, card.intervalDays * 2)
          : Math.max(7, card.intervalDays * 3);
  const dueAt =
    rating === 'again'
      ? new Date(now.getTime() + 10 * 60000).toISOString()
      : `${addDays(localDate(now), intervalDays)}T12:00:00`;
  return { ...card, intervalDays, dueAt };
}
export function generatePlan(
  data: AppData,
  topicIds: string[],
  budget: number,
  examDate: string,
  today = localDate(),
): PlanBlock[] {
  const ranked = recommendTopics(data, today).filter((item) => topicIds.includes(item.topic.id));
  if (!ranked.length || !Number.isFinite(budget) || budget < 5) return [];
  const totalDays = Math.max(1, Math.min(60, daysUntil(examDate, today)));
  const dailyBudget = Math.min(480, Math.floor(budget));
  const blocks: PlanBlock[] = [];
  for (let day = 0; day < totalDays; day++) {
    const selected = ranked.slice(
      0,
      Math.min(ranked.length, Math.max(1, Math.floor(dailyBudget / 15))),
    );
    const weightSum = selected.reduce((sum, item) => sum + item.score, 0);
    let remaining = dailyBudget;
    selected.forEach((item, index) => {
      const minutes =
        index === selected.length - 1
          ? remaining
          : Math.max(1, Math.floor((dailyBudget * item.score) / weightSum));
      remaining -= minutes;
      blocks.push({
        topicId: item.topic.id,
        minutes,
        priority: item.metric.mastery < 75 ? 'Alta' : 'Média',
        day: addDays(today, day),
      });
    });
  }
  return blocks;
}
