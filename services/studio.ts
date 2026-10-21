import type { Repository } from './contracts';
import type { StudioDraft } from '@/types/studio';
import { studyBlocks, validStudioKind } from '@/features/study/studio';
import { localDate, uid } from '@/utils/date';
import { normalizePracticeText, studySources } from '@/features/study/practice';
import { synchronizeConcepts } from '@/features/study/concepts';

export function createStudioService(repo: Repository) {
  return {
    async save(draft: StudioDraft) {
      const snapshot = repo.getSnapshot();
      const title = draft.title.trim();
      const body = draft.body.trim();
      if (!validStudioKind(draft.kind)) throw new Error('Escolha um formato de estudo válido.');
      if (!title || title.length > 100 || !body || body.length > 12000)
        throw new Error(
          'Informe um título de até 100 caracteres e um conteúdo de até 12.000 caracteres.',
        );
      if (draft.kind !== 'transcript' && studyBlocks(body).length > 24)
        throw new Error('Use no máximo 24 blocos por documento.');
      if (draft.materialId && !snapshot.materials.some((item) => item.id === draft.materialId))
        throw new Error('O material de origem não está neste espaço.');
      const existing = snapshot.studio?.find((item) => item.id === draft.id);
      if (draft.id && !existing) throw new Error('Documento não encontrado neste espaço.');
      if (existing && existing.kind !== draft.kind)
        throw new Error('O formato de um documento salvo não pode ser alterado.');
      const now = new Date().toISOString();
      const item = {
        id: existing?.id ?? uid('studio'),
        kind: draft.kind,
        title,
        body,
        materialId: draft.materialId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      repo.update((data) => ({
        ...data,
        studio: [...(data.studio ?? []).filter((document) => document.id !== item.id), item],
      }));
      return item;
    },
    async remove(id: string) {
      repo.update((data) => ({
        ...data,
        studio: (data.studio ?? []).filter((item) => item.id !== id),
      }));
    },
    async addFlashcard(
      topicId: string,
      front: string,
      back: string,
      id?: string,
      context?: { conceptId?: string; sourceIds?: string[] },
    ) {
      if (!repo.getSnapshot().topics.some((item) => item.id === topicId))
        throw new Error('Selecione um assunto da sua biblioteca.');
      if (!front.trim() || !back.trim() || front.trim().length > 500 || back.trim().length > 3000)
        throw new Error('Informe uma pergunta de até 500 caracteres e uma resposta de até 3.000.');
      if (id && !repo.getSnapshot().flashcards.some((item) => item.id === id))
        throw new Error('Flashcard não encontrado neste espaço.');
      const card = {
        id: id ?? uid('card'),
        topicId,
        conceptId: context?.conceptId ?? topicId,
        sourceIds: context?.sourceIds ?? [],
        front: front.trim(),
        back: back.trim(),
        dueAt: localDate(),
        intervalDays: 0,
      };
      const snapshot = repo.getSnapshot();
      if (
        context?.conceptId &&
        !snapshot.learning?.concepts.some(
          (c) => c.id === context.conceptId && c.topicId === topicId,
        )
      )
        throw new Error('Escolha um conceito deste assunto.');
      if (
        context?.sourceIds?.some(
          (id) =>
            !studySources(snapshot).some(
              (s) => s.id === id && (!s.topicIds.length || s.topicIds.includes(topicId)),
            ),
        )
      )
        throw new Error('Escolha fontes deste assunto.');
      repo.update((data) =>
        synchronizeConcepts({
          ...data,
          flashcards: [...data.flashcards.filter((item) => item.id !== card.id), card],
        }),
      );
      return card;
    },
    async addQuestion(
      topicId: string,
      prompt: string,
      options: string[],
      correctIndex: number,
      explanation: string,
      id?: string,
      context?: {
        conceptId?: string;
        sourceIds?: string[];
        conceptName?: string;
        difficulty?: 'Fácil' | 'Média' | 'Difícil';
      },
    ) {
      if (!repo.getSnapshot().topics.some((item) => item.id === topicId))
        throw new Error('Selecione um assunto da sua biblioteca.');
      if (
        !prompt.trim() ||
        prompt.trim().length > 1000 ||
        options.length !== 4 ||
        options.some((text) => !text.trim() || text.trim().length > 300) ||
        !Number.isInteger(correctIndex) ||
        correctIndex < 0 ||
        correctIndex > 3 ||
        !explanation.trim() ||
        explanation.trim().length > 3000
      )
        throw new Error(
          'Preencha a questão, quatro alternativas, a resposta correta e a explicação dentro dos limites.',
        );
      if (new Set(options.map((text) => text.trim().toLocaleLowerCase('pt-BR'))).size !== 4)
        throw new Error('Escreva quatro alternativas diferentes.');
      if (id && !repo.getSnapshot().questions.some((item) => item.id === id && item.authored))
        throw new Error('Questão manual não encontrada neste espaço.');
      const snapshot = repo.getSnapshot();
      const existing = snapshot.questions.find((q) => q.id === id);
      const selectedConcept = context?.conceptId
        ? snapshot.learning?.concepts.find(
            (c) => c.id === context.conceptId && c.topicId === topicId,
          )
        : undefined;
      if (context?.conceptId && !selectedConcept)
        throw new Error('Escolha um conceito deste assunto.');
      const sourceIds = [...new Set(context?.sourceIds ?? [])];
      const sources = studySources(snapshot).filter((source) => sourceIds.includes(source.id));
      if (
        sources.length !== sourceIds.length ||
        sources.some((source) => source.topicIds.length && !source.topicIds.includes(topicId))
      )
        throw new Error('Escolha fontes disponíveis e vinculadas ao assunto.');
      const conceptName = context?.conceptName?.trim();
      if (conceptName && conceptName.length > 100)
        throw new Error('Use até 100 caracteres para o conceito.');
      const question = {
        id: id ?? uid('question'),
        revision: (existing?.revision ?? 0) + 1,
        authored: true,
        topicId,
        prompt: prompt.trim(),
        options: options.map((text, index) => ({
          id: 'ABCD'[index],
          text: text.trim(),
          explanation:
            index === correctIndex
              ? explanation.trim()
              : 'Compare esta alternativa com a explicação que você cadastrou.',
        })),
        correctOptionId: 'ABCD'[correctIndex],
        explanation: explanation.trim(),
        difficulty: context?.difficulty ?? ('Média' as const),
        conceptId:
          selectedConcept?.id ??
          (existing?.topicId === topicId ? existing.conceptId : undefined) ??
          (conceptName ? `${topicId}:${normalizePracticeText(conceptName)}` : topicId),
        conceptName: conceptName || snapshot.topics.find((topic) => topic.id === topicId)?.name,
        format: 'concept' as const,
        sourceIds,
        citations: sources.length
          ? sources.map((source) => ({
              sourceId: source.id,
              title: source.title,
              kind: source.simulated ? ('demo' as const) : ('material' as const),
            }))
          : undefined,
        source: 'Questão criada por você · sem revisão por IA',
        probableCause: 'Revise a explicação e compare as alternativas da sua questão.',
      };
      repo.update((data) =>
        synchronizeConcepts({
          ...data,
          questions: [...data.questions.filter((item) => item.id !== question.id), question],
        }),
      );
      return question;
    },
  };
}
