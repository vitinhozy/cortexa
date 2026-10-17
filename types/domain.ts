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
}
export interface Subject {
  id: string;
  name: string;
  color: string;
}
export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  unit: string;
  summary: string;
  keyPoints: string[];
}
export interface StudyMaterial {
  id: string;
  title: string;
  subjectId: string;
  topicId: string;
  createdAt: string;
  type: 'PDF' | 'Slides' | 'Anotações' | 'Prova' | 'Imagem' | 'Áudio' | 'Link';
  pages: number;
  status: 'ready' | 'processing';
  content?: string;
}
export interface QuestionOption {
  id: string;
  text: string;
  explanation: string;
}
export interface Question {
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
  id: string;
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
  createdAt: string;
}
export interface Flashcard {
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
  id: string;
  flashcardId: string;
  rating: ReviewRating;
  createdAt: string;
  nextDueAt: string;
}
export interface StudySession {
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
}
export interface AIConversation {
  id: string;
  mode: AIMode;
  materialId?: string;
  topicId?: string;
  messages: AIMessage[];
}
export interface Mistake {
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
}
export interface AppData {
  version: 1;
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
