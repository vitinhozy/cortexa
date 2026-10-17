import type { AppData, Flashcard, QuestionAttempt, User } from '@/types/domain';
import type {
  AuthService,
  FlashcardService,
  KnowledgeService,
  MaterialService,
  QuestionService,
  StudyService,
  Repository,
} from './contracts';
import { LocalRepository } from './repository';
import { MockAIService } from './mockAI';
import { generatePlan, scheduleReview } from '@/features/study/engine';
import { addDays, localDate, uid } from '@/utils/date';
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
export function createServices(repo: Repository) {
  const authService: AuthService = {
    async currentUser() {
      return repo.getSnapshot().user;
    },
  };
  const materialService: MaterialService = {
    async list() {
      return repo.getSnapshot().materials;
    },
    async addNote(title, content) {
      if (!title.trim() || !content.trim()) throw new Error('Preencha título e anotação.');
      const material: AppData['materials'][number] = {
        id: uid('note'),
        title: title.trim(),
        content: content.trim(),
        subjectId: 'physiology',
        topicId: 'acid',
        createdAt: localDate(),
        pages: 1,
        type: 'Anotações',
        status: 'ready',
      };
      repo.update((data) => ({ ...data, materials: [material, ...data.materials] }));
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
      const attempt: QuestionAttempt = {
        id: attemptId,
        questionId,
        selectedOptionId,
        correct: selectedOptionId === question.correctOptionId,
        createdAt: new Date().toISOString(),
      };
      repo.update((current) => ({
        ...current,
        attempts: [...current.attempts, attempt],
        user: {
          ...activity(current.user, attempt.correct ? 15 : 5),
          answered: current.user.answered + 1,
          correct: current.user.correct + Number(attempt.correct),
        },
        metrics: current.metrics.map((m) =>
          m.topicId === question.topicId
            ? {
                ...m,
                mastery: Math.max(0, Math.min(100, m.mastery + (attempt.correct ? 3 : -4))),
                answered: m.answered + 1,
                correct: m.correct + Number(attempt.correct),
                lastStudiedAt: localDate(),
              }
            : m,
        ),
        mistakes: attempt.correct
          ? current.mistakes
          : [
              {
                id: uid('mistake'),
                attemptId,
                questionId,
                topicId: question.topicId,
                createdAt: attempt.createdAt,
                selectedOptionId,
                correctOptionId: question.correctOptionId,
                probableCause: question.probableCause,
              },
              ...current.mistakes,
            ],
      }));
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
      };
      repo.update((current) => ({ ...current, flashcards: [...current.flashcards, card] }));
      return card;
    },
    async review(id, rating) {
      const card = repo.getSnapshot().flashcards.find((c) => c.id === id);
      if (!card) throw new Error('Card não encontrado.');
      const next = scheduleReview(card, rating);
      repo.update((data) => ({
        ...data,
        user: activity(data.user, 5),
        flashcards: data.flashcards.map((c) => (c.id === id ? next : c)),
        reviews: [
          ...data.reviews,
          {
            id: uid('review'),
            flashcardId: id,
            rating,
            createdAt: new Date().toISOString(),
            nextDueAt: next.dueAt,
          },
        ],
        metrics: data.metrics.map((m) =>
          m.topicId === card.topicId
            ? {
                ...m,
                mastery: Math.max(0, Math.min(100, m.mastery + (rating === 'again' ? -2 : 1))),
                lastStudiedAt: localDate(),
              }
            : m,
        ),
      }));
    },
  };
  const knowledgeService: KnowledgeService = {
    async list() {
      return repo.getSnapshot().metrics;
    },
  };
  const studyService: StudyService = {
    async finish(topicId, startedAt) {
      if (repo.getSnapshot().sessions.some((s) => s.startedAt === startedAt)) return;
      const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 60000));
      repo.update((data) => ({
        ...data,
        user: {
          ...activity(data.user, 20),
          minutes: data.user.minutes + minutes,
          weeklyMinutes: data.user.weeklyMinutes + minutes,
        },
        sessions: [
          ...data.sessions,
          { id: uid('session'), topicId, startedAt, endedAt: new Date().toISOString(), minutes },
        ],
        metrics: data.metrics.map((m) =>
          m.topicId === topicId ? { ...m, lastStudiedAt: localDate() } : m,
        ),
      }));
    },
    async plan(topicIds, minutes, examDate) {
      const plan = {
        id: uid('plan'),
        title: 'Revisão de Fisiologia Renal',
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
    authService,
    materialService,
    questionService,
    flashcardService,
    knowledgeService,
    studyService,
    aiService: new MockAIService(repo),
  };
}
export const repository = new LocalRepository();
export const services = createServices(repository);
