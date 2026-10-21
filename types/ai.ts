export type AITask =
  | 'classification'
  | 'title'
  | 'extraction'
  | 'summary'
  | 'question-generation'
  | 'flashcards'
  | 'tutoring'
  | 'clinical-case'
  | 'complex-reasoning'
  | 'scientific-research'
  | 'image-analysis';
export type AICapability = 'economical' | 'standard' | 'advanced' | 'multimodal';
export type AIPreference = 'automatic' | 'fast' | 'study' | 'advanced';
export interface AIRoute {
  capability: AICapability;
  provider: string;
  model?: string;
}
export interface AIRouter {
  route(task: AITask, preference?: AIPreference): AIRoute;
}
export interface AIModel {
  id: string;
  provider: string;
  capability: AICapability;
  costTier: 0 | 1 | 2;
  tasks: AITask[];
  verifiedRetrieval?: boolean;
}
export interface AIRequest {
  systemInstruction?: string;
  responseSchema?: Record<string, unknown>;
  id: string;
  userId: string;
  feature: string;
  sessionId?: string;
  task: AITask;
  preference: AIPreference;
  input: string;
  maxOutputTokens: number;
}
export interface AIResponse {
  output: unknown;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  estimatedCost?: number;
}
export interface AIProvider {
  id: string;
  execute(request: AIRequest, model: AIModel, signal?: AbortSignal): Promise<AIResponse>;
}
export interface AIUsage {
  requestId: string;
  userId: string;
  feature: string;
  sessionId?: string;
  task: AITask;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  estimatedCost?: number;
  latencyMs: number;
  timestamp: string;
  status: 'completed' | 'failed';
}
export interface AIExecutionPolicy {
  validateResponse?: (response: AIResponse) => void;
  authorize(request: AIRequest, model: AIModel): Promise<boolean>;
  recordUsage(usage: AIUsage): Promise<void>;
  now?: () => number;
}
