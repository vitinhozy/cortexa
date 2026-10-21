import type {
  AIConversation,
  AIMessage,
  AIMode,
  AppData,
  Flashcard,
  KnowledgeMetric,
  Question,
  QuestionAttempt,
  ReviewRating,
  StudyMaterial,
  StudyPlan,
} from '@/types/domain';
export interface MaterialService {
  list(): Promise<StudyMaterial[]>;
  addNote(
    title: string,
    content: string,
    context?: { subjectId: string; topicName: string; folderId?: string },
  ): Promise<StudyMaterial>;
}
export interface QuestionService {
  list(topicId?: string): Promise<Question[]>;
  answer(questionId: string, selectedOptionId: string, attemptId: string): Promise<QuestionAttempt>;
}
export interface FlashcardService {
  list(topicId?: string): Promise<Flashcard[]>;
  fromQuestion(questionId: string): Promise<Flashcard>;
  review(id: string, rating: ReviewRating, operationId?: string): Promise<void>;
}
export interface KnowledgeService {
  list(): Promise<KnowledgeMetric[]>;
}
export interface StudyService {
  finish(topicId: string, startedAt: string, sourceIds?: string[]): Promise<void>;
  plan(topicIds: string[], minutes: number, examDate: string): Promise<StudyPlan>;
}
export interface AIService {
  send(input: {
    conversationId: string;
    text: string;
    mode: AIMode;
    materialId?: string;
    topicId?: string;
  }): Promise<AIMessage>;
  conversation(id: string): AIConversation | undefined;
}
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export interface Repository {
  getSnapshot(): AppData;
  subscribe(listener: () => void): () => void;
  update(transform: (data: AppData) => AppData): void;
}
// Future server-side contracts. Provider secrets and actual retrieval never live in the app.
export type { AITask, AIRouter } from '@/types/ai';
export interface RetrievedChunk {
  id: string;
  materialId: string;
  text: string;
  page?: number;
  score: number;
}
export interface RetrievalService {
  retrieve(query: string, userId: string, materialIds: string[]): Promise<RetrievedChunk[]>;
}
export interface IngestionService {
  enqueue(materialId: string): Promise<{
    jobId: string;
    stage: 'upload' | 'extraction' | 'chunks' | 'embeddings' | 'indexed';
  }>;
}
