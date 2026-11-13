import { View } from 'react-native';

import { dayNumberColor } from '@/components/calendar/shared';
import { Icon } from '@/components/icon';
import { Section, T, Tap } from '@/components/ui';
import { Radius, glyphNudge } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDaySummaries, weekStart } from '@/lib/calendar';
import { addDays, parts, weekdayLabel, type DateKey } from '@/lib/date';
import type { HolidayMap } from '@/lib/holidays';
import { useAppData, useToday } from '@/lib/store';

/** 주 보기: 하루에 한 줄. 누르면 그날의 일 보기로 */
export function WeekView({
  cursor,
  holidays,
  onOpenDay,
}: {
  cursor: DateKey;
  holidays: HolidayMap;
  onOpenDay: (date: DateKey) => void;
}) {
  const c = useTheme();
  const today = useToday();
  const { settings, checks } = useAppData();
  const start = weekStart(cursor, settings.weekStartsOn);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const summaries = useDaySummaries(dates);

  return (
    <Section style={{ paddingVertical: 6 }}>
      {dates.map((date) => {
        const s = summaries[date];
        const isToday = date === today;
        const future = date > today;
        const holiday = holidays[date];
        return (
          <Tap
            key={date}
            onPress={() => onOpenDay(date)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: Radius.md,
            }}>
            <View style={{ width: 40, alignItems: 'center', gap: 2 }}>
              <T variant="caption" color={dayNumberColor(date, holidays, c)} style={{ fontWeight: '600' }}>
                {weekdayLabel(date)}
              </T>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? c.accent : 'transparent',
                }}>
                <T
                  variant="heading"
                  color={isToday ? c.onAccent : dayNumberColor(date, holidays, c)}
                  style={glyphNudge(19)}>
                  {parts(date).d}
                </T>
              </View>
            </View>

            <View style={{ flex: 1, gap: 6 }}>
              {holiday ? (
                <T variant="caption" color="danger" style={{ fontWeight: '600' }}>
                  {holiday}
                </T>
              ) : null}
              {s.habits.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {s.habits.map((h) => (
                    <View
                      key={h.id}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 5,
                        backgroundColor: checks[h.id]?.[date] ? h.color : future ? c.boxOff : c.boxEmpty,
                      }}
                    />
                  ))}
                </View>
              ) : null}
              {s.once.map((t) => {
                const done = !!checks[t.id]?.[date];
                return (
                  <T
                    key={t.id}
                    variant="small"
                    numberOfLines={1}
                    color={done ? 'faint' : 'secondary'}
                    style={{ textDecorationLine: done ? 'line-through' : 'none' }}>
                    📌 {t.title}
                  </T>
                );
              })}
              {!s.total && !holiday ? (
                <T variant="small" color="faint">
                  할 일 없음
                </T>
              ) : null}
            </View>

            {s.total ? (
              <T variant="label" color={s.done === s.total && !future ? 'accent' : 'muted'}>
                {s.done}/{s.total}
              </T>
            ) : null}
            <Icon name="chevronRight" size={18} color={c.textFaint} />
          </Tap>
        );
      })}
    </Section>
  );
}
