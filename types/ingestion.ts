export interface SourceLocator {
  page?: number;
  startSeconds?: number;
  endSeconds?: number;
}
export interface IngestedChunk {
  id: string;
  userId: string;
  sourceId: string;
  sourceVersion: string;
  text: string;
  locator: SourceLocator;
  conceptIds: string[];
}
export interface IngestionJob {
  id: string;
  userId: string;
  sourceId: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  error?: string;
}
export interface TranscriptionInput {
  userId: string;
  uri: string;
  mimeType: string;
  language: 'pt-BR';
}
export interface TranscriptSegment {
  startSeconds: number;
  endSeconds: number;
  text: string;
}
export interface TranscriptionDraft {
  text: string;
  segments: TranscriptSegment[];
  sourceUri: string;
  needsReview: true;
}
export interface SpeechToTextProvider {
  transcribe(input: TranscriptionInput): Promise<{ text: string; segments: TranscriptSegment[] }>;
}
