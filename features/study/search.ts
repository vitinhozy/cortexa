import type { AppData } from '@/types/domain';
import type { SearchKind, SearchResult } from '@/types/search';

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}
export function searchStudy(data: AppData, query: string, kind?: SearchKind): SearchResult[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const topicName = (id: string) => data.topics.find((item) => item.id === id)?.name ?? '';
  const subjectName = (id: string) => data.subjects.find((item) => item.id === id)?.name ?? '';
  const entries: (SearchResult & { body: string })[] = [
    ...(data.studio ?? []).map((item) => ({
      id: item.id,
      kind: 'studio' as const,
      title: item.title,
      detail:
        item.kind === 'mindmap' ? 'Mapa mental' : item.kind === 'slides' ? 'Slides' : 'Transcrição',
      topicId: '',
      body: item.body,
    })),
    ...data.materials.map((item) => ({
      id: item.id,
      kind: 'material' as const,
      title: item.title,
      detail: subjectName(item.subjectId),
      topicId: item.topicId,
      body: `${item.content ?? ''} ${topicName(item.topicId)}`,
    })),
    ...data.topics.map((item) => ({
      id: item.id,
      kind: 'topic' as const,
      title: item.name,
      detail: subjectName(item.subjectId),
      topicId: item.id,
      body: item.summary,
    })),
    ...data.questions.map((item) => ({
      id: item.id,
      kind: 'question' as const,
      title: item.prompt,
      detail: topicName(item.topicId),
      topicId: item.topicId,
      body: '',
    })),
    ...data.flashcards.map((item) => ({
      id: item.id,
      kind: 'flashcard' as const,
      title: item.front,
      detail: topicName(item.topicId),
      topicId: item.topicId,
      body: item.back,
    })),
  ];
  return entries
    .filter(
      (item) =>
        (!kind || kind === item.kind) &&
        words.every((word) =>
          normalizeSearch(`${item.title} ${item.detail} ${item.body}`).includes(word),
        ),
    )
    .sort(
      (a, b) =>
        Number(normalizeSearch(b.title).includes(normalizeSearch(query))) -
        Number(normalizeSearch(a.title).includes(normalizeSearch(query))),
    )
    .slice(0, 40)
    .map(({ body: _body, ...item }) => item);
}
