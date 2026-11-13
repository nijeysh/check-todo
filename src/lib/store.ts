import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useSyncExternalStore } from 'react';

import { BRAND } from '@/constants/theme';

import { addDays, todayKey, type DateKey } from './date';
import { computeStats, feedbackFor, type CheckFeedback } from './stats';
import type { AppData, Habit, Settings } from './types';

/**
 * 로컬 저장소 (v1: 로그인 없음).
 * 웹은 localStorage, iOS/Android는 기기 내부 저장소에 저장된다 (AsyncStorage가 알아서 처리).
 */
const STORAGE_KEY = 'checktodo:v1';

/**
 * 체크 칸 색 (팬톤 Coated 색의 화면용 근사값).
 * 순서대로 새 항목에 하나씩 돌아가며 기본값으로 쓰인다.
 */
export const HABIT_COLORS = [
  { hex: '#0072CE', name: '파랑', pantone: 'PANTONE 285 C' },
  { hex: '#00BF6F', name: '초록', pantone: 'PANTONE 7480 C' },
  { hex: '#FFC72C', name: '노랑', pantone: 'PANTONE 123 C' },
  { hex: '#EF3340', name: '빨강', pantone: 'PANTONE Red 032 C' },
  { hex: '#753BBD', name: '보라', pantone: 'PANTONE 2665 C' },
  { hex: '#E31C79', name: '분홍', pantone: 'PANTONE 213 C' },
  { hex: '#00A499', name: '청록', pantone: 'PANTONE 3272 C' },
  { hex: '#FF6A13', name: '주황', pantone: 'PANTONE 1585 C' },
  { hex: '#41B6E6', name: '하늘', pantone: 'PANTONE 298 C' },
  { hex: '#78BE20', name: '연두', pantone: 'PANTONE 368 C' },
  { hex: '#0047BB', name: '남색', pantone: 'PANTONE 2728 C' },
  { hex: '#75787B', name: '회색', pantone: 'PANTONE Cool Gray 9 C' },
] as const;

const DEFAULT_DATA: AppData = {
  version: 1,
  habits: [],
  checks: {},
  settings: { dayStartHour: 0, weekStartsOn: 0 },
};

let state: AppData = DEFAULT_DATA;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function set(next: AppData) {
  state = next;
  emit();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) => console.warn('save failed', e));
}

export async function hydrate() {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('load failed', e);
  }
  hydrated = true;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppData() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

/** 하루 시작 시각을 반영한 오늘. 앱을 켜 둔 채 날짜가 바뀌어도 1분 안에 갱신된다 */
let today = todayKey(0);
const todayListeners = new Set<() => void>();
function refreshToday() {
  const next = todayKey(state.settings.dayStartHour);
  if (next !== today) {
    today = next;
    todayListeners.forEach((l) => l());
  }
}
listeners.add(refreshToday);
setInterval(refreshToday, 60_000);

export function useToday(): DateKey {
  return useSyncExternalStore(
    (l) => {
      todayListeners.add(l);
      return () => todayListeners.delete(l);
    },
    () => today,
    () => today,
  );
}

export const isOnce = (h: Pick<Habit, 'kind'>) => h.kind === 'once';

/** 계속하는 항목(지속)만. 단발성 할 일은 기록표·통계에서 빠진다 */
export function useActiveHabits(): Habit[] {
  const { habits } = useAppData();
  return useMemo(() => habits.filter((h) => !h.archivedAt && !isOnce(h)).sort((a, b) => a.order - b.order), [habits]);
}

/** 그날 하루만 하는 할 일 */
export function useOnceTasks(date: DateKey): Habit[] {
  const { habits } = useAppData();
  return useMemo(
    () => habits.filter((h) => isOnce(h) && h.startDate === date).sort((a, b) => a.order - b.order),
    [habits, date],
  );
}

export function useHabitStats(habit: Habit | undefined) {
  const { checks } = useAppData();
  const today = useToday();
  return useMemo(() => (habit ? computeStats(habit, checks[habit.id], today) : undefined), [habit, checks, today]);
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nowIso = () => new Date().toISOString();

export type HabitInput = Pick<Habit, 'title' | 'emoji' | 'color' | 'schedule' | 'startDate'> & Pick<Habit, 'kind'>;

/** 단발성 할 일 기본 색 = 브랜드 main 색 */
export const ONCE_COLOR = BRAND.main;

/** 새 항목의 기본 색: 지금 있는 항목 수에 따라 팔레트를 돌아가며 */
export function nextHabitColor(): string {
  const used = state.habits.filter((h) => !h.archivedAt && !isOnce(h)).length;
  return HABIT_COLORS[used % HABIT_COLORS.length].hex;
}

export const actions = {
  addHabit(input: HabitInput): string {
    const id = newId();
    const order = state.habits.reduce((m, h) => Math.max(m, h.order), -1) + 1;
    const habit: Habit = { ...input, id, order, createdAt: nowIso(), updatedAt: nowIso() };
    set({ ...state, habits: [...state.habits, habit] });
    return id;
  },

  /** 단발성 할 일 빠른 추가 */
  addOnce(title: string, date: DateKey, color: string = ONCE_COLOR): string {
    return actions.addHabit({ kind: 'once', title, color, schedule: { type: 'daily' }, startDate: date });
  },

  updateHabit(id: string, patch: Partial<HabitInput>) {
    set({
      ...state,
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...patch, updatedAt: nowIso() } : h)),
    });
  },

  setArchived(id: string, archived: boolean) {
    set({
      ...state,
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, archivedAt: archived ? nowIso() : undefined, updatedAt: nowIso() } : h,
      ),
    });
  },

  deleteHabit(id: string) {
    const { [id]: _removed, ...checks } = state.checks;
    set({ ...state, habits: state.habits.filter((h) => h.id !== id), checks });
  },

  moveHabit(id: string, dir: -1 | 1) {
    const list = state.habits.filter((h) => !h.archivedAt).sort((a, b) => a.order - b.order);
    const i = list.findIndex((h) => h.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const a = list[i];
    const b = list[j];
    set({
      ...state,
      habits: state.habits.map((h) =>
        h.id === a.id ? { ...h, order: b.order } : h.id === b.id ? { ...h, order: a.order } : h,
      ),
    });
  },

  /** 체크/해제. 체크한 경우 보여줄 피드백을 돌려준다 */
  toggleCheck(habitId: string, date: DateKey): CheckFeedback | null {
    const habit = state.habits.find((h) => h.id === habitId);
    if (!habit) return null;
    const current = state.checks[habitId] ?? {};
    if (current[date]) {
      const { [date]: _removed, ...rest } = current;
      set({ ...state, checks: { ...state.checks, [habitId]: rest } });
      return null;
    }
    const feedback: CheckFeedback = isOnce(habit) ? { kind: 'task' } : feedbackFor(habit, current, date);
    set({ ...state, checks: { ...state.checks, [habitId]: { ...current, [date]: nowIso() } } });
    return feedback;
  },

  updateSettings(patch: Partial<Settings>) {
    set({ ...state, settings: { ...state.settings, ...patch } });
  },

  exportJson(): string {
    return JSON.stringify(state, null, 2);
  },

  importJson(raw: string) {
    const data = JSON.parse(raw) as AppData;
    if (data?.version !== 1 || !Array.isArray(data.habits) || typeof data.checks !== 'object') {
      throw new Error('CHECKTODO 백업 파일 형식이 아니에요');
    }
    set({ ...DEFAULT_DATA, ...data });
  },

  resetAll() {
    set({ ...DEFAULT_DATA, settings: state.settings });
  },

  /** 화면 확인용 예시 데이터 */
  loadSample() {
    const today = todayKey(state.settings.dayStartHour);
    const start = addDays(today, -45);
    const samples: [string, string, number][] = [
      // 제목, 이모지, 하루 달성 확률
      ['물 2L 마시기', '💧', 0.85],
      ['영어 단어 20개', '📚', 0.6],
      ['스트레칭 10분', '🧘', 0.45],
      ['일기 쓰기', '✍️', 0.7],
    ];
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const habits: Habit[] = [];
    const checks: AppData['checks'] = {};
    samples.forEach(([title, emoji, p], i) => {
      const id = newId() + i;
      habits.push({
        id,
        title,
        emoji,
        color: HABIT_COLORS[i].hex,
        schedule: { type: 'daily' },
        startDate: start,
        order: i,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      checks[id] = {};
      for (let k = start; k < today; k = addDays(k, 1)) if (rand() < p) checks[id][k] = nowIso();
    });
    ['택배 반품 보내기', '치과 예약 전화'].forEach((title, i) => {
      habits.push({
        id: newId() + 'o' + i,
        kind: 'once',
        title,
        color: ONCE_COLOR,
        schedule: { type: 'daily' },
        startDate: today,
        order: samples.length + i,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    });
    set({ ...state, habits, checks });
  },
};
