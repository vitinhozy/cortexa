import type { AppData } from '@/types/domain';
import type { LearningState } from '@/types/learning';
import { validJourney, isAcademicStage } from './academic';
import { questionStructureIssues } from './questionEngine';
import { validAssessments } from './assessments';
import { parseAnalysisMaterial, parseAnalysisRecord } from './materialAnalysisSchema';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
export const isText = (v: unknown): v is string => typeof v === 'string';
export const isTexts = (v: unknown): v is string[] => Array.isArray(v) && v.every(isText);
export const isDate = (v: unknown): v is string => isText(v) && Number.isFinite(Date.parse(v));
function validStoredAnalysis(value: unknown, owner: string, materialId: string): boolean {
  if (value === undefined) return true;
  try {
    if (!isRecord(value) || !isTexts(value.conceptIds)) return false;
    const source = parseAnalysisMaterial(value.source);
    const record = parseAnalysisRecord(value.record, owner, source);
    return source.id === materialId && !!record.reviewedAt && record.analysis.status === 'analyzed';
  } catch {
    return false;
  }
}
export const nonnegative = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;
const list = (v: unknown, predicate: (item: Record<string, unknown>) => boolean): boolean =>
  Array.isArray(v) &&
  v.every((item) => isRecord(item) && isText(item.id) && item.id.length > 0 && predicate(item)) &&
  new Set(v.map((item) => item.id)).size === v.length;
export function validLearning(value: unknown, owner: string): value is LearningState | undefined {
  if (value === undefined) return true;
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  return (
    list(
      value.concepts,
      (c) => isText(c.topicId) && isText(c.name) && isText(c.summary) && isTexts(c.sourceIds),
    ) &&
    list(
      value.relations,
      (r) =>
        isText(r.fromId) &&
        isText(r.toId) &&
        [
          'PREREQUISITE_OF',
          'RELATED_TO',
          'PART_OF',
          'CLINICAL_APPLICATION_OF',
          'ASSESSED_BY',
          'RELEVANT_FOR',
        ].includes(String(r.type)),
    ) &&
    list(value.events, (e) => {
      if (
        e.schemaVersion !== 1 ||
        e.userId !== owner ||
        !isDate(e.occurredAt) ||
        !isAcademicStage(e.academicStage) ||
        !isTexts(e.conceptIds) ||
        !isTexts(e.sourceIds) ||
        typeof e.simulated !== 'boolean' ||
        !['recorded', 'legacy'].includes(String(e.provenance))
      )
        return false;
      switch (e.type) {
        case 'MATERIAL_ANALYSIS_REVIEWED':
          return isText(e.generationId) && /^[a-f0-9]{64}$/.test(e.generationId);
        case 'QUESTION_ATTEMPT':
          return (
            isText(e.attemptId) &&
            typeof e.correct === 'boolean' &&
            questionStructureIssues(e.question).length === 0 &&
            (e.confidence === undefined ||
              ['certain', 'unsure', 'guess'].includes(String(e.confidence))) &&
            (e.responseTimeSeconds === undefined || nonnegative(e.responseTimeSeconds))
          );
        case 'FLASHCARD_REVIEW':
          return (
            isText(e.reviewId) &&
            isText(e.flashcardId) &&
            ['again', 'hard', 'good', 'easy'].includes(String(e.rating))
          );
        case 'DOCUMENT_STUDIED':
          return isText(e.topicId) && nonnegative(e.minutes);
        case 'CHAT_CONCEPT_DISCUSSION':
          return isText(e.conversationId);
        case 'SIMULATION_COMPLETED':
          return nonnegative(e.answered) && nonnegative(e.total) && e.answered <= e.total;
        default:
          return false;
      }
    }) &&
    Array.isArray(value.masteryHistory) &&
    value.masteryHistory.every(
      (h) =>
        isRecord(h) &&
        isText(h.eventId) &&
        isText(h.conceptId) &&
        (h.before === null || (nonnegative(h.before) && h.before <= 100)) &&
        nonnegative(h.after) &&
        h.after <= 100 &&
        isText(h.algorithmVersion) &&
        isDate(h.calculatedAt) &&
        isAcademicStage(h.academicStage),
    )
  );
}
export function validSnapshot(data: unknown): data is AppData {
  if (
    !isRecord(data) ||
    data.version !== 1 ||
    !isRecord(data.user) ||
    !isRecord(data.preferences) ||
    !validAssessments(data.assessments)
  )
    return false;
  const user = data.user;
  if (
    ![user.id, user.name, user.course, user.university, user.goal].every(isText) ||
    ![
      'xp',
      'streak',
      'minutes',
      'answered',
      'correct',
      'weeklyMinutes',
      'weeklyGoal',
      'semester',
    ].every((key) => nonnegative(user[key])) ||
    (user.subjectIds !== undefined && !isTexts(user.subjectIds))
  )
    return false;
  if (
    typeof data.preferences.notifications !== 'boolean' ||
    typeof data.preferences.dailyReminder !== 'boolean'
  )
    return false;
  return (
    list(data.subjects, (s) => isText(s.name) && isText(s.color)) &&
    list(
      data.topics,
      (t) =>
        isText(t.subjectId) &&
        isText(t.name) &&
        isText(t.unit) &&
        isText(t.summary) &&
        isTexts(t.keyPoints) &&
        (t.parentTopicId === undefined || isText(t.parentTopicId)) &&
        (t.kind === undefined || ['theme', 'topic', 'subtopic'].includes(String(t.kind))),
    ) &&
    list(
      data.materials,
      (m) =>
        isText(m.title) &&
        isText(m.subjectId) &&
        isText(m.topicId) &&
        isDate(m.createdAt) &&
        ['PDF', 'Slides', 'Anotações', 'Prova', 'Imagem', 'Áudio', 'Link'].includes(
          String(m.type),
        ) &&
        nonnegative(m.pages) &&
        ['ready', 'processing'].includes(String(m.status)) &&
        (m.content === undefined || isText(m.content)) &&
        validStoredAnalysis(m.analysis, String(user.id), String(m.id)),
    ) &&
    list(data.questions, (q) => questionStructureIssues(q).length === 0) &&
    list(
      data.attempts,
      (a) =>
        isText(a.questionId) &&
        isText(a.selectedOptionId) &&
        typeof a.correct === 'boolean' &&
        isDate(a.createdAt) &&
        (a.questionSnapshot === undefined ||
          questionStructureIssues(a.questionSnapshot).length === 0) &&
        (a.academicStage === undefined || isAcademicStage(a.academicStage)),
    ) &&
    list(
      data.flashcards,
      (c) =>
        isText(c.topicId) &&
        isText(c.front) &&
        isText(c.back) &&
        isDate(c.dueAt) &&
        nonnegative(c.intervalDays),
    ) &&
    list(
      data.reviews,
      (r) =>
        isText(r.flashcardId) &&
        isDate(r.createdAt) &&
        isDate(r.nextDueAt) &&
        ['again', 'hard', 'good', 'easy'].includes(String(r.rating)),
    ) &&
    list(
      data.sessions,
      (s) =>
        isText(s.topicId) &&
        isDate(s.startedAt) &&
        (s.endedAt === undefined || isDate(s.endedAt)) &&
        nonnegative(s.minutes),
    ) &&
    list(
      data.exams,
      (e) => isText(e.title) && isText(e.subjectId) && isDate(e.date) && isTexts(e.topicIds),
    ) &&
    list(
      data.plans,
      (p) =>
        isText(p.title) &&
        isDate(p.examDate) &&
        nonnegative(p.dailyMinutes) &&
        Array.isArray(p.blocks) &&
        p.blocks.every(
          (b) => isRecord(b) && isText(b.topicId) && nonnegative(b.minutes) && isDate(b.day),
        ),
    ) &&
    Array.isArray(data.metrics) &&
    data.metrics.every(
      (m) =>
        isRecord(m) &&
        isText(m.topicId) &&
        nonnegative(m.mastery) &&
        m.mastery <= 100 &&
        nonnegative(m.answered) &&
        nonnegative(m.correct),
    ) &&
    list(
      data.conversations,
      (c) =>
        ['class', 'medicine'].includes(String(c.mode)) &&
        list(
          c.messages,
          (m) =>
            ['user', 'assistant'].includes(String(m.role)) &&
            isText(m.content) &&
            isDate(m.createdAt) &&
            (m.provider === undefined || isText(m.provider)) &&
            (m.model === undefined ||
              (isText(m.model) && /^[a-zA-Z0-9._-]{1,100}$/.test(m.model))) &&
            (m.promptVersion === undefined || isText(m.promptVersion)) &&
            (m.simulated === undefined || typeof m.simulated === 'boolean'),
        ),
    ) &&
    list(
      data.mistakes,
      (m) =>
        isText(m.attemptId) &&
        isText(m.questionId) &&
        isText(m.topicId) &&
        isDate(m.createdAt) &&
        isText(m.selectedOptionId) &&
        isText(m.correctOptionId) &&
        isText(m.probableCause),
    ) &&
    (data.folders === undefined || list(data.folders, (f) => isText(f.name))) &&
    (data.academicJourney === undefined || validJourney(data.academicJourney)) &&
    validLearning(data.learning, String(user.id))
  );
}
