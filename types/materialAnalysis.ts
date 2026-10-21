export interface AnalysisMaterial {
  id: string;
  title: string;
  content: string;
  subjectName: string;
  topicName: string;
}
export interface MaterialConcept {
  name: string;
  description: string;
  evidenceQuote: string;
  important: boolean;
  /** Names within this analysis. Proposed pedagogical relationships, subject to review. */
  prerequisites: string[];
}
export interface MaterialAnalysis {
  schemaVersion: 1;
  status: 'analyzed' | 'insufficient';
  discipline: string;
  theme: string;
  topics: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  concepts: MaterialConcept[];
  limitations: string[];
}
export interface MaterialAnalysisRecord {
  id: string;
  userId: string;
  materialId: string;
  contentHash: string;
  model: string;
  provider: string;
  promptVersion: string;
  generatedAt: string;
  reviewedAt?: string;
  analysis: MaterialAnalysis;
}
export interface SavedMaterialAnalysis {
  record: MaterialAnalysisRecord;
  /** Exact local revision; supports stale detection without requiring native crypto. */
  source: AnalysisMaterial;
  conceptIds: string[];
}
export interface MaterialAnalysisTransport {
  analyze(ownerId: string, material: AnalysisMaterial, signal?: AbortSignal): Promise<unknown>;
  review(ownerId: string, recordId: string, signal?: AbortSignal): Promise<unknown>;
}
