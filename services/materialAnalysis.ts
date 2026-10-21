import type { Repository } from './contracts';
import type { AppData } from '@/types/domain';
import type {
  AnalysisMaterial,
  MaterialAnalysisRecord,
  MaterialAnalysisTransport,
} from '@/types/materialAnalysis';
import {
  normalizeConcept,
  parseAnalysisMaterial,
  parseAnalysisRecord,
} from '@/features/study/materialAnalysisSchema';
import { emptyLearning } from '@/features/study/concepts';
import { appendStudyEvent, eventContext } from '@/features/study/events';
import { AIError } from './aiErrors';

export function analysisSource(data: AppData, materialId: string): AnalysisMaterial {
  const material = data.materials.find((m) => m.id === materialId);
  if (!material?.content || material.type !== 'Anotações') throw new AIError('invalid_input');
  return parseAnalysisMaterial({
    id: material.id,
    title: material.title,
    content: material.content,
    subjectName: data.subjects.find((s) => s.id === material.subjectId)?.name,
    topicName: data.topics.find((t) => t.id === material.topicId)?.name,
  });
}
const sameSource = (a: AnalysisMaterial, b: AnalysisMaterial) =>
  a.id === b.id &&
  a.title === b.title &&
  a.content === b.content &&
  a.subjectName === b.subjectName &&
  a.topicName === b.topicName;
export function createMaterialAnalysisService(
  repo: Repository,
  transport?: MaterialAnalysisTransport,
) {
  const drafts = new Map<string, { source: AnalysisMaterial; owner: string }>();
  const owner = () => {
    const data = repo.getSnapshot();
    if (data.workspace !== 'personal') throw new AIError('unavailable');
    if (data.user.id === 'local') throw new AIError('unauthorized');
    if (!transport) throw new AIError('unavailable');
    return data.user.id;
  };
  const check = (
    id: string,
    expectedOwner: string,
    source: AnalysisMaterial,
    signal?: AbortSignal,
  ) => {
    if (signal?.aborted) throw new AIError('cancelled');
    if (owner() !== expectedOwner || !sameSource(analysisSource(repo.getSnapshot(), id), source))
      throw new AIError('invalid_input');
  };
  return {
    available:
      !!transport &&
      repo.getSnapshot().workspace === 'personal' &&
      repo.getSnapshot().user.id !== 'local',
    async analyze(id: string, signal?: AbortSignal): Promise<MaterialAnalysisRecord> {
      const userId = owner();
      const source = analysisSource(repo.getSnapshot(), id);
      check(id, userId, source, signal);
      const saved = repo.getSnapshot().materials.find((m) => m.id === id)?.analysis;
      const result =
        saved && sameSource(saved.source, source)
          ? saved.record
          : await transport!.analyze(userId, source, signal);
      check(id, userId, source, signal);
      const record = parseAnalysisRecord(result, userId, source);
      if (drafts.size >= 20) drafts.delete(drafts.keys().next().value!);
      drafts.set(record.id, { source, owner: userId });
      return record;
    },
    async approve(id: string, record: MaterialAnalysisRecord, signal?: AbortSignal) {
      const userId = owner();
      const draft = drafts.get(record.id);
      if (!draft || draft.owner !== userId) throw new AIError('invalid_input');
      check(id, userId, draft.source, signal);
      parseAnalysisRecord(record, userId, draft.source);
      if (record.analysis.status !== 'analyzed') throw new AIError('invalid_output');
      const reviewed = parseAnalysisRecord(
        await transport!.review(userId, record.id, signal),
        userId,
        draft.source,
      );
      if (!reviewed.reviewedAt || reviewed.id !== record.id) throw new AIError('invalid_output');
      check(id, userId, draft.source, signal);
      repo.update((data) => {
        if (data.materials.find((m) => m.id === id)?.analysis?.record.id === record.id) return data;
        const material = data.materials.find((m) => m.id === id)!;
        const learning = data.learning ?? emptyLearning();
        const concepts = [...learning.concepts];
        const relations = [...learning.relations];
        const ids = new Map<string, string>();
        reviewed.analysis.concepts.forEach((concept, index) => {
          const previous = concepts.find(
            (c) =>
              c.topicId === material.topicId &&
              normalizeConcept(c.name) === normalizeConcept(concept.name),
          );
          const conceptId = previous?.id ?? `analysis:${record.id}:${index}`;
          ids.set(normalizeConcept(concept.name), conceptId);
          if (previous)
            concepts[concepts.indexOf(previous)] = {
              ...previous,
              sourceIds: [...new Set([...previous.sourceIds, id])],
            };
          else
            concepts.push({
              id: conceptId,
              topicId: material.topicId,
              name: concept.name,
              summary: concept.description,
              sourceIds: [id],
            });
        });
        const reaches = (from: string, to: string, seen = new Set<string>()): boolean => {
          if (from === to) return true;
          if (seen.has(from)) return false;
          seen.add(from);
          return relations
            .filter((r) => r.type === 'PREREQUISITE_OF' && r.fromId === from)
            .some((r) => reaches(r.toId, to, seen));
        };
        for (const concept of reviewed.analysis.concepts) {
          const toId = ids.get(normalizeConcept(concept.name))!;
          for (const prerequisite of concept.prerequisites) {
            const fromId = ids.get(normalizeConcept(prerequisite))!;
            if (
              !reaches(toId, fromId) &&
              !relations.some(
                (r) => r.type === 'PREREQUISITE_OF' && r.fromId === fromId && r.toId === toId,
              )
            )
              relations.push({
                id: `prerequisite:${fromId}:${toId}`,
                fromId,
                toId,
                type: 'PREREQUISITE_OF',
              });
          }
        }
        const conceptIds = [...ids.values()];
        return appendStudyEvent(
          {
            ...data,
            learning: { ...learning, concepts, relations },
            materials: data.materials.map((m) =>
              m.id === id
                ? { ...m, analysis: { record: reviewed, source: draft.source, conceptIds } }
                : m,
            ),
          },
          {
            ...eventContext(
              data,
              `analysis-reviewed:${record.id}`,
              reviewed.reviewedAt!,
              conceptIds,
              [id],
            ),
            type: 'MATERIAL_ANALYSIS_REVIEWED',
            generationId: record.id,
          },
        );
      });
      return reviewed;
    },
  };
}
