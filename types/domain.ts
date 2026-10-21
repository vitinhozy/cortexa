import type { StudioDocument } from './studio';
import type { SavedMaterialAnalysis } from './materialAnalysis';
import type { AcademicJourney, AcademicJourneyInput, AcademicStage } from './academic';
import type { LearningState } from './learning';
import type { AssessmentState, AssessmentContext } from './assessment';
import type { Confidence, PracticeCitation, PracticeState, QuestionFormat } from './practice';

export interface User {
  id: string;
  name: string;
  course: string;
  semester: number;
  university: string;
  goal: string;
  xp: number;
  streak: number;
  minutes: number;
  answered: number;
  correct: number;
  weeklyMinutes: number;
  weeklyGoal: number;
  lastStudyDate?: string;
  dailyMinutes?: number;
  subjectIds?: string[];
  onboardingComplete?: boolean;
}
export interface Subject {
  id: string;
  name: string;
  color: string;
}
export interface Topic {
  parentTopicId?: string;
  kind?: 'theme' | 'topic' | 'subtopic';
  id: string;
  subjectId: string;
  name: string;
  unit: string;
  summary: string;
  keyPoints: string[];
}
export interface StudyMaterial {
  analysis?: SavedMaterialAnalysis;
  id: string;
  title: string;
  subjectId: string;
  topicId: string;
  createdAt: string;
  type: 'PDF' | 'Slides' | 'Anotações' | 'Prova' | 'Imagem' | 'Áudio' | 'Link';
  pages: number;
  status: 'ready' | 'processing';
  content?: string;
  folderId?: string;
  favorite?: boolean;
  lastOpenedAt?: string;
}
export interface MaterialFolder {
  id: string;
  name: string;
  /** Optional for folders created by older local app versions. */
  color?: string;
}
export type WorkspaceMode = 'demo' | 'personal';
export interface AcademicProfile {
  name: string;
  course: string;
  semester: number;
  university: string;
  goal: string;
  dailyMinutes: number;
  subjectIds: string[];
  journey?: AcademicJourneyInput;
}
export interface QuestionOption {
  id: string;
  text: string;
  explanation: string;
}
export interface Question {
  revision?: number;
  caseGroupId?: string;
  caseStep?: number;
  conceptId?: string;
  conceptName?: string;
  level?: 1 | 2 | 3 | 4 | 5;
  format?: QuestionFormat;
  sourceIds?: string[];
  citations?: PracticeCitation[];
  prerequisiteConceptId?: string;
  authored?: boolean;
  id: string;
  topicId: string;
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: 'Fácil' | 'Média' | 'Difícil';
  source: string;
  probableCause: string;
}
export interface QuestionAttempt {
  snapshotOrigin?: 'recorded' | 'legacy-current-bank';
  assessmentContext?: AssessmentContext;
  academicStage?: AcademicStage;
  responseTimeSeconds?: number;
  questionSnapshot?: Question;
  practiceSessionId?: string;
  conceptId?: string;
  topicId?: string;
  confidence?: Confidence;
  difficulty?: Question['difficulty'];
  level?: number;
  id: string;
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
  createdAt: string;
}
export interface Flashcard {
  conceptId?: string;
  sourceIds?: string[];
  id: string;
  topicId: string;
  front: string;
  back: string;
  dueAt: string;
  intervalDays: number;
  sourceQuestionId?: string;
}
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export interface FlashcardReview {
  conceptId?: string;
  academicStage?: AcademicStage;
  id: string;
  flashcardId: string;
  rating: ReviewRating;
  createdAt: string;
  nextDueAt: string;
}
export interface StudySession {
  academicStage?: AcademicStage;
  sourceIds?: string[];
  id: string;
  topicId: string;
  startedAt: string;
  endedAt?: string;
  minutes: number;
}
export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  date: string;
  topicIds: string[];
}
export interface PlanBlock {
  topicId: string;
  minutes: number;
  priority: 'Alta' | 'Média';
  day: string;
}
export interface StudyPlan {
  id: string;
  title: string;
  examDate: string;
  dailyMinutes: number;
  blocks: PlanBlock[];
}
export interface KnowledgeMetric {
  topicId: string;
  mastery: number;
  answered: number;
  correct: number;
  lastStudiedAt?: string;
}
export type AIMode = 'class' | 'medicine';
export interface SourceCitation {
  id: string;
  title: string;
  page?: number;
  simulated: boolean;
}
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: SourceCitation[];
  provider?: string;
  model?: string;
  promptVersion?: string;
  simulated?: boolean;
}
export interface AIConversation {
  id: string;
  mode: AIMode;
  materialId?: string;
  topicId?: string;
  messages: AIMessage[];
}
export interface Mistake {
  masteryBefore?: number;
  masteryAfter?: number;
  academicStage?: AcademicStage;
  conceptId?: string;
  conceptName?: string;
  confidence?: Confidence;
  exposures?: number;
  id: string;
  attemptId: string;
  questionId: string;
  topicId: string;
  createdAt: string;
  selectedOptionId: string;
  correctOptionId: string;
  probableCause: string;
}
export interface Preferences {
  notifications: boolean;
  dailyReminder: boolean;
  reduceMotion?: boolean;
  haptics?: boolean;
  reminderTime?: string;
}
export interface AppData {
  assessments?: AssessmentState;
  academicJourney?: AcademicJourney;
  learning?: LearningState;
  practice?: PracticeState;
  studio?: StudioDocument[];
  version: 1;
  workspace?: WorkspaceMode;
  folders?: MaterialFolder[];
  user: User;
  topics: Topic[];
  subjects: Subject[];
  materials: StudyMaterial[];
  questions: Question[];
  attempts: QuestionAttempt[];
  flashcards: Flashcard[];
  reviews: FlashcardReview[];
  sessions: StudySession[];
  exams: Exam[];
  plans: StudyPlan[];
  metrics: KnowledgeMetric[];
  conversations: AIConversation[];
  mistakes: Mistake[];
  preferences: Preferences;
}
