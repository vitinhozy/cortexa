import type { AppData, Question } from './domain';
import type { AcademicStage } from './academic';
import type { AssessmentContext } from './assessment';
import type { QuestionSpecification } from './learning';

export type Confidence = 'certain' | 'unsure' | 'guess';
export type PracticeMode = 'learn' | 'review' | 'exam' | 'diagnostic';
export type PracticeDifficulty = 'adaptive' | 'Fácil' | 'Média' | 'Difícil';
export type QuestionFormat =
  | 'concept'
  | 'application'
  | 'laboratory'
  | 'clinical'
  | 'progressive'
  | 'differential'
  | 'mechanism'
  | 'pharmacology'
  | 'management'
  | 'integration';
export interface StudySource {
  id: string;
  kind: 'material' | 'studio' | 'chat' | 'flashcard' | 'quiz';
  title: string;
  detail: string;
  topicIds: string[];
  questionIds?: string[];
  content?: string;
  updatedAt: string;
  simulated: boolean;
}
export interface PracticeCitation {
  sourceId?: string;
  title: string;
  page?: number;
  kind: 'material' | 'authored' | 'demo';
}
export interface PracticeConcept {
  id: string;
  topicId: string;
  name: string;
  summary: string;
}
export interface PracticeRecommendation {
  title: string;
  detail: string;
  reason: 'misconception' | 'weak-concept' | 'spaced-review' | 'continue';
  topicIds: string[];
  conceptIds: string[];
  questionCount: number;
}
export interface ConceptMastery {
  objectiveExposures?: number;
  selfReportedExposures?: number;
  conceptId: string;
  topicId: string;
  value: number;
  exposures: number;
  correctStreak: number;
  errorStreak: number;
  highConfidenceErrors: number;
  lastReviewedAt?: string;
  sufficientEvidence: boolean;
}
export interface ConceptReviewSchedule {
  conceptId: string;
  topicId: string;
  dueAt: string;
  intervalDays: number;
  lastAttemptId: string;
}
export interface PracticeConfig {
  assessmentGoalId?: string;
  academicStage?: AcademicStage;
  topicIds: string[];
  conceptIds: string[];
  sourceIds: string[];
  mode: PracticeMode;
  difficulty: PracticeDifficulty;
  count: number;
  interleaved: boolean;
  style: 'mixed' | 'clinical' | 'conceptual';
  timeLimitSeconds?: number;
  preferredQuestionId?: string;
}
export interface PracticeItem {
  elapsedSeconds?: number;
  question: Question;
  selectedOptionId?: string;
  locked?: boolean;
  confidence?: Confidence;
  flagged?: boolean;
  attemptId?: string;
}
export interface PracticeSession {
  assessmentContext?: AssessmentContext;
  academicStage?: AcademicStage;
  specifications?: QuestionSpecification[];
  id: string;
  config: PracticeConfig;
  status: 'active' | 'paused' | 'completed';
  startedAt: string;
  updatedAt: string;
  endedAt?: string;
  deadlineAt?: string;
  elapsedSeconds: number;
  currentIndex: number;
  pool: Question[];
  items: PracticeItem[];
  masteryBefore: Record<string, number>;
  sourceTitles: string[];
}
export interface PracticeState {
  sessions: PracticeSession[];
  mastery: ConceptMastery[];
  reviews: ConceptReviewSchedule[];
}
export interface PracticeAnalysis {
  sources: StudySource[];
  concepts: PracticeConcept[];
  topicIds: string[];
  questions: Question[];
  limitation?: string;
}
/** Replace this adapter with an authenticated, source-grounded generation endpoint. */
export interface PracticeContentProvider {
  analyze(data: AppData, config: PracticeConfig): Promise<PracticeAnalysis>;
}
