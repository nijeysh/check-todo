import { View } from 'react-native';

import { ratioColor } from '@/components/calendar/shared';
import { Section, T, Tap } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useLayoutSize, useTheme } from '@/hooks/use-theme';
import { monthGridDates, useDaySummaries } from '@/lib/calendar';
import { parts, rangeKeys, type DateKey } from '@/lib/date';
import type { HolidayMap } from '@/lib/holidays';
import { useAppData, useToday } from '@/lib/store';

/** 년 보기: 12달을 한눈에. 많이 한 날일수록 진한 파랑. 달을 누르면 월 보기로 */
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

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {Array.from({ length: 12 }, (_, i) => {
          const month = `${y}-${String(i + 1).padStart(2, '0')}-01`;
          const dates = monthGridDates(month, settings.weekStartsOn);
          const prefix = month.slice(0, 7);
          const isCurrent = today.startsWith(prefix);
          return (
            <Tap
              key={month}
              onPress={() => onOpenMonth(month)}
              pressedBg={false}
              style={{ flexBasis: `${100 / perRow - 4}%`, flexGrow: 1 }}>
              <Section style={{ padding: 14, gap: 8 }}>
                <T variant="label" color={isCurrent ? 'accent' : undefined} style={{ fontWeight: '700' }}>
                  {i + 1}월
                </T>
                <View style={{ gap: 3 }}>
                  {Array.from({ length: dates.length / 7 }, (_, r) => (
                    <View key={r} style={{ flexDirection: 'row', gap: 3 }}>
                      {dates.slice(r * 7, r * 7 + 7).map((d) => {
                        const inMonth = d.startsWith(prefix);
                        const s = summaries[d];
                        return (
                          <View
                            key={d}
                            style={{
                              flex: 1,
                              aspectRatio: 1,
                              borderRadius: Radius.sm / 2,
                              backgroundColor: !inMonth
                                ? 'transparent'
                                : d > today
                                  ? c.boxOff
                                  : ratioColor(s?.done ?? 0, s?.total ?? 0, c),
                              borderWidth: inMonth && (d === today || holidays[d]) ? 1.5 : 0,
                              borderColor: d === today ? c.text : c.danger,
                            }}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </Section>
            </Tap>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}>
        <T variant="caption" color="muted">
          적게
        </T>
        {[0, 1, 2, 3, 4].map((n) => (
          <View key={n} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: ratioColor(n, 4, c) }} />
        ))}
        <T variant="caption" color="muted">
          많이
        </T>
      </View>
    </View>
  );
}
