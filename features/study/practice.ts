import { estimateConceptMastery, questionLevel } from './mastery';
import { questionConceptId } from './concepts';
import { stagePolicies } from './policy';
import { assessmentPlan } from './assessments';
import { isAcademicStage } from './academic';
import { questionStructureIssues } from './questionEngine';
import type { AppData, Question, QuestionAttempt } from '@/types/domain';
import type {
  PracticeConcept,
  PracticeConfig,
  PracticeSession,
  PracticeState,
  PracticeRecommendation,
  StudySource,
} from '@/types/practice';

export const normalizePracticeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
export const conceptId = questionConceptId;
export { estimateConceptMastery, questionLevel } from './mastery';
export function practiceConcepts(data: AppData, questions = data.questions): PracticeConcept[] {
  const map = new Map<string, PracticeConcept>();
  for (const question of questions) {
    const topic = data.topics.find((item) => item.id === question.topicId);
    if (!topic) continue;
    map.set(conceptId(question), {
      id: conceptId(question),
      topicId: topic.id,
      name: question.conceptName ?? topic.name,
      summary: topic.summary,
    });
  }
  return [...map.values()];
}

export function studySources(data: AppData): StudySource[] {
  const sources: StudySource[] = data.materials.map((material) => ({
    id: `material:${material.id}`,
    kind: 'material',
    title: material.title,
    detail: material.type,
    topicIds: [material.topicId],
    content: material.content,
    updatedAt: material.lastOpenedAt ?? material.createdAt,
    simulated: data.workspace !== 'personal' && !material.content,
  }));
  for (const document of data.studio ?? []) {
    const material = data.materials.find((item) => item.id === document.materialId);
    sources.push({
      id: `studio:${document.id}`,
      kind: 'studio',
      title: document.title,
      detail: { transcript: 'Transcrição em texto', mindmap: 'Mapa mental', slides: 'Slides' }[
        document.kind
      ],
      topicIds: material ? [material.topicId] : [],
      content: document.body,
      updatedAt: document.updatedAt,
      simulated: false,
    });
  }
  for (const chat of data.conversations) {
    const topic =
      chat.topicId ?? data.materials.find((item) => item.id === chat.materialId)?.topicId;
    if (!chat.messages.length) continue;
    sources.push({
      id: `chat:${chat.id}`,
      kind: 'chat',
      title:
        chat.messages.find((item) => item.role === 'user')?.content.slice(0, 90) ??
        'Conversa salva',
      detail: 'Chat · respostas simuladas',
      topicIds: topic ? [topic] : [],
      content: chat.messages.map((item) => item.content).join('\n'),
      updatedAt: chat.messages.at(-1)!.createdAt,
      simulated: true,
    });
  }
  for (const card of data.flashcards)
    sources.push({
      id: `flashcard:${card.id}`,
      kind: 'flashcard',
      title: card.front,
      detail: 'Flashcard',
      topicIds: [card.topicId],
      content: `${card.front}\n${card.back}`,
      questionIds: card.sourceQuestionId ? [card.sourceQuestionId] : [],
      updatedAt:
        data.reviews
          .filter((review) => review.flashcardId === card.id)
          .map((review) => review.createdAt)
          .sort()
          .at(-1) ?? '',
      simulated: data.workspace !== 'personal' && !card.id.startsWith('card-'),
    });
  for (const session of data.practice?.sessions ?? []) {
    if (session.status !== 'completed' || !session.items.some((item) => item.attemptId)) continue;
    sources.push({
      id: `quiz:${session.id}`,
      kind: 'quiz',
      title: `Sessão de ${session.config.mode === 'exam' ? 'simulado' : 'prática'}`,
      detail: `${session.items.filter((item) => item.attemptId).length} questões respondidas`,
      topicIds: session.config.topicIds,
      questionIds: session.pool
        .filter((question) =>
          session.items.some(
            (item) => item.attemptId && conceptId(item.question) === conceptId(question),
          ),
        )
        .map((question) => question.id),
      updatedAt: session.endedAt!,
      simulated: data.workspace !== 'personal',
    });
  }
  return sources
    .map((source) => ({
      ...source,
      topicIds: [
        ...new Set([
          ...source.topicIds,
          ...data.questions
            .filter((question) => question.sourceIds?.includes(source.id))
            .map((question) => question.topicId),
        ]),
      ],
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function practicePool(data: AppData, config: PracticeConfig): Question[] {
  const assessment = assessmentPlan(data, config.assessmentGoalId);
  const sources = studySources(data).filter((source) => config.sourceIds.includes(source.id));
  const clinicalFormats = [
    'clinical',
    'progressive',
    'laboratory',
    'differential',
    'management',
    'integration',
  ];
  const clinicalConcepts = new Set(
    data.questions
      .filter((question) => clinicalFormats.includes(question.format ?? ''))
      .map(conceptId),
  );
  const pool = data.questions.filter((question) => {
    if (assessment && !assessment.conceptIds.includes(conceptId(question))) return false;
    if (!config.topicIds.includes(question.topicId)) return false;
    if (config.difficulty !== 'adaptive' && question.difficulty !== config.difficulty) return false;
    if (config.conceptIds.length && !config.conceptIds.includes(conceptId(question))) return false;
    if (
      config.style === 'clinical' &&
      !clinicalFormats.includes(question.format ?? '') &&
      !(
        config.mode !== 'exam' &&
        config.difficulty === 'adaptive' &&
        clinicalConcepts.has(conceptId(question))
      )
    )
      return false;
    if (
      config.style === 'conceptual' &&
      !['concept', 'mechanism', 'application', undefined].includes(question.format)
    )
      return false;
    if (!config.sourceIds.length) return true;
    return sources.some(
      (source) =>
        question.sourceIds?.includes(source.id) ||
        source.questionIds?.includes(question.id) ||
        (data.workspace !== 'personal' &&
          source.simulated &&
          source.topicIds.includes(question.topicId)),
    );
  });
  return pool.filter(
    (question) =>
      !question.caseGroupId ||
      Array.from(
        { length: Math.max(0, (question.caseStep ?? 1) - 1) },
        (_, index) => index + 1,
      ).every((step) =>
        pool.some((prior) => prior.caseGroupId === question.caseGroupId && prior.caseStep === step),
      ),
  );
}

export function nextPracticeQuestion(
  data: AppData,
  session: PracticeSession,
  now = new Date(),
): Question | undefined {
  const stage = session.academicStage ?? data.academicJourney?.stage ?? 'UNKNOWN';
  const pedagogy = stagePolicies[stage];
  const goal = data.academicJourney?.learningGoal;
  const used = new Set(session.items.map((item) => item.question.id));
  const pool = session.pool.filter(
    (question) =>
      !used.has(question.id) &&
      (!question.caseGroupId ||
        (question.caseStep ?? 1) <= 1 ||
        session.items.some(
          (item) =>
            item.question.caseGroupId === question.caseGroupId &&
            item.question.caseStep === question.caseStep! - 1 &&
            (session.config.mode === 'exam' || item.attemptId),
        )),
  );
  const last = session.items.at(-1);
  const attempt = data.attempts.find((item) => item.id === last?.attemptId);
  const remediation = attempt && (!attempt.correct || attempt.confidence === 'guess');
  const lastConcept = last && conceptId(last.question);
  const returnTo =
    !remediation && lastConcept && attempt?.correct
      ? [...session.items]
          .reverse()
          .find(
            (item) =>
              item.question.prerequisiteConceptId === lastConcept &&
              data.attempts.some((answer) => answer.id === item.attemptId && !answer.correct),
          )?.question
      : undefined;
  return pool
    .map((question) => {
      const id = conceptId(question);
      const mastery = estimateConceptMastery(data, id, now);
      let target = mastery.exposures
        ? Math.max(1, Math.min(5, Math.ceil(mastery.value / 20)))
        : pedagogy.startingLevel;
      if (!session.items.length && session.config.style === 'clinical') target = 4;
      if (last && lastConcept === id && attempt)
        target = Math.max(
          1,
          Math.min(
            5,
            questionLevel(last.question) +
              (attempt.correct && attempt.confidence === 'certain' ? 1 : -1),
          ),
        );
      if (session.config.difficulty !== 'adaptive')
        target = { Fácil: 1, Média: 3, Difícil: 5 }[session.config.difficulty];
      else if (returnTo && conceptId(returnTo) === id)
        target = Math.max(2, questionLevel(returnTo) - 1);
      const review = data.practice?.reviews.find((item) => item.conceptId === id);
      const history = data.attempts.filter((item) => item.questionId === question.id);
      let score = (100 - mastery.value) * 0.12 - Math.abs(questionLevel(question) - target) * 12;
      if (stage !== 'UNKNOWN' && pedagogy.formats.includes(question.format ?? 'concept'))
        score += 24;
      if (goal === 'retention' && review && Date.parse(review.dueAt) <= now.getTime()) score += 35;
      if (
        goal === 'understanding' &&
        ['concept', 'mechanism'].includes(question.format ?? 'concept')
      )
        score += 18;
      if (
        goal === 'clinical-reasoning' &&
        ['clinical', 'progressive', 'management', 'application'].includes(question.format ?? '')
      )
        score += 18;
      if (goal === 'assessment')
        score -= session.items.filter((item) => conceptId(item.question) === id).length * 40;
      score += mastery.highConfidenceErrors * 12;
      if (returnTo && conceptId(returnTo) === id) score += 70;
      if (
        !remediation &&
        last?.question.caseGroupId &&
        last.question.caseGroupId === question.caseGroupId &&
        question.caseStep === (last.question.caseStep ?? 1) + 1
      )
        score += 80;
      score += review && Date.parse(review.dueAt) <= now.getTime() ? 25 : 0;
      score += history.length ? -Math.min(30, history.length * 8) : 12;
      if (remediation && (id === lastConcept || id === last?.question.prerequisiteConceptId))
        score += 80 - questionLevel(question) * 5;
      else if (session.config.interleaved && lastConcept === id) score -= 30;
      if (session.config.mode === 'diagnostic')
        score -= session.items.filter((item) => conceptId(item.question) === id).length * 100;
      if (!session.items.length && question.id === session.config.preferredQuestionId)
        score += 1000;
      return { question, score };
    })
    .sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))[0]?.question;
}

export function practiceWeakConcepts(data: AppData, now = new Date()): PracticeConcept[] {
  return practiceConcepts(data)
    .filter((concept) => {
      const mastery = estimateConceptMastery(data, concept.id, now);
      return mastery.exposures > 0
        ? mastery.value < 70 || mastery.highConfidenceErrors > 0
        : data.mistakes.some(
            (mistake) =>
              (mistake.conceptId ??
                data.questions.find((question) => question.id === mistake.questionId)?.conceptId ??
                mistake.topicId) === concept.id,
          );
    })
    .sort(
      (a, b) =>
        estimateConceptMastery(data, a.id, now).value -
        estimateConceptMastery(data, b.id, now).value,
    );
}

export function continuingTopics(data: AppData) {
  return data.topics
    .map((topic) => {
      const dates = [
        ...studySources(data)
          .filter((source) => source.kind !== 'flashcard' && source.topicIds.includes(topic.id))
          .map((source) => source.updatedAt),
        ...data.materials
          .filter((item) => item.topicId === topic.id)
          .map((item) => item.lastOpenedAt ?? item.createdAt),
        ...data.sessions
          .filter((item) => item.topicId === topic.id)
          .map((item) => item.endedAt ?? item.startedAt),
        ...data.attempts
          .filter((attempt) =>
            data.questions.some(
              (question) => question.id === attempt.questionId && question.topicId === topic.id,
            ),
          )
          .map((item) => item.createdAt),
        ...data.conversations
          .filter((item) => item.topicId === topic.id)
          .flatMap((item) => item.messages.map((message) => message.createdAt)),
      ].sort();
      return {
        topic,
        lastActivity: dates.at(-1),
        metric: data.metrics.find((metric) => metric.topicId === topic.id),
      };
    })
    .filter((item) => item.lastActivity)
    .sort((a, b) => b.lastActivity!.localeCompare(a.lastActivity!));
}

export function searchPracticeTopics(data: AppData, query: string) {
  const needle = normalizePracticeText(query);
  return data.topics.filter(
    (topic) =>
      !needle ||
      normalizePracticeText(
        [
          topic.name,
          topic.summary,
          ...topic.keyPoints,
          ...data.questions
            .filter((question) => question.topicId === topic.id)
            .flatMap((question) => [question.conceptName ?? '', question.prompt]),
        ].join(' '),
      ).includes(needle),
  );
}

export function practiceReport(data: AppData, session: PracticeSession) {
  const attempts = data.attempts.filter((attempt) => attempt.practiceSessionId === session.id);
  const concepts = practiceConcepts(
    data,
    session.items.map((item) => item.question),
  ).map((concept) => {
    const answers = attempts.filter((attempt) => attempt.conceptId === concept.id);
    const mastery = estimateConceptMastery(data, concept.id);
    return {
      ...concept,
      mastery,
      before: session.masteryBefore[concept.id] ?? 0,
      answered: answers.length,
      correct: answers.filter((answer) => answer.correct).length,
      errors: answers.filter((answer) => !answer.correct).length,
      confidentErrors: answers.filter(
        (answer) => !answer.correct && answer.confidence === 'certain',
      ).length,
    };
  });
  const weak = concepts
    .filter((concept) => concept.answered && (concept.errors || concept.mastery.value < 65))
    .sort(
      (a, b) =>
        b.confidentErrors - a.confidentErrors ||
        b.errors - a.errors ||
        a.mastery.value - b.mastery.value,
    );
  const strengths = concepts.filter(
    (concept) => concept.answered && !concept.errors && concept.mastery.value >= 60,
  );
  const recommendation: PracticeRecommendation = {
    title: 'Seu próximo passo',
    detail: weak[0]
      ? `Na próxima sessão, retome ${weak[0].name.toLocaleLowerCase('pt-BR')}. Comece pelo conceito base e avance para uma situação diferente.`
      : 'Retome estes conceitos em dias diferentes e avance gradualmente para novas aplicações.',
    reason: weak[0]?.confidentErrors
      ? 'misconception'
      : weak.length
        ? 'weak-concept'
        : 'spaced-review',
    topicIds: [...new Set((weak.length ? weak : concepts).map((concept) => concept.topicId))],
    conceptIds: (weak.length ? weak : concepts).map((concept) => concept.id),
    questionCount: 5,
  };
  return {
    attempts,
    correct: attempts.filter((answer) => answer.correct).length,
    concepts,
    weak,
    strengths,
    recommendation,
  };
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
export function validPracticeState(value: unknown): value is PracticeState | undefined {
  if (value === undefined) return true;
  if (
    !record(value) ||
    !Array.isArray(value.sessions) ||
    !Array.isArray(value.mastery) ||
    !Array.isArray(value.reviews)
  )
    return false;
  const validQuestion = (question: unknown) =>
    questionStructureIssues(question).length === 0 &&
    record(question) &&
    typeof question.id === 'string' &&
    typeof question.topicId === 'string' &&
    typeof question.prompt === 'string' &&
    typeof question.explanation === 'string' &&
    typeof question.source === 'string' &&
    typeof question.probableCause === 'string' &&
    (question.caseGroupId === undefined || typeof question.caseGroupId === 'string') &&
    (question.caseStep === undefined ||
      (Number.isInteger(question.caseStep) &&
        Number(question.caseStep) >= 1 &&
        Number(question.caseStep) <= 20)) &&
    ['Fácil', 'Média', 'Difícil'].includes(String(question.difficulty)) &&
    (question.level === undefined ||
      (typeof question.level === 'number' && [1, 2, 3, 4, 5].includes(question.level))) &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    question.options.length <= 8 &&
    new Set(question.options.map((option: { id?: string }) => option?.id)).size ===
      question.options.length &&
    question.options.every(
      (option: unknown) =>
        record(option) &&
        typeof option.id === 'string' &&
        typeof option.text === 'string' &&
        typeof option.explanation === 'string',
    ) &&
    question.options.some((option: { id: string }) => option.id === question.correctOptionId);
  return (
    value.sessions.every((session: unknown) => {
      if (
        !record(session) ||
        !record(session.config) ||
        (session.academicStage !== undefined && !isAcademicStage(session.academicStage)) ||
        typeof session.id !== 'string' ||
        !['active', 'paused', 'completed'].includes(String(session.status)) ||
        (session.status === 'completed' && !Number.isFinite(Date.parse(String(session.endedAt)))) ||
        !Number.isFinite(Date.parse(String(session.startedAt))) ||
        !Number.isFinite(Date.parse(String(session.updatedAt))) ||
        !Number.isFinite(session.elapsedSeconds) ||
        Number(session.elapsedSeconds) < 0 ||
        !Number.isInteger(session.currentIndex) ||
        !Array.isArray(session.pool) ||
        !session.pool.every(validQuestion) ||
        !Array.isArray(session.items) ||
        !session.items.length ||
        !session.items.every(
          (item: unknown) =>
            record(item) &&
            validQuestion(item.question) &&
            (item.elapsedSeconds === undefined ||
              (Number.isFinite(item.elapsedSeconds) && Number(item.elapsedSeconds) >= 0)) &&
            (item.confidence === undefined ||
              ['certain', 'unsure', 'guess'].includes(String(item.confidence))) &&
            (item.locked === undefined || typeof item.locked === 'boolean') &&
            (item.flagged === undefined || typeof item.flagged === 'boolean') &&
            (item.attemptId === undefined || typeof item.attemptId === 'string') &&
            (item.selectedOptionId === undefined ||
              (item.question as Question).options.some(
                (option) => option.id === item.selectedOptionId,
              )),
        ) ||
        !record(session.masteryBefore) ||
        !Object.values(session.masteryBefore).every(
          (mastery) =>
            typeof mastery === 'number' &&
            Number.isFinite(mastery) &&
            mastery >= 0 &&
            mastery <= 100,
        ) ||
        !Array.isArray(session.sourceTitles) ||
        !session.sourceTitles.every((title: unknown) => typeof title === 'string')
      )
        return false;
      const config = session.config;
      return (
        ['learn', 'review', 'exam', 'diagnostic'].includes(String(config.mode)) &&
        ['adaptive', 'Fácil', 'Média', 'Difícil'].includes(String(config.difficulty)) &&
        ['mixed', 'clinical', 'conceptual'].includes(String(config.style)) &&
        (config.academicStage === undefined || isAcademicStage(config.academicStage)) &&
        (config.timeLimitSeconds === undefined ||
          (Number.isInteger(config.timeLimitSeconds) &&
            Number(config.timeLimitSeconds) >= 60 &&
            Number(config.timeLimitSeconds) <= 7200)) &&
        (session.deadlineAt === undefined || config.timeLimitSeconds !== undefined) &&
        Number.isInteger(config.count) &&
        Number(config.count) >= 1 &&
        Number(config.count) <= 50 &&
        typeof config.interleaved === 'boolean' &&
        session.items.length <= Number(config.count) &&
        new Set(session.items.map((item: { question: Question }) => item.question.id)).size ===
          session.items.length &&
        session.items.every((item: { question: Question }) =>
          (session.pool as Question[]).some((question) => question.id === item.question.id),
        ) &&
        ['topicIds', 'conceptIds', 'sourceIds'].every(
          (key) =>
            Array.isArray(config[key]) &&
            config[key].every((id: unknown) => typeof id === 'string'),
        ) &&
        (session.deadlineAt === undefined ||
          Number.isFinite(Date.parse(String(session.deadlineAt)))) &&
        Number(session.currentIndex) >= 0 &&
        Number(session.currentIndex) < session.items.length
      );
    }) &&
    value.mastery.every(
      (item: unknown) =>
        record(item) &&
        typeof item.conceptId === 'string' &&
        Number.isFinite(item.value) &&
        Number(item.value) >= 0 &&
        Number(item.value) <= 100 &&
        Number.isInteger(item.exposures) &&
        Number(item.exposures) >= 0,
    ) &&
    value.reviews.every(
      (item: unknown) =>
        record(item) &&
        typeof item.conceptId === 'string' &&
        Number.isFinite(Date.parse(String(item.dueAt))) &&
        Number.isFinite(item.intervalDays) &&
        Number(item.intervalDays) >= 0,
    )
  );
}

export function attemptForItem(
  data: AppData,
  session: PracticeSession,
  index: number,
): QuestionAttempt | undefined {
  return data.attempts.find((attempt) => attempt.id === session.items[index]?.attemptId);
}
