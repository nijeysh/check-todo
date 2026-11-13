import { Pressable, View } from 'react-native';

import { ratioColor, dayNumberColor } from '@/components/calendar/shared';
import { T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useLayoutSize, useTheme } from '@/hooks/use-theme';
import { monthGridDates, useDaySummaries } from '@/lib/calendar';
import { parts, WEEKDAY_LABELS, type DateKey } from '@/lib/date';
import type { HolidayMap } from '@/lib/holidays';
import { useAppData, useToday } from '@/lib/store';

/**
 * 월 보기: 칸마다 날짜, 공휴일 이름, 그날 한 항목(색 점), 그날만 할 일(막대)을 보여준다.
 * 칸을 누르면 그날이 선택된다.
 */
export function MonthView({
  cursor,
  holidays,
  onSelect,
}: {
  cursor: DateKey;
  holidays: HolidayMap;
  onSelect: (date: DateKey) => void;
}) {
  const c = useTheme();
  const today = useToday();
  const size = useLayoutSize();
  const { settings, checks } = useAppData();
  const dates = monthGridDates(cursor, settings.weekStartsOn);
  const summaries = useDaySummaries(dates);
  const curMonth = cursor.slice(0, 7);
  const labels = [...WEEKDAY_LABELS.slice(settings.weekStartsOn), ...WEEKDAY_LABELS.slice(0, settings.weekStartsOn)];
  const phone = size === 'phone';
  const cellH = phone ? 76 : 112;
  const maxBars = phone ? 1 : 3;

  return (
    <View>
      <View style={{ flexDirection: 'row', paddingBottom: 8 }}>
        {labels.map((l) => (
          <T
            key={l}
            variant="caption"
            color={l === '일' ? 'danger' : l === '토' ? c.saturday : 'muted'}
            style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>
            {l}
          </T>
        ))}
      </View>
      {Array.from({ length: dates.length / 7 }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.surfaceAlt }}>
          {dates.slice(r * 7, r * 7 + 7).map((date) => {
            const s = summaries[date];
            const inMonth = date.startsWith(curMonth);
            const selected = date === cursor;
            const isToday = date === today;
            const future = date > today;
            const holiday = holidays[date];
            const doneHabits = s.habits.filter((h) => checks[h.id]?.[date]);
            return (
              <Pressable
                key={date}
                onPress={() => onSelect(date)}
                accessibilityLabel={`${date}${holiday ? ' ' + holiday : ''} ${s.done}/${s.total}`}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: cellH,
                  paddingVertical: 6,
                  paddingHorizontal: phone ? 2 : 6,
                  gap: 3,
                  borderRadius: Radius.sm,
                  backgroundColor: selected ? c.accentSoft : pressed ? c.surfaceAlt : 'transparent',
                  opacity: inMonth ? 1 : 0.35,
                })}>
                <View style={{ alignItems: phone ? 'center' : 'flex-start' }}>
                  <View
                    style={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: 12,
                      paddingHorizontal: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isToday ? c.accent : 'transparent',
                    }}>
                    <T
                      variant="small"
                      color={isToday ? c.onAccent : dayNumberColor(date, holidays, c)}
                      style={{ fontWeight: isToday || selected ? '700' : '500' }}>
                      {parts(date).d}
                    </T>
                  </View>
                </View>
                {holiday ? (
                  <T
                    variant="caption"
                    color="danger"
                    numberOfLines={1}
                    style={{ fontSize: phone ? 9 : 11, textAlign: phone ? 'center' : 'left' }}>
                    {holiday}
                  </T>
                ) : null}
                {/* 그날 한 지속 항목: 색 점 */}
                {doneHabits.length ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 2,
                      justifyContent: phone ? 'center' : 'flex-start',
                    }}>
                    {doneHabits.slice(0, phone ? 4 : 8).map((h) => (
                      <View key={h.id} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: h.color }} />
                    ))}
                  </View>
                ) : null}
                {/* 그날만 할 일: 막대 */}
                {s.once.slice(0, maxBars).map((t) => {
                  const done = !!checks[t.id]?.[date];
                  return (
                    <View
                      key={t.id}
                      style={{
                        backgroundColor: done ? c.surfaceAlt : c.subSoft,
                        borderRadius: 4,
                        paddingHorizontal: 3,
                        paddingVertical: 1,
                      }}>
                      <T
                        variant="caption"
                        numberOfLines={1}
                        color={done ? 'faint' : undefined}
                        style={{ fontSize: phone ? 9 : 11, textDecorationLine: done ? 'line-through' : 'none' }}>
                        {t.title}
                      </T>
                    </View>
                  );
                })}
                {s.once.length > maxBars ? (
                  <T variant="caption" color="muted" style={{ fontSize: 9, textAlign: phone ? 'center' : 'left' }}>
                    +{s.once.length - maxBars}
                  </T>
                ) : null}
                {/* 지난 날 달성률 막대 (데스크톱) */}
                {!phone && !future && s.total ? (
                  <View style={{ marginTop: 'auto', height: 4, borderRadius: 2, backgroundColor: c.boxEmpty }}>
                    <View
                      style={{
                        width: `${(s.done / s.total) * 100}%`,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: ratioColor(s.done, s.total, c),
                      }}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
