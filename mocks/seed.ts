import type { AppData, Flashcard, StudyMaterial } from '@/types/domain';
import { topics, subjects } from './topics';
import { questions } from './questions';
import { addDays, localDate } from '@/utils/date';
export function createSeed(): AppData {
  const today = localDate();
  const flashcards: Flashcard[] = topics.map((topic, index) => ({
    id: `fc-${index}`,
    topicId: topic.id,
    front:
      index === 0
        ? 'Qual é o principal mecanismo compensatório da acidose metabólica?'
        : `O que você precisa lembrar sobre ${topic.name.toLowerCase()}?`,
    back: index === 0 ? 'Hiperventilação com redução da PaCO₂.' : topic.keyPoints.join('\n\n'),
    dueAt: today,
    intervalDays: 0,
  }));
  flashcards.push({
    id: 'fc-7',
    topicId: 'acid',
    front: 'Qual é a primeira etapa ao interpretar uma gasometria?',
    back: 'Avaliar o pH. Depois, identificar o componente primário e verificar a compensação.',
    dueAt: today,
    intervalDays: 0,
  });
  const materials: StudyMaterial[] = [
    {
      id: 'renal-pdf',
      title: 'Fisiologia Renal.pdf',
      subjectId: 'physiology',
      topicId: 'filtration',
      type: 'PDF',
      pages: 42,
      createdAt: addDays(today, -3),
      status: 'ready',
    },
    {
      id: 'acid-slides',
      title: 'Aula 07 — Equilíbrio ácido-base',
      subjectId: 'physiology',
      topicId: 'acid',
      type: 'Slides',
      pages: 28,
      createdAt: addDays(today, -2),
      status: 'ready',
    },
    {
      id: 'exam-n1',
      title: 'Prova N1 — Fisiologia',
      subjectId: 'physiology',
      topicId: 'acid',
      type: 'Prova',
      pages: 8,
      createdAt: addDays(today, -1),
      status: 'ready',
    },
    {
      id: 'renal-notes',
      title: 'Resumo Renal',
      subjectId: 'physiology',
      topicId: 'raas',
      type: 'Anotações',
      pages: 3,
      createdAt: today,
      status: 'ready',
    },
  ];
  return {
    version: 1,
    user: {
      id: 'demo-victor',
      name: 'Victor',
      course: 'Medicina',
      semester: 5,
      university: 'Universidade demonstrativa',
      goal: 'Dominar Fisiologia Renal',
      xp: 1240,
      streak: 7,
      minutes: 324,
      answered: 85,
      correct: 62,
      weeklyMinutes: 132,
      weeklyGoal: 180,
      lastStudyDate: addDays(today, -1),
    },
    topics,
    subjects,
    materials,
    questions,
    attempts: [],
    flashcards,
    reviews: [],
    sessions: [],
    plans: [],
    conversations: [],
    exams: [
      {
        id: 'exam-renal',
        title: 'Fisiologia Renal',
        subjectId: 'physiology',
        date: addDays(today, 6),
        topicIds: topics.map((t) => t.id),
      },
    ],
    metrics: topics.map((topic, index) => ({
      topicId: topic.id,
      mastery: [42, 51, 63, 91, 88, 81, 76][index],
      answered: [24, 18, 12, 28, 21, 14, 16][index],
      correct: [10, 9, 8, 26, 18, 11, 12][index],
      lastStudiedAt: addDays(today, -index - 1),
    })),
    mistakes: [
      {
        id: 'mistake-demo',
        attemptId: 'attempt-demo',
        questionId: 'q-acid-1',
        topicId: 'acid',
        createdAt: addDays(today, -1),
        selectedOptionId: 'A',
        correctOptionId: 'B',
        probableCause: questions[0].probableCause,
      },
    ],
    preferences: { notifications: false, dailyReminder: true },
  };
}
