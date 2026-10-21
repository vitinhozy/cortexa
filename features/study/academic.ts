import type {
  AcademicJourney,
  AcademicJourneyInput,
  AcademicStage,
  CourseEntry,
} from '@/types/academic';
import type { AppData } from '@/types/domain';
import { localDate } from '@/utils/date';

export const academicStages: AcademicStage[] = [
  'UNKNOWN',
  'FOUNDATIONS',
  'CLINICAL',
  'INTERNSHIP',
  'RESIDENCY_PREP',
  'RESIDENCY',
];
export const isAcademicStage = (value: unknown): value is AcademicStage =>
  academicStages.includes(value as AcademicStage);
export const emptyJourney = (): AcademicJourney => ({
  schemaVersion: 1,
  stage: 'UNKNOWN',
  semesterConfirmed: false,
  modules: [],
  currentTopicIds: [],
  transitions: [],
});
export function validCourseEntry(value: unknown): value is CourseEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<CourseEntry> & { year?: number; date?: string };
  if (entry.precision === 'year')
    return (
      Number.isInteger(entry.year) && entry.year! >= 1900 && entry.year! <= new Date().getFullYear()
    );
  return (
    entry.precision === 'date' &&
    typeof entry.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
    Number.isFinite(Date.parse(entry.date)) &&
    localDate(new Date(`${entry.date}T12:00:00`)) === entry.date &&
    entry.date <= localDate() &&
    entry.date >= '1900-01-01'
  );
}
const optionalText = (value: unknown) =>
  value === undefined || (typeof value === 'string' && value.length <= 200);
const texts = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 100 &&
  value.every((item) => typeof item === 'string' && item.length <= 200);
export function validJourney(value: unknown): value is AcademicJourney {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AcademicJourney>;
  return (
    item.schemaVersion === 1 &&
    (item.learningGoal === undefined ||
      ['understanding', 'retention', 'clinical-reasoning', 'assessment'].includes(
        item.learningGoal,
      )) &&
    isAcademicStage(item.stage) &&
    typeof item.semesterConfirmed === 'boolean' &&
    (item.courseEntry === undefined || validCourseEntry(item.courseEntry)) &&
    (item.currentYear === undefined ||
      (Number.isInteger(item.currentYear) && item.currentYear >= 1 && item.currentYear <= 30)) &&
    texts(item.modules) &&
    texts(item.currentTopicIds) &&
    [item.curriculum, item.rotation, item.specialtyInterest, item.residencyGoal].every(
      optionalText,
    ) &&
    (item.updatedAt === undefined || Number.isFinite(Date.parse(item.updatedAt))) &&
    Array.isArray(item.transitions) &&
    item.transitions.every(
      (t) =>
        !!t &&
        typeof t.id === 'string' &&
        isAcademicStage(t.from) &&
        isAcademicStage(t.to) &&
        t.source === 'student' &&
        Number.isFinite(Date.parse(t.confirmedAt)),
    ) &&
    new Set(item.transitions.map((t) => t.id)).size === item.transitions.length
  );
}
export function updateJourney(
  data: AppData,
  input: AcademicJourneyInput,
  now: string,
  transitionId: string,
): AcademicJourney {
  const previous = data.academicJourney ?? emptyJourney();
  const changed = previous.stage !== input.stage;
  if (changed && previous.stage !== 'UNKNOWN' && !input.confirmTransition)
    throw new Error('Confirme a mudança de etapa. Seu histórico anterior será preservado.');
  const next: AcademicJourney = {
    ...previous,
    ...input,
    modules: input.modules ?? previous.modules,
    currentTopicIds: input.currentTopicIds ?? previous.currentTopicIds,
    transitions: changed
      ? [
          ...previous.transitions,
          {
            id: transitionId,
            from: previous.stage,
            to: input.stage,
            confirmedAt: now,
            source: 'student',
          },
        ]
      : previous.transitions,
    updatedAt: now,
  };
  // Form-only flags are never persisted as part of the domain.
  delete (next as AcademicJourney & { confirmTransition?: boolean }).confirmTransition;
  if (!validJourney(next))
    throw new Error('Confira a etapa, o ano e a data de ingresso informados.');
  if (next.currentTopicIds.some((id) => !data.topics.some((topic) => topic.id === id)))
    throw new Error('Escolha assuntos deste espaço de estudo.');
  return next;
}
