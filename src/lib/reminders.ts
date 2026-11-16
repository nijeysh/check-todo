import { addDays, parts, type DateKey } from './date';
import { computeStats, isDue } from './stats';
import type { AppData, Habit } from './types';

/**
 * 알림 계획 (앱·웹 공통, 순수 함수).
 * 예약 알림은 울리는 순간 코드가 돌지 않아서 "아직 안 했을 때만"을 그때 판단할 수 없다.
 * 그래서 앞으로 며칠치를 날짜별로 계획하고, 이미 체크한 날은 빼 둔다.
 * 체크하거나 항목을 바꾸면 다시 계획해서 예약을 갈아끼운다.
 */
export interface PlannedReminder {
  id: string;
  date: Date;
  title: string;
  body: string;
}

/** iOS는 앱 하나당 예약 알림이 64개까지라 여유를 두고 자른다 */
export const MAX_SCHEDULED = 60;
export const PLAN_DAYS = 7;

export function isValidTime(t: string | undefined): t is string {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h < 24 && m < 60;
}

/** 알림 시각 표시 (24시간): '09:05' → '09:05' */
export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 하루(DateKey)의 'HH:MM'이 실제로 언제인지.
 * 하루 시작 시각이 새벽 4시인데 알림이 01:00이면, 그 "하루"의 새벽 1시 = 다음 달력 날짜 01:00.
 */
export function reminderDate(day: DateKey, time: string, dayStartHour: number): Date {
  const [h, m] = time.split(':').map(Number);
  const { y, m: mo, d } = parts(day);
  return new Date(y, mo - 1, d + (h < dayStartHour ? 1 : 0), h, m);
}

const habitTitle = (h: Habit) => `${h.emoji ? h.emoji + ' ' : ''}${h.title}`;

export function planReminders(data: AppData, today: DateKey, now: Date = new Date()): PlannedReminder[] {
  const { habits, checks, settings } = data;
  const out: PlannedReminder[] = [];
  const active = habits.filter((h) => !h.archivedAt && h.kind !== 'once');
  const once = habits.filter((h) => h.kind === 'once');

  for (let i = 0; i < PLAN_DAYS; i++) {
    const day = addDays(today, i);
    const dueHabits = active.filter((h) => h.startDate <= day && isDue(h, day));
    const dueOnce = once.filter((h) => h.startDate === day);

    // 항목별 알림
    for (const h of dueHabits) {
      if (!isValidTime(h.reminder) || checks[h.id]?.[day]) continue;
      let body = '오늘도 체크해 볼까요?';
      if (i === 0) {
        const s = computeStats(h, checks[h.id], today);
        if (s.currentStreak > 0) body = `🔥 ${s.currentStreak}일 연속 중이에요. 오늘도 이어가요!`;
        else if (s.lastDone) body = '오늘 하면 다시 시작이에요 💪';
      }
      out.push({
        id: `ctd-${h.id}-${day}`,
        date: reminderDate(day, h.reminder, settings.dayStartHour),
        title: habitTitle(h),
        body,
      });
    }
    for (const h of dueOnce) {
      if (!isValidTime(h.reminder) || checks[h.id]?.[day]) continue;
      out.push({
        id: `ctd-${h.id}-${day}`,
        date: reminderDate(day, h.reminder, settings.dayStartHour),
        title: `📌 ${habitTitle(h)}`,
        body: '오늘 하기로 한 일이에요',
      });
    }

    // 하루 마무리 알림: 그날 남은 할 일이 있을 때만
    if (isValidTime(settings.summaryTime)) {
      const left = [...dueHabits, ...dueOnce].filter((h) => !checks[h.id]?.[day]).length;
      if (left > 0) {
        out.push({
          id: `ctd-summary-${day}`,
          date: reminderDate(day, settings.summaryTime, settings.dayStartHour),
          title: '하루 마무리',
          body: i === 0 ? `오늘 할 일이 아직 ${left}개 남았어요` : `오늘 할 일 ${left}개, 체크했나요?`,
        });
      }
    }
  }

  return out
    .filter((r) => r.date.getTime() > now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED);
}
