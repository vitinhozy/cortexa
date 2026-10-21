import type { StudyBlock, StudioDocument } from '@/types/studio';

// Estrutura apenas o texto informado; não infere nem gera conteúdo com IA.
export function studyBlocks(body: string): StudyBlock[] {
  return body
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((section) => {
      const [title, ...lines] = section
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      return { title, lines: lines.map((line) => line.replace(/^[-•]\s*/, '')) };
    });
}
export function validStudioKind(value: unknown): value is 'transcript' | 'mindmap' | 'slides' {
  return value === 'transcript' || value === 'mindmap' || value === 'slides';
}
export function validStoredDocument(value: unknown): value is StudioDocument {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StudioDocument>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    validStudioKind(item.kind) &&
    typeof item.title === 'string' &&
    item.title.trim().length > 0 &&
    item.title.length <= 100 &&
    typeof item.body === 'string' &&
    item.body.trim().length > 0 &&
    item.body.length <= 12000 &&
    (item.kind === 'transcript' || studyBlocks(item.body).length <= 24) &&
    typeof item.createdAt === 'string' &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    typeof item.updatedAt === 'string' &&
    Number.isFinite(Date.parse(item.updatedAt)) &&
    (item.materialId === undefined || typeof item.materialId === 'string')
  );
}
