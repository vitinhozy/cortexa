import type { AppData } from '@/types/domain';
import type { SubjectPerformance, TopicPerformance } from '@/types/insights';

export function subjectPerformance(data: AppData, subjectId: string): SubjectPerformance {
  const metrics = new Map(data.metrics.map((metric) => [metric.topicId, metric]));
  const topics = data.topics
    .filter((topic) => topic.subjectId === subjectId)
    .map((topic) => {
      const source = metrics.get(topic.id);
      const answered = Math.max(0, source?.answered ?? 0);
      return {
        topic,
        metric: {
          topicId: topic.id,
          mastery: source?.mastery ?? 0,
          answered,
          correct: Math.max(0, Math.min(answered, source?.correct ?? 0)),
        },
      };
    });
  const answered = topics.reduce((sum, item) => sum + item.metric.answered, 0);
  const correct = topics.reduce((sum, item) => sum + item.metric.correct, 0);
  return {
    answered,
    correct,
    incorrect: answered - correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : null,
    topics,
  };
}

export function topicsToReview(data: AppData): TopicPerformance[] {
  const topics = new Map(data.topics.map((topic) => [topic.id, topic]));
  return data.metrics
    .filter((metric) => metric.answered > 0 && metric.mastery < 75 && topics.has(metric.topicId))
    .map((metric) => ({ topic: topics.get(metric.topicId)!, metric }))
    .sort((a, b) => a.metric.mastery - b.metric.mastery);
}
