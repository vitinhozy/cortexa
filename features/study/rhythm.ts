import type { AppData } from '@/types/domain';
import { addDays, localDate } from '@/utils/date';
import type { StudyCalendarDay } from '@/types/insights';

function activityDates(data: AppData) {
  return new Set(
    [
      ...data.sessions.filter((item) => item.endedAt).map((item) => item.endedAt!),
      ...data.attempts.map((item) => item.createdAt),
      ...data.reviews.map((item) => item.createdAt),
    ]
      .filter((date) => Number.isFinite(Date.parse(date)))
      .map((date) => localDate(new Date(date))),
  );
}

export function studyWeek(data: AppData, today = localDate()) {
  const dates = activityDates(data);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    return { date, active: dates.has(date), today: date === today };
  });
}

export function shiftStudyMonth(month: string, offset: number) {
  const [year, index] = month.split('-').map(Number);
  return localDate(new Date(year, index - 1 + offset, 1, 12)).slice(0, 7);
}

export function studyMonth(data: AppData, month: string, today = localDate()): StudyCalendarDay[] {
  const first = `${month}-01`;
  const start = new Date(`${first}T12:00:00`);
  const leading = (start.getDay() + 6) % 7;
  const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const dates = activityDates(data);
  return Array.from({ length: Math.ceil((leading + days) / 7) * 7 }, (_, index) => {
    const date = addDays(first, index - leading);
    const inMonth = date.startsWith(month);
    return { date, inMonth, active: inMonth && dates.has(date), today: date === today };
  });
}
