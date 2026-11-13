/**
 * 날짜는 항상 'YYYY-MM-DD' 로컬 날짜 문자열(DateKey)로 다룬다.
 * 계산은 UTC 기준 "일 번호"로 바꿔서 하므로 서머타임·시간대 영향을 받지 않는다.
 */
export type DateKey = string;

const DAY_MS = 86_400_000;
export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Date 객체의 로컬 날짜를 DateKey로 */
export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 하루 시작 시각(dayStartHour)을 반영한 "오늘". 새벽 4시 설정이면 03:59까지는 어제. */
export function todayKey(dayStartHour = 0, now: Date = new Date()): DateKey {
  return toKey(new Date(now.getTime() - dayStartHour * 3_600_000));
}

/**
 * 다음 "하루"가 시작될 때까지 남은 시간(ms). 사용자 기기의 시계·시간대 기준.
 * dayStartHour가 4면 다음 날 새벽 4시까지, 0이면 다음 자정까지.
 */
export function msUntilNextDay(dayStartHour = 0, now: Date = new Date()): number {
  const shift = dayStartHour * 3_600_000;
  const shifted = new Date(now.getTime() - shift);
  const nextStart = new Date(shifted.getFullYear(), shifted.getMonth(), shifted.getDate() + 1);
  return nextStart.getTime() - shifted.getTime();
}

export function keyToDayNum(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function dayNumToKey(n: number): DateKey {
  const d = new Date(n * DAY_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function isValidKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && dayNumToKey(keyToDayNum(key)) === key;
}

export function addDays(key: DateKey, n: number): DateKey {
  return dayNumToKey(keyToDayNum(key) + n);
}

/** b - a (일) */
export function diffDays(a: DateKey, b: DateKey): number {
  return keyToDayNum(b) - keyToDayNum(a);
}

/** 0=일 ... 6=토 */
export function weekday(key: DateKey): number {
  return (keyToDayNum(key) + 4) % 7; // 1970-01-01은 목요일
}

/** start~end (양끝 포함) */
export function rangeKeys(start: DateKey, end: DateKey): DateKey[] {
  const out: DateKey[] = [];
  for (let n = keyToDayNum(start), e = keyToDayNum(end); n <= e; n++) out.push(dayNumToKey(n));
  return out;
}

export function parts(key: DateKey) {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

export const weekdayLabel = (key: DateKey) => WEEKDAY_LABELS[weekday(key)];

/** '11월 13일 (목)' */
export function formatLong(key: DateKey): string {
  const { m, d } = parts(key);
  return `${m}월 ${d}일 (${weekdayLabel(key)})`;
}

/** '11/13' */
export function formatShort(key: DateKey): string {
  const { m, d } = parts(key);
  return `${m}/${d}`;
}

export function monthStart(key: DateKey): DateKey {
  return key.slice(0, 8) + '01';
}

export function addMonths(key: DateKey, n: number): DateKey {
  const { y, m } = parts(key);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`;
}

export function daysInMonth(key: DateKey): number {
  return diffDays(monthStart(key), addMonths(key, 1));
}
