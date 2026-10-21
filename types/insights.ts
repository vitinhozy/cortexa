import type { KnowledgeMetric, Topic } from './domain';

export interface TopicPerformance {
  topic: Topic;
  metric: KnowledgeMetric;
}

export interface SubjectPerformance {
  answered: number;
  correct: number;
  incorrect: number;
  accuracy: number | null;
  topics: TopicPerformance[];
}

export interface StudyCalendarDay {
  date: string;
  active: boolean;
  inMonth: boolean;
  today: boolean;
}
