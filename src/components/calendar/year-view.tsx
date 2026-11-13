import { Text, View } from 'react-native';

import { dayNumberColor } from '@/components/calendar/shared';
import { Section, T, Tap } from '@/components/ui';
import { Fonts, glyphNudge, textOn, type Palette } from '@/constants/theme';
import { useLayoutSize, useTheme } from '@/hooks/use-theme';
import { monthGridDates, useDaySummaries } from '@/lib/calendar';
import { addDays, parts, rangeKeys, WEEKDAY_LABELS, type DateKey } from '@/lib/date';
import type { HolidayMap } from '@/lib/holidays';
import { useAppData, useToday } from '@/lib/store';

/** 달성 비율 → 날짜 동그라미 배경과 숫자 색 (많이 한 날일수록 진하게) */
function heat(done: number, total: number, c: Palette): { bg: string; strong: boolean } {
  if (!total || !done) return { bg: 'transparent', strong: false };
  const r = done / total;
  const alpha = Math.round((0.18 + 0.82 * r) * 255)
    .toString(16)
    .padStart(2, '0');
  return { bg: c.accent + alpha, strong: r >= 0.6 };
}

/** 년 보기: 12달 미니 달력. 날짜 숫자 뒤 동그라미가 진할수록 그날 많이 한 것. 달을 누르면 월 보기로 */
export function YearView({
  cursor,
  holidays,
  onOpenMonth,
}: {
  cursor: DateKey;
  holidays: HolidayMap;
  onOpenMonth: (month: DateKey) => void;
}) {
  const c = useTheme();
  const today = useToday();
  const size = useLayoutSize();
  const { settings } = useAppData();
  const { y } = parts(cursor);
  const summaries = useDaySummaries(rangeKeys(`${y}-01-01`, `${y}-12-31`));
  const perRow = size === 'phone' ? 2 : size === 'tablet' ? 3 : 4;
  const fontSize = size === 'phone' ? 10 : 12;
  const dot = size === 'phone' ? 18 : 22;
  const labels = [...WEEKDAY_LABELS.slice(settings.weekStartsOn), ...WEEKDAY_LABELS.slice(0, settings.weekStartsOn)];

  return (
    <View style={{ gap: 12 }}>
      {/* 1~12월 카드 크기를 똑같이: 한 줄에 perRow개씩 같은 너비, 모든 달을 6주(42칸)로 */}
      {Array.from({ length: Math.ceil(12 / perRow) }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: 12 }}>
          {Array.from({ length: perRow }, (_, col) => {
            const i = row * perRow + col;
            if (i >= 12) return <View key={col} style={{ flex: 1 }} />;
            const month = `${y}-${String(i + 1).padStart(2, '0')}-01`;
            const dates = monthGridDates(month, settings.weekStartsOn);
            while (dates.length < 42) dates.push(addDays(dates[dates.length - 1], 1));
            const prefix = month.slice(0, 7);
            const isCurrent = today.startsWith(prefix);
            return (
              <Tap
                key={month}
                onPress={() => onOpenMonth(month)}
                pressedBg={false}
                accessibilityLabel={`${i + 1}월 보기`}
                style={{ flex: 1 }}>
                <Section style={{ paddingVertical: 14, paddingHorizontal: size === 'phone' ? 10 : 14, gap: 6 }}>
                  <T
                    variant="label"
                    color={isCurrent ? 'accent' : undefined}
                    style={{ fontWeight: '700', textAlign: 'center' }}>
                    {i + 1}월
                  </T>
                  {/* 요일 머리줄 */}
                  <View style={{ flexDirection: 'row' }}>
                    {labels.map((l) => (
                      <Text
                        key={l}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          fontFamily: Fonts.sans,
                          fontSize: fontSize - 1,
                          fontWeight: '600',
                          color: l === '일' ? c.danger : l === '토' ? c.saturday : c.textMuted,
                        }}>
                        {l}
                      </Text>
                    ))}
                  </View>
                  {Array.from({ length: dates.length / 7 }, (_, r) => (
                    <View key={r} style={{ flexDirection: 'row' }}>
                      {dates.slice(r * 7, r * 7 + 7).map((d) => {
                        if (!d.startsWith(prefix)) return <View key={d} style={{ flex: 1, aspectRatio: 1 }} />;
                        const s = summaries[d];
                        const isToday = d === today;
                        const h =
                          d > today ? { bg: 'transparent', strong: false } : heat(s?.done ?? 0, s?.total ?? 0, c);
                        return (
                          <View
                            key={d}
                            style={{ flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
                            {/* 동그라미는 칸 크기와 상관없이 글자에 맞춘 고정 크기 (넓은 화면에서 커지지 않게) */}
                            <View
                              style={{
                                width: dot,
                                height: dot,
                                borderRadius: dot / 2,
                                alignItems: 'center',
                                justifyContent: 'center',
                                // 오늘은 달성 색(파랑 단계)과 헷갈리지 않게 브랜드 sub 색으로 채운다
                                backgroundColor: isToday ? c.sub : h.bg,
                              }}>
                              <Text
                                style={{
                                  fontFamily: Fonts.sans,
                                  fontSize,
                                  ...glyphNudge(fontSize),
                                  fontWeight: isToday || h.strong ? '700' : '500',
                                  color: isToday
                                    ? textOn(c.sub)
                                    : h.strong
                                      ? c.onAccent
                                      : dayNumberColor(d, holidays, c),
                                  opacity: d > today ? 0.45 : 1,
                                }}>
                                {parts(d).d}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </Section>
              </Tap>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}>
        <T variant="caption" color="muted">
          적게
        </T>
        {[1, 2, 3, 4].map((n) => (
          <View key={n} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: heat(n, 4, c).bg }} />
        ))}
        <T variant="caption" color="muted">
          많이
        </T>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.sub, marginLeft: 8 }} />
        <T variant="caption" color="muted">
          오늘
        </T>
      </View>
    </View>
  );
}
