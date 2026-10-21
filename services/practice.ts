import { applyQuestionAttempt, appendStudyEvent, eventContext } from '@/features/study/events';
import { questionSpecifications } from '@/features/study/questionEngine';
import { isAcademicStage } from '@/features/study/academic';
import { assessmentPlan } from '@/features/study/assessments';
import type { AppData, Question, QuestionAttempt } from '@/types/domain';
import type {
  Confidence,
  PracticeConfig,
  PracticeContentProvider,
  PracticeSession,
  PracticeState,
} from '@/types/practice';
import type { Repository } from './contracts';
import {
  conceptId,
  estimateConceptMastery,
  nextPracticeQuestion,
  practiceConcepts,
  practicePool,
  questionLevel,
  studySources,
} from '@/features/study/practice';
import { uid } from '@/utils/date';

const emptyState = (): PracticeState => ({ sessions: [], mastery: [], reviews: [] });
export const localPracticeContentProvider: PracticeContentProvider = {
  async analyze(data, config) {
    const allSources = studySources(data);
    const sources = allSources.filter((source) => config.sourceIds.includes(source.id));
    if (sources.length !== new Set(config.sourceIds).size)
      throw new Error('Um dos conteúdos não está mais disponível neste espaço. Escolha novamente.');
    const questions = practicePool(data, config).map((question) => {
      const linked = sources.filter((source) => question.sourceIds?.includes(source.id));
      return {
        ...question,
        citations: linked.length
          ? linked.map((source) => ({
              sourceId: source.id,
              title: source.title,
              kind: source.simulated ? ('demo' as const) : ('material' as const),
            }))
          : (question.citations ?? [
              {
                title: question.source,
                kind: question.authored ? ('authored' as const) : ('demo' as const),
              },
            ]),
      };
    });
    return {
      sources,
      questions,
      topicIds: [...new Set(questions.map((question) => question.topicId))],
      concepts: practiceConcepts(data, questions),
      limitation: !questions.length
        ? 'Ainda não há questões vinculadas a este conteúdo. Cadastre uma questão com a fonte ou escolha outro assunto. A geração por IA ainda não está conectada.'
        : sources.some((source) => source.simulated)
          ? 'Conteúdo de demonstração: as questões vêm do banco fictício do mesmo assunto. O arquivo não foi lido nem usado como fonte médica.'
          : undefined,
    };
  },
};

function validateConfig(data: AppData, config: PracticeConfig) {
  if (
    !Number.isInteger(config.count) ||
    config.count < 1 ||
    config.count > 50 ||
    !config.topicIds.length ||
    config.topicIds.some((id) => !data.topics.some((topic) => topic.id === id)) ||
    !['learn', 'review', 'exam', 'diagnostic'].includes(config.mode) ||
    !['adaptive', 'Fácil', 'Média', 'Difícil'].includes(config.difficulty) ||
    !['mixed', 'clinical', 'conceptual'].includes(config.style) ||
    typeof config.interleaved !== 'boolean'
  )
    throw new Error('Escolha assuntos válidos e entre 1 e 50 questões.');
  if (
    config.timeLimitSeconds !== undefined &&
    (!Number.isInteger(config.timeLimitSeconds) ||
      config.timeLimitSeconds < 60 ||
      config.timeLimitSeconds > 7200)
  )
    throw new Error('O tempo deve ficar entre 1 e 120 minutos.');
  if (config.mode === 'diagnostic' && (config.count < 5 || config.count > 10))
    throw new Error('O diagnóstico deve ter entre 5 e 10 questões.');
  const ids = new Set(practiceConcepts(data).map((concept) => concept.id));
  if (config.conceptIds.some((id) => !ids.has(id)))
    throw new Error('Um conceito não está mais disponível. Escolha o conteúdo novamente.');
}

/** One synchronous repository transaction applies evidence, errors and the concept review queue. */
function recordAttempt(
  data: AppData,
  session: PracticeSession,
  question: Question,
  selectedOptionId: string,
  confidence?: Confidence,
): AppData {
  const id = session.id + ':' + question.id;
  if (data.attempts.some((attempt) => attempt.id === id)) return data;
  if (!question.options.some((option) => option.id === selectedOptionId))
    throw new Error('Resposta inválida.');
  const now = new Date();
  const item = session.items.find((entry) => entry.question.id === question.id);
  const attempt: QuestionAttempt = {
    id,
    questionId: question.id,
    selectedOptionId,
    correct: selectedOptionId === question.correctOptionId,
    createdAt: now.toISOString(),
    practiceSessionId: session.id,
    assessmentContext: session.assessmentContext,
    conceptId: conceptId(question),
    topicId: question.topicId,
    difficulty: question.difficulty,
    level: questionLevel(question),
    confidence,
    academicStage: session.academicStage ?? 'UNKNOWN',
    responseTimeSeconds: item?.elapsedSeconds,
  };
  return applyQuestionAttempt(data, attempt, question, now);
}

function replaceSession(data: AppData, session: PracticeSession): AppData {
  const practice = data.practice ?? emptyState();
  return {
    ...data,
    practice: {
      ...practice,
      sessions: practice.sessions.map((item) => (item.id === session.id ? session : item)),
    },
  };
}
function finalize(data: AppData, session: PracticeSession): AppData {
  if (session.status === 'completed') return data;
  let next = data;
  const items = session.items.map((item) => {
    if (session.config.mode !== 'exam' || !item.selectedOptionId || item.attemptId) return item;
    next = recordAttempt(next, session, item.question, item.selectedOptionId, item.confidence);
    return { ...item, locked: true, attemptId: `${session.id}:${item.question.id}` };
  });
  const now = new Date().toISOString();
  const elapsedSeconds =
    session.config.mode === 'exam' && session.deadlineAt
      ? Math.min(
          session.config.timeLimitSeconds!,
          Math.max(0, Math.floor((Date.now() - Date.parse(session.startedAt)) / 1000)),
        )
      : session.elapsedSeconds;
  const completed = {
    ...session,
    items,
    elapsedSeconds,
    status: 'completed' as const,
    endedAt: now,
    updatedAt: now,
  };
  next = replaceSession(next, completed);
  if (!next.sessions.some((item) => item.id === session.id))
    next = {
      ...next,
      user: {
        ...next.user,
        minutes: next.user.minutes + Math.floor(elapsedSeconds / 60),
        weeklyMinutes: next.user.weeklyMinutes + Math.floor(elapsedSeconds / 60),
      },
      sessions: [
        ...next.sessions,
        {
          id: session.id,
          topicId: session.config.topicIds[0],
          startedAt: session.startedAt,
          endedAt: now,
          minutes: Math.floor(elapsedSeconds / 60),
        },
      ],
    };
  if (session.config.mode === 'exam')
    next = appendStudyEvent(next, {
      ...eventContext(
        next,
        'simulation:' + session.id,
        now,
        [...new Set(items.map((item) => conceptId(item.question)))],
        session.config.sourceIds,
      ),
      academicStage: session.academicStage ?? 'UNKNOWN',
      type: 'SIMULATION_COMPLETED',
      sessionId: session.id,
      answered: items.filter((item) => item.attemptId).length,
      total: items.length,
    });
  return next;
}

export function createPracticeService(
  repo: Repository,
  provider: PracticeContentProvider = localPracticeContentProvider,
) {
  function session(data: AppData, id: string) {
    const found = data.practice?.sessions.find((item) => item.id === id);
    if (!found) throw new Error('Esta sessão não está disponível neste espaço.');
    return found;
  }
  function edit(
    id: string,
    transform: (value: PracticeSession, data: AppData) => PracticeSession,
    allowPaused = false,
  ) {
    repo.update((data) => {
      const current = session(data, id);
      if (current.status === 'completed') return data;
      if (current.deadlineAt && Date.parse(current.deadlineAt) <= Date.now())
        return finalize(data, current);
      if (current.status === 'paused' && !allowPaused) return data;
      return replaceSession(data, {
        ...transform(current, data),
        updatedAt: new Date().toISOString(),
      });
    });
  }
  return {
    analyze(config: PracticeConfig) {
      return provider.analyze(repo.getSnapshot(), config);
    },
    async create(config: PracticeConfig) {
      const data = repo.getSnapshot();
      if (config.academicStage !== undefined && !isAcademicStage(config.academicStage))
        throw new Error('Etapa acadêmica inválida.');
      config = { ...config, academicStage: data.academicJourney?.stage ?? 'UNKNOWN' };
      validateConfig(data, config);
      const analysis = await provider.analyze(data, config);
      if (!analysis.questions.length)
        throw new Error(analysis.limitation ?? 'Nenhuma questão disponível para esta seleção.');
      if (config.mode === 'diagnostic' && analysis.questions.length < 5)
        throw new Error(
          'O diagnóstico precisa de pelo menos 5 questões disponíveis. Cadastre mais questões ou escolha outro conteúdo.',
        );
      const now = new Date().toISOString();
      const value: PracticeSession = {
        id: uid('practice'),
        academicStage: config.academicStage,
        specifications: questionSpecifications(data, {
          ...config,
          conceptIds: analysis.concepts.map((concept) => concept.id),
        }),
        assessmentContext: assessmentPlan(data, config.assessmentGoalId)?.context,
        config: { ...config, count: Math.min(config.count, analysis.questions.length) },
        status: 'active',
        startedAt: now,
        updatedAt: now,
        elapsedSeconds: 0,
        currentIndex: 0,
        pool: analysis.questions,
        items: [],
        masteryBefore: Object.fromEntries(
          analysis.concepts.map((concept) => [
            concept.id,
            estimateConceptMastery(data, concept.id).value,
          ]),
        ),
        sourceTitles: analysis.sources.map((source) => source.title),
        deadlineAt:
          config.mode === 'exam' && config.timeLimitSeconds
            ? new Date(Date.now() + config.timeLimitSeconds * 1000).toISOString()
            : undefined,
      };
      if (config.mode === 'exam') {
        while (value.items.length < value.config.count) {
          const question = nextPracticeQuestion(data, value);
          if (!question) break;
          value.items.push({ question });
        }
      } else {
        const question = nextPracticeQuestion(data, value);
        if (question) value.items.push({ question });
      }
      if (!value.items.length)
        throw new Error(
          'Nenhuma questão inicial está disponível para esta seleção. Escolha os conceitos anteriores do caso ou outro conteúdo.',
        );
      if (config.mode === 'exam') value.config.count = value.items.length;
      repo.update((current) => ({
        ...current,
        practice: {
          ...(current.practice ?? emptyState()),
          sessions: [
            ...(current.practice?.sessions ?? []).map((item) =>
              item.status === 'active' ? { ...item, status: 'paused' as const } : item,
            ),
            value,
          ],
        },
      }));
      return value;
    },
    select(id: string, optionId: string) {
      edit(id, (value) => {
        const current = value.items[value.currentIndex];
        if (
          current.locked ||
          current.attemptId ||
          !current.question.options.some((option) => option.id === optionId)
        )
          return value;
        return {
          ...value,
          items: value.items.map((item, index) =>
            index === value.currentIndex ? { ...item, selectedOptionId: optionId } : item,
          ),
        };
      });
    },
    lock(id: string) {
      edit(id, (value) => ({
        ...value,
        items: value.items.map((item, index) =>
          index === value.currentIndex && item.selectedOptionId ? { ...item, locked: true } : item,
        ),
      }));
    },
    answer(id: string, confidence: Confidence) {
      if (!['certain', 'unsure', 'guess'].includes(confidence))
        throw new Error('Escolha sua confiança na resposta.');
      repo.update((data) => {
        const value = session(data, id);
        if (value.status !== 'active' || value.config.mode === 'exam') return data;
        const item = value.items[value.currentIndex];
        if (!item.locked || !item.selectedOptionId || item.attemptId) return data;
        const next = recordAttempt(data, value, item.question, item.selectedOptionId, confidence);
        return replaceSession(next, {
          ...value,
          updatedAt: new Date().toISOString(),
          items: value.items.map((entry, index) =>
            index === value.currentIndex
              ? { ...entry, confidence, attemptId: `${id}:${entry.question.id}` }
              : entry,
          ),
        });
      });
    },
    move(id: string, index: number) {
      edit(id, (value) =>
        Number.isInteger(index) && index >= 0 && index < value.items.length
          ? { ...value, currentIndex: index }
          : value,
      );
    },
    flag(id: string) {
      edit(id, (value) => ({
        ...value,
        items: value.items.map((item, index) =>
          index === value.currentIndex ? { ...item, flagged: !item.flagged } : item,
        ),
      }));
    },
    advance(id: string) {
      repo.update((data) => {
        const value = session(data, id);
        if (
          value.status !== 'active' ||
          value.config.mode === 'exam' ||
          !value.items[value.currentIndex].attemptId
        )
          return data;
        if (value.currentIndex < value.items.length - 1)
          return replaceSession(data, { ...value, currentIndex: value.currentIndex + 1 });
        if (value.items.length >= value.config.count) return finalize(data, value);
        const question = nextPracticeQuestion(data, value);
        return question
          ? replaceSession(data, {
              ...value,
              items: [...value.items, { question }],
              currentIndex: value.items.length,
              updatedAt: new Date().toISOString(),
            })
          : finalize(data, value);
      });
    },
    pause(id: string) {
      edit(id, (value) => ({ ...value, status: 'paused' }));
    },
    resume(id: string) {
      edit(id, (value) => ({ ...value, status: 'active' }), true);
    },
    tick(id: string, seconds: number) {
      if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 30) return;
      edit(id, (value) =>
        value.status === 'active'
          ? {
              ...value,
              elapsedSeconds: value.elapsedSeconds + seconds,
              items: value.items.map((item, index) =>
                index === value.currentIndex && !item.attemptId
                  ? { ...item, elapsedSeconds: (item.elapsedSeconds ?? 0) + seconds }
                  : item,
              ),
            }
          : value,
      );
    },
    finish(id: string) {
      repo.update((data) => finalize(data, session(data, id)));
    },
  };
}
