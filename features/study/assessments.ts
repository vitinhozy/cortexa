import type { AcademicJourney } from '@/types/academic';
import type { AppData } from '@/types/domain';
import type { AssessmentFramework, AssessmentState, AssessmentSource } from '@/types/assessment';
import { estimateConceptMastery } from './mastery';
import { localDate } from '@/utils/date';

const date = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  localDate(new Date(`${value}T12:00:00`)) === value;
const source = (value: AssessmentSource) =>
  !!value &&
  typeof value.title === 'string' &&
  value.title.trim().length > 0 &&
  typeof value.documentId === 'string' &&
  value.documentId.trim().length > 0 &&
  typeof value.url === 'string' &&
  /^https:\/\//.test(value.url) &&
  date(value.publishedAt) &&
  ['official', 'institution', 'personal'].includes(value.kind);
export function validAssessmentFramework(value: unknown): value is AssessmentFramework {
  if (!value || typeof value !== 'object') return false;
  const f = value as AssessmentFramework;
  const r = f.regulation;
  if (
    ![f.id, f.title, f.version].every((v) => typeof v === 'string' && v.trim().length > 0) ||
    !r ||
    ![r.id, r.version].every((v) => typeof v === 'string' && v.trim()) ||
    !source(r.source) ||
    !['DRAFT', 'APPROVED_BY_CONGRESS', 'SANCTIONED', 'REGULATED', 'SUPERSEDED', 'VETOED'].includes(
      r.status,
    )
  )
    return false;
  if (
    [r.effectiveFrom, r.effectiveUntil, r.courseEntryFrom, r.courseEntryUntil].some(
      (v) => v !== undefined && !date(v),
    ) ||
    (r.status === 'REGULATED' && !r.effectiveFrom) ||
    (r.effectiveFrom && r.effectiveUntil && r.effectiveUntil < r.effectiveFrom) ||
    (r.courseEntryFrom && r.courseEntryUntil && r.courseEntryUntil < r.courseEntryFrom)
  )
    return false;
  if (
    !Array.isArray(f.stages) ||
    !f.stages.length ||
    !f.stages.every(
      (s) =>
        s &&
        typeof s.id === 'string' &&
        typeof s.title === 'string' &&
        (s.academicYear === undefined ||
          (Number.isInteger(s.academicYear) && s.academicYear > 0)) &&
        (s.weight === undefined || (Number.isFinite(s.weight) && s.weight > 0)),
    ) ||
    new Set(f.stages.map((s) => s.id)).size !== f.stages.length
  )
    return false;
  if (
    !Array.isArray(f.competencies) ||
    !f.competencies.every(
      (c) =>
        c &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        typeof c.domain === 'string' &&
        Array.isArray(c.conceptIds) &&
        c.conceptIds.every((id) => typeof id === 'string'),
    ) ||
    new Set(f.competencies.map((c) => c.id)).size !== f.competencies.length
  )
    return false;
  return (
    !!f.blueprint &&
    typeof f.blueprint.version === 'string' &&
    source(f.blueprint.source) &&
    Array.isArray(f.blueprint.entries) &&
    f.blueprint.entries.every(
      (e) =>
        e &&
        f.stages.some((s) => s.id === e.stageId) &&
        f.competencies.some((c) => c.id === e.competencyId) &&
        (e.weight === undefined || (Number.isFinite(e.weight) && e.weight > 0)),
    ) &&
    new Set(f.blueprint.entries.map((e) => `${e.stageId}:${e.competencyId}`)).size ===
      f.blueprint.entries.length
  );
}
export function validAssessments(value: unknown): value is AssessmentState | undefined {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const state = value as AssessmentState;
  return (
    state.schemaVersion === 1 &&
    Array.isArray(state.frameworks) &&
    state.frameworks.every(validAssessmentFramework) &&
    new Set(state.frameworks.map((f) => `${f.id}:${f.version}`)).size === state.frameworks.length &&
    Array.isArray(state.goals) &&
    state.goals.every(
      (g) =>
        g &&
        typeof g.id === 'string' &&
        date(g.targetDate) &&
        state.frameworks.some(
          (f) =>
            f.id === g.frameworkId &&
            f.version === g.frameworkVersion &&
            f.stages.some((s) => s.id === g.stageId),
        ),
    ) &&
    new Set(state.goals.map((g) => g.id)).size === state.goals.length
  );
}
export function assessmentEligibility(
  journey: AcademicJourney | undefined,
  framework: AssessmentFramework,
  today = localDate(),
) {
  const r = framework.regulation;
  if (
    !validAssessmentFramework(framework) ||
    r.status !== 'REGULATED' ||
    !r.effectiveFrom ||
    r.effectiveFrom > today ||
    (r.effectiveUntil && r.effectiveUntil < today)
  )
    return {
      status: 'inactive' as const,
      reason: 'Esta versão não está regulamentada e vigente. Não há conclusão de elegibilidade.',
    };
  const entry = journey?.courseEntry;
  if ((r.courseEntryFrom || r.courseEntryUntil) && !entry)
    return {
      status: 'unknown' as const,
      reason: 'Informe o ingresso para comparar com os critérios desta versão.',
    };
  if (entry) {
    const earliest = entry.precision === 'date' ? entry.date : `${entry.year}-01-01`;
    const latest = entry.precision === 'date' ? entry.date : `${entry.year}-12-31`;
    if (
      (r.courseEntryFrom && latest < r.courseEntryFrom) ||
      (r.courseEntryUntil && earliest > r.courseEntryUntil)
    )
      return {
        status: 'ineligible' as const,
        reason: 'O ingresso informado está fora dos critérios desta configuração.',
      };
    if (
      (r.courseEntryFrom && earliest < r.courseEntryFrom) ||
      (r.courseEntryUntil && latest > r.courseEntryUntil)
    )
      return {
        status: 'unknown' as const,
        reason: 'Só o ano não é suficiente. A regra usa uma data dentro desse ano.',
      };
  }
  return {
    status: 'eligible' as const,
    reason:
      'Os dados atendem aos critérios desta versão cadastrada. Isso não certifica proficiência nem registro profissional.',
  };
}
export function assessmentCoverage(
  data: AppData,
  framework: AssessmentFramework,
  stageId: string,
  now = new Date(),
) {
  const competencyIds = framework.blueprint.entries
    .filter((e) => e.stageId === stageId)
    .map((e) => e.competencyId);
  const competencies = framework.competencies
    .filter((c) => competencyIds.includes(c.id))
    .map((c) => {
      const evidence = c.conceptIds.map((id) => estimateConceptMastery(data, id, now));
      return {
        ...c,
        concepts: evidence,
        sufficientEvidence: evidence.length > 0 && evidence.every((m) => m.sufficientEvidence),
        practiced: evidence.filter((m) => (m.objectiveExposures ?? 0) > 0).length,
      };
    });
  return {
    competencies,
    status:
      competencies.length && competencies.every((c) => c.sufficientEvidence)
        ? ('covered' as const)
        : ('insufficient-evidence' as const),
    missingConceptIds: [
      ...new Set(
        competencies.flatMap((c) =>
          c.concepts.filter((m) => !m.sufficientEvidence).map((m) => m.conceptId),
        ),
      ),
    ],
  };
}
export function assessmentPlan(data: AppData, goalId: string | undefined) {
  if (!goalId) return undefined;
  const goal = data.assessments?.goals.find((g) => g.id === goalId);
  const framework = data.assessments?.frameworks.find(
    (f) => f.id === goal?.frameworkId && f.version === goal.frameworkVersion,
  );
  if (
    !goal ||
    !framework ||
    assessmentEligibility(data.academicJourney, framework).status === 'inactive'
  )
    throw new Error(
      'A avaliação selecionada não tem uma versão regulamentada e vigente disponível.',
    );
  const entries = framework.blueprint.entries.filter((e) => e.stageId === goal.stageId);
  const conceptIds = framework.competencies
    .filter((c) => entries.some((e) => e.competencyId === c.id))
    .flatMap((c) => c.conceptIds);
  if (!conceptIds.length)
    throw new Error('A matriz desta etapa ainda não contém conceitos para a prática.');
  return {
    conceptIds,
    context: {
      frameworkId: framework.id,
      frameworkVersion: framework.version,
      stageId: goal.stageId,
      blueprintVersion: framework.blueprint.version,
      regulationVersion: framework.regulation.version,
    },
  };
}
