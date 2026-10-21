export interface AITutorMessage {
  role: 'user' | 'assistant';
  content: string;
}
export interface AITutorRequest {
  question: string;
  history: AITutorMessage[];
  topicName?: string;
  materialTitle?: string;
  materialContent?: string;
}
export interface AITutorResponse {
  answer: string;
  provider: 'gemini';
  model: string;
  promptVersion: string;
}
export interface AITutorTransport {
  send(ownerId: string, request: AITutorRequest, signal?: AbortSignal): Promise<AITutorResponse>;
}
