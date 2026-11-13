import type { Palette } from '@/constants/theme';
import { diffDays, weekday, type DateKey } from '@/lib/date';
import type { HolidayMap } from '@/lib/holidays';

/** 일요일·공휴일은 빨강, 토요일은 파랑 */
export function dayNumberColor(date: DateKey, holidays: HolidayMap, c: Palette): string {
  const wd = weekday(date);
  if (wd === 0 || holidays[date]) return c.danger;
  if (wd === 6) return c.saturday;
  return c.text;
}

/** 오늘 / 어제 / 내일 / 3일 전 / 5일 후 */
export function relativeLabel(date: DateKey, today: DateKey): string {
  const d = diffDays(today, date);
  if (d === 0) return '오늘';
  if (d === -1) return '어제';
  if (d === 1) return '내일';
  return d < 0 ? `${-d}일 전` : `${d}일 후`;
}

/** 달성 비율 → 칸 배경 (0이면 회색, 높을수록 진한 파랑) */
export function ratioColor(done: number, total: number, c: Palette): string {
  if (!total || !done) return c.boxEmpty;
  const r = done / total;
  const alpha = Math.round((0.3 + 0.7 * r) * 255)
    .toString(16)
    .padStart(2, '0');
  return c.accent + alpha;
}
