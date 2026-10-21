import type { AppData, Flashcard, QuestionAttempt, User } from '@/types/domain';
import { createAcademicService } from './academic';
import {
  applyQuestionAttempt,
  appendStudyEvent,
  eventContext,
  refreshMastery,
} from '@/features/study/events';
import { questionConceptId, synchronizeConcepts } from '@/features/study/concepts';
import { questionLevel } from '@/features/study/mastery';
import { studySources } from '@/features/study/practice';
import { createLearningService } from './learning';
import { createAssessmentService } from './assessments';
import { createTranscriptionService } from './transcription';
import type {
  FlashcardService,
  KnowledgeService,
  MaterialService,
  QuestionService,
  StudyService,
  Repository,
} from './contracts';
import { MockAIService } from './mockAI';
import { generatePlan, scheduleReview } from '@/features/study/engine';
import { addDays, localDate, uid } from '@/utils/date';
import { createWorkspaceServices } from './workspace';
import { createStudioService } from './studio';
import { createPracticeService } from './practice';
import { createMaterialAnalysisService } from './materialAnalysis';
import type { MaterialAnalysisTransport } from '@/types/materialAnalysis';
import type { AITutorTransport } from '@/types/aiTutor';
import { createAITutorService } from './aiTutor';
function activity(user: User, xp: number): User {
  const today = localDate();
  return {
    ...user,
    xp: user.xp + xp,
    lastStudyDate: today,
    streak:
      user.lastStudyDate === today
        ? user.streak
        : user.lastStudyDate === addDays(today, -1)
          ? user.streak + 1
          : 1,
  };
}
export function createServices(
  repo: Repository,
  options: {
    materialAnalysisTransport?: MaterialAnalysisTransport;
    aiTutorTransport?: AITutorTransport;
  } = {},
) {
  const materialService: MaterialService = {
    async list() {
      return repo.getSnapshot().materials;
    },
    async addNote(title, content, context) {
      if (!title.trim() || !content.trim()) throw new Error('Preencha título e anotação.');
      if (title.trim().length > 100 || content.trim().length > 10000)
        throw new Error('Anotação acima do limite permitido.');
      const snapshot = repo.getSnapshot();
      const subjectId = context?.subjectId ?? snapshot.subjects[0]?.id;
      const subject = snapshot.subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Selecione uma disciplina.');
      if (context?.folderId && !snapshot.folders?.some((f) => f.id === context.folderId))
        throw new Error('Pasta não encontrada.');
      const topicName = context?.topicName.trim() || title.trim();
      if (topicName.length > 100) throw new Error('O assunto deve ter até 100 caracteres.');
      const existing = snapshot.topics.find(
        (t) =>
          t.subjectId === subjectId &&
          t.name.toLocaleLowerCase('pt-BR') === topicName.toLocaleLowerCase('pt-BR'),
      );
      const topicId = existing?.id ?? uid('topic');
      const material: AppData['materials'][number] = {
        id: uid('note'),
        title: title.trim(),
        content: content.trim(),
        subjectId: subject.id,
        topicId,
        folderId: context?.folderId,
        createdAt: localDate(),
        pages: 1,
        type: 'Anotações',
        status: 'ready',
      };
      repo.update((data) => ({
        ...data,
        materials: [material, ...data.materials],
        topics: existing
          ? data.topics
          : [
              ...data.topics,
              {
                id: topicId,
                subjectId: subject.id,
                name: topicName,
                unit: subject.name,
                summary: content.trim(),
                keyPoints: [],
              },
            ],
        metrics: existing
          ? data.metrics
          : [...data.metrics, { topicId, mastery: 0, answered: 0, correct: 0 }],
      }));
      return material;
    },
  };
  const questionService: QuestionService = {
    async list(topicId) {
      return repo.getSnapshot().questions.filter((q) => !topicId || q.topicId === topicId);
    },
    async answer(questionId, selectedOptionId, attemptId) {
      const data = repo.getSnapshot();
      const previous = data.attempts.find((a) => a.id === attemptId);
      if (previous) return previous;
      const question = data.questions.find((q) => q.id === questionId);
      if (!question || !question.options.some((o) => o.id === selectedOptionId))
        throw new Error('Resposta inválida.');
      const now = new Date();
      const attempt: QuestionAttempt = {
        id: attemptId,
        questionId,
        selectedOptionId,
        correct: selectedOptionId === question.correctOptionId,
        createdAt: now.toISOString(),
        conceptId: questionConceptId(question),
        topicId: question.topicId,
        level: questionLevel(question),
        difficulty: question.difficulty,
        academicStage: data.academicJourney?.stage ?? 'UNKNOWN',
        questionSnapshot: question,
      };
      repo.update((current) => applyQuestionAttempt(current, attempt, question, now));
      return attempt;
    },
  };
  const flashcardService: FlashcardService = {
    async list(topicId) {
      return repo.getSnapshot().flashcards.filter((card) => !topicId || card.topicId === topicId);
    },
    async fromQuestion(questionId) {
      const data = repo.getSnapshot();
      const existing = data.flashcards.find((c) => c.sourceQuestionId === questionId);
      if (existing) return existing;
      const question = data.questions.find((q) => q.id === questionId);
      if (!question) throw new Error('Questão não encontrada.');
      const card: Flashcard = {
        id: uid('fc'),
        topicId: question.topicId,
        front: question.prompt,
        back: `${question.options.find((o) => o.id === question.correctOptionId)!.text}\n\n${question.explanation}`,
        dueAt: localDate(),
        intervalDays: 0,
        sourceQuestionId: questionId,
        conceptId: questionConceptId(question),
        sourceIds: question.sourceIds,
      };
      repo.update((current) => ({ ...current, flashcards: [...current.flashcards, card] }));
      return card;
    },
    async review(id, rating, operationId) {
      if (!['again', 'hard', 'good', 'easy'].includes(rating))
        throw new Error('Avaliação de cartão inválida.');
      const snapshot = repo.getSnapshot();
      const previousReview =
        operationId && snapshot.reviews.find((review) => review.id === operationId);
      if (previousReview) {
        if (previousReview.flashcardId !== id || previousReview.rating !== rating)
          throw new Error('O ID da revisão já foi usado para outra avaliação.');
        return;
      }
      const card = snapshot.flashcards.find((c) => c.id === id);
      if (!card) throw new Error('Card não encontrado.');
      const now = new Date();
      const reviewId = operationId ?? uid('review');
      const concept =
        card.conceptId ??
        snapshot.questions.find((q) => q.id === card.sourceQuestionId)?.conceptId ??
        card.topicId;
      const nextCard = { ...scheduleReview(card, rating, now), conceptId: concept };
      const event = {
        ...eventContext(
          snapshot,
          'review:' + reviewId,
          now.toISOString(),
          [concept],
          card.sourceIds,
        ),
        type: 'FLASHCARD_REVIEW' as const,
        reviewId,
        flashcardId: id,
        rating,
      };
      repo.update((data) => {
        const before = synchronizeConcepts({
          ...data,
          flashcards: data.flashcards.map((c) => (c.id === id ? { ...c, conceptId: concept } : c)),
        });
        let next = appendStudyEvent(
          {
            ...before,
            user: activity(data.user, 5),
            flashcards: before.flashcards.map((c) => (c.id === id ? nextCard : c)),
            reviews: [
              ...data.reviews,
              {
                id: reviewId,
                flashcardId: id,
                conceptId: concept,
                academicStage: event.academicStage,
                rating,
                createdAt: now.toISOString(),
                nextDueAt: nextCard.dueAt,
              },
            ],
          },
          event,
        );
        next = refreshMastery(next, before, concept, event, now, {
          correct: rating !== 'again',
          rating,
        });
        return next;
      });
    },
  };
  const knowledgeService: KnowledgeService = {
    async list() {
      return repo.getSnapshot().metrics;
    },
  };
  const studyService: StudyService = {
    async finish(topicId, startedAt, sourceIds = []) {
      if (!repo.getSnapshot().topics.some((topic) => topic.id === topicId))
        throw new Error('Assunto não encontrado.');
      if (!Number.isFinite(Date.parse(startedAt)) || Date.parse(startedAt) > Date.now())
        throw new Error('Horário de início inválido.');
      if (repo.getSnapshot().sessions.some((s) => s.startedAt === startedAt)) return;
      const sources = studySources(repo.getSnapshot());
      if (
        sourceIds.some(
          (id) => !sources.some((source) => source.id === id && source.topicIds.includes(topicId)),
        )
      )
        throw new Error('Escolha uma fonte deste assunto e deste espaço.');
      const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 60000));
      const sessionId = uid('session');
      const now = new Date().toISOString();
      repo.update((data) =>
        appendStudyEvent(
          {
            ...data,
            user: {
              ...activity(data.user, 20),
              minutes: data.user.minutes + minutes,
              weeklyMinutes: data.user.weeklyMinutes + minutes,
            },
            sessions: [
              ...data.sessions,
              {
                id: sessionId,
                topicId,
                startedAt,
                endedAt: now,
                minutes,
                academicStage: data.academicJourney?.stage ?? 'UNKNOWN',
                sourceIds,
              },
            ],
            metrics: data.metrics.map((m) =>
              m.topicId === topicId ? { ...m, lastStudiedAt: localDate() } : m,
            ),
          },
          {
            ...eventContext(
              data,
              `study:${sessionId}`,
              now,
              data.learning?.concepts
                .filter((c) => c.sourceIds.some((id) => sourceIds.includes(id)))
                .map((c) => c.id) ?? [],
              sourceIds,
            ),
            type: 'DOCUMENT_STUDIED',
            topicId,
            minutes,
            sessionId,
          },
        ),
      );
    },
    async plan(topicIds, minutes, examDate) {
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480)
        throw new Error('Informe de 5 a 480 minutos.');
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(examDate) ||
        localDate(new Date(`${examDate}T12:00:00`)) !== examDate ||
        examDate < localDate() ||
        examDate > addDays(localDate(), 60)
      )
        throw new Error('Informe uma data válida entre hoje e os próximos 60 dias.');
      const plan = {
        id: uid('plan'),
        title: 'Meu plano de revisão',
        examDate,
        dailyMinutes: minutes,
        blocks: generatePlan(repo.getSnapshot(), topicIds, minutes, examDate),
      };
      if (!plan.blocks.length) throw new Error('Selecione assuntos e pelo menos 5 minutos.');
      repo.update((data) => ({ ...data, plans: [...data.plans, plan] }));
      return plan;
    },
  };
  return {
    ...createWorkspaceServices(repo),
    academicService: createAcademicService(repo),
    learningService: createLearningService(repo),
    assessmentService: createAssessmentService(repo),
    transcriptionService: createTranscriptionService(repo),
    studioService: createStudioService(repo),
    practiceService: createPracticeService(repo),
    materialService,
    materialAnalysisService: createMaterialAnalysisService(repo, options.materialAnalysisTransport),
    questionService,
    flashcardService,
    knowledgeService,
    studyService,
    aiService: {
      conversation: (id: string) => repo.getSnapshot().conversations.find((c) => c.id === id),
      send: (input: Parameters<MockAIService['send']>[0]) => {
        if (repo.getSnapshot().workspace === 'personal')
          return createAITutorService(repo, options.aiTutorTransport).send(input);
        return new MockAIService(repo).send(input);
      },
    },
  };
}
