import { subjectCatalog } from '@/constants/subjects';
import type { AppData } from '@/types/domain';

export function createPersonalWorkspace(userId = 'local'): AppData {
  return {
    version: 1,
    workspace: 'personal',
    folders: [],
    user: {
      id: userId,
      name: 'Estudante',
      course: 'Medicina',
      semester: 1,
      university: '',
      goal: '',
      dailyMinutes: 30,
      subjectIds: [],
      onboardingComplete: false,
      xp: 0,
      streak: 0,
      minutes: 0,
      answered: 0,
      correct: 0,
      weeklyMinutes: 0,
      weeklyGoal: 150,
    },
    subjects: subjectCatalog.map((subject) => ({ ...subject })),
    topics: [],
    materials: [],
    questions: [],
    attempts: [],
    flashcards: [],
    reviews: [],
    sessions: [],
    exams: [],
    plans: [],
    metrics: [],
    conversations: [],
    mistakes: [],
    preferences: { notifications: false, dailyReminder: false },
  };
}
