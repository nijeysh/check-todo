import type { DateKey } from './date';

export type Schedule = { type: 'daily' } | { type: 'weekdays'; days: number[] };

/**
 * habit: 매일(또는 요일마다) 계속하는 항목 → 연속일·끊긴 날 통계 대상
 * once:  그날 하루만 하는 할 일 → 그날 체크만 하고 통계에서 빠진다. startDate가 그 날짜
 * 예전에 저장된 데이터는 kind가 없으므로 habit으로 본다.
 */
export type HabitKind = 'habit' | 'once';

export interface Habit {
  id: string;
  kind?: HabitKind;
  title: string;
  emoji?: string;
  color: string;
  schedule: Schedule;
  /** 통계 계산 시작일 */
  startDate: DateKey;
  order: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** habitId → (날짜 → 체크한 시각 ISO) */
export type CheckMap = Record<string, Record<DateKey, string>>;

export interface Settings {
  /** 0~23. 이 시각 전까지는 전날로 취급 */
  dayStartHour: number;
  /** 0=일요일 시작, 1=월요일 시작 */
  weekStartsOn: 0 | 1;
  /** 사용자가 고른 테마 색 (없으면 기본 브랜드 색) */
  themeMain?: string;
  themeSub?: string;
}

export interface AppData {
  version: 1;
  habits: Habit[];
  checks: CheckMap;
  settings: Settings;
}
