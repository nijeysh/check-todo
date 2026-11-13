import { useMemo } from 'react';

import { addDays, monthStart, parts, rangeKeys, weekday, type DateKey } from './date';
import { isDue } from './stats';
import { isOnce, useAppData } from './store';
import type { CheckMap, Habit } from './types';

/** 그날 보여줄 지속 항목: 시작일 이후의 대상일 (또는 그날 체크한 기록이 있는 항목) */
export function habitsForDate(habits: Habit[], checks: CheckMap, date: DateKey): Habit[] {
  return habits.filter((h) => !!checks[h.id]?.[date] || (h.startDate <= date && isDue(h, date)));
}

export interface DaySummary {
  date: DateKey;
  habits: Habit[];
  once: Habit[];
  done: number;
  total: number;
}

/** 달력 칸에 쓸 날짜별 요약 (지속 항목 + 그날의 단발성 할 일) */
export function useDaySummaries(dates: DateKey[]): Record<DateKey, DaySummary> {
  const { habits, checks } = useAppData();
  const key = dates.length ? dates[0] + dates[dates.length - 1] : '';
  return useMemo(() => {
    const active = habits.filter((h) => !h.archivedAt && !isOnce(h)).sort((a, b) => a.order - b.order);
    const onceByDate: Record<DateKey, Habit[]> = {};
    for (const h of habits) if (isOnce(h)) (onceByDate[h.startDate] ??= []).push(h);
    const out: Record<DateKey, DaySummary> = {};
    for (const date of dates) {
      const hs = habitsForDate(active, checks, date);
      const once = (onceByDate[date] ?? []).sort((a, b) => a.order - b.order);
      const all = [...hs, ...once];
      out[date] = { date, habits: hs, once, done: all.filter((h) => checks[h.id]?.[date]).length, total: all.length };
    }
    return out;
    // dates는 key로 대표된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, checks, key]);
}

/** 그 주의 첫날 */
export function weekStart(date: DateKey, weekStartsOn: 0 | 1): DateKey {
  return addDays(date, -((weekday(date) - weekStartsOn + 7) % 7));
}

/** 달력 그리드에 들어갈 날짜들 (앞뒤 달 포함, 7의 배수) */
export function monthGridDates(month: DateKey, weekStartsOn: 0 | 1): DateKey[] {
  const first = monthStart(month);
  const start = weekStart(first, weekStartsOn);
  const { y, m } = parts(first);
  const nextMonth = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`;
  const last = addDays(nextMonth, -1);
  const end = addDays(weekStart(last, weekStartsOn), 6);
  return rangeKeys(start, end);
}
