import type { DateKey } from './date';

export type Schedule = { type: 'daily' } | { type: 'weekdays'; days: number[] };

/** 예전 요일 설정: until(그날 포함)까지는 이 요일로 셌다 */
export interface PastSchedule {
  until: DateKey;
  schedule: Schedule;
}

/**
 * habit: 반복 항목 (매일 또는 고른 요일마다) → 연속일·끊긴 날 통계 대상
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
  /** 지금 요일 설정 */
  schedule: Schedule;
  /**
   * "오늘부터만 바꾸기"로 요일을 바꾼 이력 (until 오름차순).
   * 그날이 어떤 until 이하이면 그 요일로, 모두 지났으면 schedule로 센다.
   */
  pastSchedules?: PastSchedule[];
  /** 통계 계산 시작일 (단발성 할 일은 그 날짜) */
  startDate: DateKey;
  /** 반복 항목의 마지막 날 (그날까지 포함). 없으면 끝없이 계속 */
  endDate?: DateKey;
  /** 알림 시각 'HH:MM' (없으면 알림 없음). 지속 항목은 하는 날마다, 단발성은 그 날짜에 */
  reminder?: string;
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
  /** 하루 마무리 알림 시각 'HH:MM' (없으면 끔): "아직 N개 남았어요" */
  summaryTime?: string;
}

export interface AppData {
  version: 1;
  habits: Habit[];
  checks: CheckMap;
  settings: Settings;
}
