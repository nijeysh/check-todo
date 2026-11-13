import { addDays, diffDays, rangeKeys, weekday, type DateKey } from './date';
import type { Habit } from './types';

export interface Run {
  start: DateKey;
  end: DateKey;
  length: number;
}

export interface Gap {
  start: DateKey;
  end: DateKey;
  /** 비어 있던 대상일 수 */
  days: number;
  /** 첫 체크 이전의 공백 (끊긴 게 아니라 아직 시작 전) */
  leading: boolean;
}

export interface HabitStats {
  /** 현재 연속일. 오늘 아직 체크 전이면 어제까지 기준으로 유지 */
  currentStreak: number;
  bestStreak: number;
  totalDone: number;
  /** 시작일~어제 대상일 중 체크 안 한 날 */
  missedDays: number;
  /** 연속이 끊긴 횟수 (첫 체크 이전 공백은 제외) */
  breakCount: number;
  /** 달성률 0~1 (오늘은 체크했을 때만 분모에 포함) */
  rate: number;
  doneToday: boolean;
  lastDone?: DateKey;
  runs: Run[];
  gaps: Gap[];
}

type HabitLike = Pick<Habit, 'schedule' | 'startDate'>;
type DoneMap = Record<DateKey, unknown> | undefined;

export function isDue(habit: Pick<Habit, 'schedule'>, key: DateKey): boolean {
  return habit.schedule.type === 'daily' || habit.schedule.days.includes(weekday(key));
}

/** 체크 기록에서 모든 통계를 계산한다. 통계는 저장하지 않고 항상 여기서 다시 계산한다. */
export function computeStats(habit: HabitLike, done: DoneMap, today: DateKey): HabitStats {
  const doneKeys = Object.keys(done ?? {})
    .filter((k) => k <= today)
    .sort();
  const doneSet = new Set(doneKeys);
  // 시작일 이전에 체크한 기록이 있으면 그날부터 센다
  const start = doneKeys[0] && doneKeys[0] < habit.startDate ? doneKeys[0] : habit.startDate;

  const runs: Run[] = [];
  const gaps: Gap[] = [];
  let run: Run | null = null;
  let gap: Gap | null = null;
  let dueCount = 0;

  if (start <= today) {
    for (const key of rangeKeys(start, today)) {
      const isDone = doneSet.has(key);
      // 대상일이 아닌 날은 건너뛴다. 단 그날 체크했으면 달성으로 인정
      if (!isDue(habit, key) && !isDone) continue;

      if (isDone) {
        dueCount++;
        if (gap) {
          gaps.push(gap);
          gap = null;
        }
        if (run) {
          run.end = key;
          run.length++;
        } else {
          run = { start: key, end: key, length: 1 };
        }
      } else if (key !== today) {
        // 오늘 안 한 건 아직 끊긴 게 아니다
        dueCount++;
        if (run) {
          runs.push(run);
          run = null;
        }
        if (gap) {
          gap.end = key;
          gap.days++;
        } else {
          gap = { start: key, end: key, days: 1, leading: runs.length === 0 };
        }
      }
    }
  }
  if (run) runs.push(run);
  if (gap) gaps.push(gap);

  const last = runs[runs.length - 1];
  const lastGap = gaps[gaps.length - 1];
  // 마지막 연속 구간 뒤로 공백이 없으면 진행 중
  const currentStreak = last && (!lastGap || lastGap.start < last.start) ? last.length : 0;
  const totalDone = doneKeys.filter((k) => k >= start).length;

  return {
    currentStreak,
    bestStreak: runs.reduce((m, r) => Math.max(m, r.length), 0),
    totalDone,
    missedDays: gaps.reduce((s, g) => s + g.days, 0),
    breakCount: gaps.filter((g) => !g.leading).length,
    rate: dueCount ? totalDone / dueCount : 0,
    doneToday: doneSet.has(today),
    lastDone: doneKeys[doneKeys.length - 1],
    runs,
    gaps,
  };
}

export type CheckFeedback =
  | { kind: 'task' }
  | { kind: 'first' }
  | { kind: 'streak'; streak: number; best: boolean }
  | { kind: 'comeback'; afterDays: number; missed: number };

/**
 * `date`에 체크한 직후 보여줄 메시지를 만든다.
 * comeback.afterDays: 직전 체크일로부터 며칠 만인지 / missed: 그 사이 비어 있던 대상일 수
 */
export function feedbackFor(habit: HabitLike, doneBefore: DoneMap, date: DateKey): CheckFeedback {
  const before = doneBefore ?? {};
  const prev = Object.keys(before)
    .filter((k) => k < date)
    .sort()
    .pop();
  if (!prev) return { kind: 'first' };

  let missed = 0;
  for (let k = addDays(prev, 1); k < date; k = addDays(k, 1)) if (isDue(habit, k)) missed++;
  if (missed > 0) return { kind: 'comeback', afterDays: diffDays(prev, date), missed };

  const after = computeStats(habit, { ...before, [date]: true }, date);
  const current = after.runs.find((r) => r.start <= date && date <= r.end);
  const streak = current?.length ?? 1;
  // 이전 다른 구간의 최장 기록을 "막 넘어선 날"에만 갱신 메시지
  const bestOther = after.runs.filter((r) => r !== current).reduce((m, r) => Math.max(m, r.length), 0);
  return { kind: 'streak', streak, best: bestOther > 0 && streak === bestOther + 1 };
}

export function feedbackText(f: CheckFeedback): string {
  switch (f.kind) {
    case 'task':
      return '할 일 완료 ✅';
    case 'first':
      return '첫 체크! 시작이 반이에요 ✨';
    case 'comeback':
      return `${f.afterDays}일 만에 다시 시작했어요 💪`;
    case 'streak':
      if (f.best) return `🏆 ${f.streak}일 연속, 최장 기록 갱신!`;
      return f.streak > 1 ? `🔥 ${f.streak}일 연속!` : '오늘도 해냈어요 ✅';
  }
}
