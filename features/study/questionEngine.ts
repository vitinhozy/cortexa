import type { AppData, Question } from '@/types/domain';
import type { PracticeConfig } from '@/types/practice';
import type {
  QuestionGenerator,
  QuestionQualityValidator,
  QuestionSpecification,
} from '@/types/learning';
import { conceptCatalog } from './concepts';
import { estimateConceptMastery } from './mastery';
import { learningPolicy, stagePolicies } from './policy';
import { assessmentPlan } from './assessments';

export function questionSpecifications(
  data: AppData,
  config: PracticeConfig,
  now = new Date(),
): QuestionSpecification[] {
  const stage = config.academicStage ?? data.academicJourney?.stage ?? 'UNKNOWN';
  const policy = stagePolicies[stage];
  const assessment = assessmentPlan(data, config.assessmentGoalId);
  return conceptCatalog(data)
    .filter(
      (c) =>
        config.topicIds.includes(c.topicId) &&
        (!assessment || assessment.conceptIds.includes(c.id)) &&
        (!config.conceptIds.length || config.conceptIds.includes(c.id)),
    )
    .map((concept) => {
      const mastery = estimateConceptMastery(data, concept.id, now);
      const due = data.practice?.reviews.some(
        (r) => r.conceptId === concept.id && Date.parse(r.dueAt) <= now.getTime(),
      );
      return {
        conceptId: concept.id,
        assessmentContext: assessment?.context,
        topicId: concept.topicId,
        academicStage: stage,
        difficulty:
          config.difficulty === 'adaptive'
            ? mastery.exposures
              ? Math.max(1, Math.min(5, Math.ceil(mastery.value / 20)))
              : policy.startingLevel
            : { Fácil: 1, Média: 3, Difícil: 5 }[config.difficulty],
        formats: policy.formats,
        learningObjective: policy.objective,
        goal: data.user.goal || undefined,
        sourceIds: config.sourceIds.length ? config.sourceIds : concept.sourceIds,
        priority: 100 - mastery.value + mastery.highConfidenceErrors * 30 + (due ? 40 : 0),
        policyVersion: learningPolicy.version,
      };
    })
    .sort((a, b) => b.priority - a.priority || a.conceptId.localeCompare(b.conceptId));
}
export function questionStructureIssues(value: unknown): string[] {
  if (!value || typeof value !== 'object') return ['Questão ausente.'];
  const q = value as Partial<Question>;
  const issues: string[] = [];
  if (
    ![q.id, q.topicId, q.prompt, q.explanation, q.source, q.probableCause].every(
      (v) => typeof v === 'string' && v.trim().length > 0,
    )
  )
    issues.push('Preencha identificação, assunto, enunciado, explicação e origem.');
  if (!['Fácil', 'Média', 'Difícil'].includes(q.difficulty ?? ''))
    issues.push('Dificuldade inválida.');
  if (q.level !== undefined && ![1, 2, 3, 4, 5].includes(q.level)) issues.push('Nível inválido.');
  if (
    !Array.isArray(q.options) ||
    q.options.length < 2 ||
    q.options.length > 8 ||
    q.options.some(
      (o) => !o || ![o.id, o.text, o.explanation].every((v) => typeof v === 'string' && v.trim()),
    )
  )
    issues.push('Alternativas e suas explicações são obrigatórias.');
  else {
    const normalized = q.options.map((o) =>
      o.text.normalize('NFKC').trim().toLocaleLowerCase('pt-BR'),
    );
    if (
      new Set(normalized).size !== q.options.length ||
      new Set(q.options.map((o) => o.id)).size !== q.options.length
    )
      issues.push('As alternativas não podem se repetir.');
    if (q.options.filter((o) => o.id === q.correctOptionId).length !== 1)
      issues.push('Informe exatamente uma alternativa correta.');
  }
  return issues;
}
/** Structural validity is separate from medical approval. Never publishes automatically. */
export async function generateQuestionCandidate(
  generator: QuestionGenerator,
  specification: QuestionSpecification,
  quality?: QuestionQualityValidator,
) {
  const candidate = await generator.generate(specification);
  const issues = questionStructureIssues(candidate);
  if (issues.length) throw new Error(issues.join(' '));
  const question = candidate as Question;
  if (question.topicId !== specification.topicId || question.conceptId !== specification.conceptId)
    throw new Error('A questão não corresponde ao conceito solicitado.');
  if (
    (question.sourceIds ?? []).some((id) => !specification.sourceIds.includes(id)) ||
    question.citations?.some((c) => !c.sourceId || !specification.sourceIds.includes(c.sourceId))
  )
    throw new Error('A questão contém uma fonte que não foi autorizada.');
  if (specification.sourceIds.length && !question.sourceIds?.length)
    throw new Error('A questão deve identificar a fonte utilizada.');
  const result = quality
    ? await quality.evaluate(question, specification)
    : { approved: false, issues: ['Conteúdo aguardando revisão de qualidade e precisão médica.'] };
  return {
    question,
    quality: result.approved ? ('approved' as const) : ('needs-review' as const),
    issues: result.issues,
  };
}
