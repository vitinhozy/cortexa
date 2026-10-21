import type { AppData } from '@/types/domain';
import { addDays, localDate } from '@/utils/date';

export function reconcilePersonalProgress(data: AppData, now = new Date()): AppData {
  if (data.workspace !== 'personal') return data;
  const today = localDate(now);
  const monday = addDays(today, -((now.getDay() + 6) % 7));
  const completed = data.sessions.filter((session) => session.endedAt);
  return {
    ...data,
    user: {
      ...data.user,
      minutes: completed.reduce((sum, session) => sum + session.minutes, 0),
      weeklyMinutes: completed
        .filter((session) => {
          const day = localDate(new Date(session.endedAt!));
          return day >= monday && day <= today;
        })
        .reduce((sum, session) => sum + session.minutes, 0),
      answered: data.attempts.length,
      correct: data.attempts.filter((attempt) => attempt.correct).length,
      streak:
        data.user.lastStudyDate && data.user.lastStudyDate >= addDays(today, -1)
          ? data.user.streak
          : 0,
    },
  };
}
