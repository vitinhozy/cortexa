export type StudioKind = 'transcript' | 'mindmap' | 'slides';
export interface StudioDocument {
  id: string;
  kind: StudioKind;
  title: string;
  body: string;
  materialId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface StudioDraft {
  id?: string;
  kind: StudioKind;
  title: string;
  body: string;
  materialId?: string;
}
export interface StudyBlock {
  title: string;
  lines: string[];
}
