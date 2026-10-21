import type { AppData, Question } from '@/types/domain';
import type { LearningConcept, LearningState } from '@/types/learning';

export const questionConceptId = (question: Question) => question.conceptId ?? question.topicId;
export const emptyLearning = (): LearningState => ({
  schemaVersion: 1,
  concepts: [],
  relations: [],
  events: [],
  masteryHistory: [],
});
export function conceptCatalog(data: AppData): LearningConcept[] {
  const map = new Map((data.learning?.concepts ?? []).map((concept) => [concept.id, concept]));
  for (const question of data.questions) {
    const topic = data.topics.find((item) => item.id === question.topicId);
    if (!topic) continue;
    const id = questionConceptId(question);
    const previous = map.get(id);
    map.set(
      id,
      previous
        ? {
            ...previous,
            sourceIds: [...new Set([...previous.sourceIds, ...(question.sourceIds ?? [])])],
          }
        : {
            id,
            topicId: topic.id,
            name: question.conceptName ?? topic.name,
            summary: topic.summary,
            sourceIds: question.sourceIds ?? [],
          },
    );
  }
  for (const card of data.flashcards) {
    const topic = data.topics.find((t) => t.id === card.topicId);
    const id = card.conceptId;
    if (id && topic && !map.has(id))
      map.set(id, {
        id,
        topicId: topic.id,
        name: topic.name,
        summary: topic.summary,
        sourceIds: card.sourceIds ?? [],
      });
  }
  return [...map.values()];
}
export function synchronizeConcepts(data: AppData): AppData {
  const learning = data.learning ?? emptyLearning();
  const concepts = conceptCatalog(data);
  const relations = [...learning.relations];
  for (const q of data.questions) {
    const id = questionConceptId(q);
    if (
      !q.prerequisiteConceptId ||
      !concepts.some((c) => c.id === q.prerequisiteConceptId) ||
      q.prerequisiteConceptId === id
    )
      continue;
    const relationId = `prerequisite:${q.prerequisiteConceptId}:${id}`;
    if (!relations.some((r) => r.id === relationId))
      relations.push({
        id: relationId,
        fromId: q.prerequisiteConceptId,
        toId: id,
        type: 'PREREQUISITE_OF',
      });
  }
  return { ...data, learning: { ...learning, concepts, relations } };
}
