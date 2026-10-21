import type { AcademicStage } from './academic';
import type { AssessmentContext } from './assessment';
import type { Question, ReviewRating } from './domain';
import type { Confidence, QuestionFormat } from './practice';

export interface LearningConcept {
  id: string;
  topicId: string;
  name: string;
  summary: string;
  sourceIds: string[];
}
export type ConceptRelationType =
  | 'PREREQUISITE_OF'
  | 'RELATED_TO'
  | 'PART_OF'
  | 'CLINICAL_APPLICATION_OF'
  | 'ASSESSED_BY'
  | 'RELEVANT_FOR';
export interface ConceptRelation {
  id: string;
  fromId: string;
  toId: string;
  type: ConceptRelationType;
}
interface EventContext {
  assessmentContext?: AssessmentContext;
  id: string;
  schemaVersion: 1;
  userId: string;
  occurredAt: string;
  academicStage: AcademicStage;
  conceptIds: string[];
  sourceIds: string[];
  simulated: boolean;
  provenance: 'recorded' | 'legacy';
  sessionId?: string;
  goal?: string;
}
export type StudyEvent = EventContext &
  (
    | {
        type: 'QUESTION_ATTEMPT';
        attemptId: string;
        question: Question;
        correct: boolean;
        confidence?: Confidence;
        responseTimeSeconds?: number;
      }
    | { type: 'FLASHCARD_REVIEW'; reviewId: string; flashcardId: string; rating: ReviewRating }
    | { type: 'DOCUMENT_STUDIED'; topicId: string; minutes: number }
    | { type: 'CHAT_CONCEPT_DISCUSSION'; conversationId: string }
    | { type: 'SIMULATION_COMPLETED'; answered: number; total: number }
    | { type: 'MATERIAL_ANALYSIS_REVIEWED'; generationId: string }
  );
export interface MasteryHistory {
  eventId: string;
  conceptId: string;
  before: number | null;
  after: number;
  calculatedAt: string;
  algorithmVersion: string;
  academicStage: AcademicStage;
}
export interface LearningState {
  schemaVersion: 1;
  concepts: LearningConcept[];
  relations: ConceptRelation[];
  events: StudyEvent[];
  masteryHistory: MasteryHistory[];
}
export interface QuestionSpecification {
  assessmentContext?: AssessmentContext;
  conceptId: string;
  topicId: string;
  academicStage: AcademicStage;
  difficulty: number;
  formats: QuestionFormat[];
  learningObjective: string;
  goal?: string;
  sourceIds: string[];
  priority: number;
  policyVersion: string;
}
export interface QuestionGenerator {
  generate(specification: QuestionSpecification): Promise<unknown>;
}
export interface QuestionQualityValidator {
  evaluate(
    question: Question,
    specification: QuestionSpecification,
  ): Promise<{ approved: boolean; issues: string[] }>;
}
export interface LearningRecommendation {
  topicId: string;
  conceptId?: string;
  reason: 'misconception' | 'prerequisite' | 'due' | 'weak' | 'assessment' | 'current' | 'continue';
  explanation: string;
  minutes: number;
  score: number;
}
