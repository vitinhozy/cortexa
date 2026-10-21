import type { Repository } from './contracts';
import type { ConceptRelationType } from '@/types/learning';
import { conceptCatalog, emptyLearning, synchronizeConcepts } from '@/features/study/concepts';
import { studySources } from '@/features/study/practice';
import { uid } from '@/utils/date';

export function createLearningService(repo: Repository) {
  return {
    async addTopic(
      subjectId: string,
      name: string,
      parentTopicId?: string,
      kind: 'theme' | 'topic' | 'subtopic' = 'topic',
    ) {
      const data = repo.getSnapshot();
      const title = name.trim();
      const subject = data.subjects.find((s) => s.id === subjectId);
      if (
        !subject ||
        !title ||
        title.length > 100 ||
        !['theme', 'topic', 'subtopic'].includes(kind)
      )
        throw new Error('Informe uma disciplina, um nome e um nível válidos.');
      if (
        parentTopicId &&
        !data.topics.some((t) => t.id === parentTopicId && t.subjectId === subjectId)
      )
        throw new Error('O assunto pai precisa pertencer à mesma disciplina.');
      const topic = {
        id: uid('topic'),
        subjectId,
        name: title,
        parentTopicId,
        kind,
        unit: subject.name,
        summary: '',
        keyPoints: [],
      };
      repo.update((current) => ({
        ...current,
        topics: [...current.topics, topic],
        metrics: [...current.metrics, { topicId: topic.id, mastery: 0, answered: 0, correct: 0 }],
      }));
      return topic;
    },
    async addConcept(topicId: string, name: string, sourceIds: string[] = []) {
      const data = repo.getSnapshot();
      const title = name.trim();
      if (!title || title.length > 100 || !data.topics.some((t) => t.id === topicId))
        throw new Error('Informe um conceito e um assunto deste espaço.');
      const sources = studySources(data);
      if (
        sourceIds.some(
          (id) =>
            !sources.some(
              (s) => s.id === id && (!s.topicIds.length || s.topicIds.includes(topicId)),
            ),
        )
      )
        throw new Error('Selecione fontes deste assunto e deste espaço.');
      const previous = conceptCatalog(data).find(
        (c) =>
          c.topicId === topicId &&
          c.name.toLocaleLowerCase('pt-BR') === title.toLocaleLowerCase('pt-BR'),
      );
      if (previous) return previous;
      const concept = {
        id: uid('concept'),
        topicId,
        name: title,
        summary: '',
        sourceIds: [...new Set(sourceIds)],
      };
      repo.update((current) => ({
        ...current,
        learning: {
          ...(current.learning ?? emptyLearning()),
          concepts: [...conceptCatalog(current), concept],
        },
      }));
      return concept;
    },
    async relate(fromId: string, toId: string, type: ConceptRelationType) {
      const data = synchronizeConcepts(repo.getSnapshot());
      const concepts = conceptCatalog(data);
      if (
        fromId === toId ||
        [fromId, toId].some((id) => !concepts.some((c) => c.id === id)) ||
        ![
          'PREREQUISITE_OF',
          'RELATED_TO',
          'PART_OF',
          'CLINICAL_APPLICATION_OF',
          'ASSESSED_BY',
          'RELEVANT_FOR',
        ].includes(type)
      )
        throw new Error('Escolha dois conceitos distintos deste espaço e uma relação válida.');
      const relations = data.learning!.relations;
      const id = `${type}:${fromId}:${toId}`;
      if (relations.some((r) => r.fromId === fromId && r.toId === toId && r.type === type)) return;
      if (type === 'PREREQUISITE_OF' || type === 'PART_OF') {
        const visited = new Set<string>();
        const reaches = (node: string): boolean => {
          if (node === fromId) return true;
          if (visited.has(node)) return false;
          visited.add(node);
          return relations
            .filter((r) => r.fromId === node && r.type === type)
            .some((r) => reaches(r.toId));
        };
        if (reaches(toId))
          throw new Error('Essa relação criaria um ciclo. Revise a ordem dos conceitos.');
      }
      repo.update((current) => ({
        ...current,
        learning: {
          ...(current.learning ?? emptyLearning()),
          relations: [...(current.learning?.relations ?? []), { id, fromId, toId, type }],
        },
      }));
    },
  };
}
