import { Pressable, View } from 'react-native';

import { T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, daysInMonth, monthStart, parts, weekday, WEEKDAY_LABELS, type DateKey } from '@/lib/date';
import { isDue } from '@/lib/stats';
import type { Habit } from '@/lib/types';

type Props = {
  habit: Habit;
  month: DateKey;
  done: Record<DateKey, string>;
  today: DateKey;
  weekStartsOn: 0 | 1;
  onToggle: (date: DateKey) => void;
};

/** 한 달 달력. 한 날은 항목 색으로 채운다. 날짜를 눌러 지난 기록을 고칠 수 있다 */
export function MonthCalendar({ habit, month, done, today, weekStartsOn, onToggle }: Props) {
  const c = useTheme();
  const first = monthStart(month);
  const lead = (weekday(first) - weekStartsOn + 7) % 7;
  const count = daysInMonth(first);
  const cells: (DateKey | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7) cells.push(null);
  const labels = [...WEEKDAY_LABELS.slice(weekStartsOn), ...WEEKDAY_LABELS.slice(0, weekStartsOn)];

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row' }}>
        {labels.map((l) => (
          <T key={l} variant="small" color="muted" style={{ flex: 1, textAlign: 'center' }}>
            {l}
          </T>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
          {cells.slice(r * 7, r * 7 + 7).map((k, i) => {
            if (!k) return <View key={i} style={{ flex: 1, aspectRatio: 1 }} />;
            const checked = !!done[k];
            const future = k > today;
            const beforeStart = k < habit.startDate && !checked;
            const off = !isDue(habit, k);
            return (
              <Pressable
                key={k}
                disabled={future}
                onPress={() => onToggle(k)}
                accessibilityLabel={`${k} ${checked ? '완료' : '미완료'}`}
                style={({ pressed }) => ({
                  flex: 1,
                  aspectRatio: 1,
                  maxHeight: 56,
                  borderRadius: Radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: checked ? habit.color : off || beforeStart ? c.boxOff : c.surfaceAlt,
                  borderWidth: k === today ? 2 : 0,
                  borderColor: habit.color,
                  opacity: future ? 0.35 : pressed ? 0.7 : 1,
                })}>
                <T
                  variant="small"
                  color={checked ? '#fff' : 'secondary'}
                  style={{ fontWeight: checked ? '700' : '500' }}>
                  {parts(k).d}
                </T>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
