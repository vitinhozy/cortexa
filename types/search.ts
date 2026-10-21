export type SearchKind = 'material' | 'topic' | 'question' | 'flashcard' | 'studio';
export interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  detail: string;
  topicId: string;
}
