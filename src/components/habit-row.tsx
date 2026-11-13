import { router } from 'expo-router';
import { View } from 'react-native';

import { CheckBox } from '@/components/check-box';
import { useToast } from '@/components/toast';
import { ListRow, T } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { addDays, diffDays, type DateKey } from '@/lib/date';
import { isDue, type HabitStats } from '@/lib/stats';
import { actions, useAppData, useHabitStats, useToday } from '@/lib/store';
import type { Habit } from '@/lib/types';

/** 현재 상태 한 줄 요약: 연속 중 / 며칠째 쉬는 중 */
export function statusLine(s: HabitStats, today: DateKey): string {
  if (s.currentStreak > 0) {
    const best =
      s.bestStreak > s.currentStreak ? ` · 최장 ${s.bestStreak}일` : s.currentStreak > 1 ? ' · 최장 기록 중' : '';
    return s.doneToday
      ? `🔥 ${s.currentStreak}일 연속${best}`
      : `🔥 ${s.currentStreak}일 연속 · 오늘 하면 ${s.currentStreak + 1}일`;
  }
  if (s.lastDone) {
    const since = diffDays(s.lastDone, today);
    return `${since - 1}일째 쉬는 중 · 오늘 하면 ${since}일 만에 다시`;
  }
  return '첫 칸을 채워보세요';
}

/** 연속 기록 배지 (브랜드 sub 색) */
export function StreakBadge({ days }: { days: number }) {
  const c = useTheme();
  return (
    <View style={{ backgroundColor: c.subSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <T variant="small" style={{ fontWeight: '700' }}>
        🔥 {days}
      </T>
    </View>
  );
}

/** 최근 7일 작은 칸 */
export function WeekStrip({ done, color, today }: { done: Record<DateKey, string>; color: string; today: DateKey }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((k) => (
        <View
          key={k}
          style={{ width: 8, height: 8, borderRadius: 2.5, backgroundColor: done[k] ? color : c.boxEmpty }}
        />
      ))}
    </View>
  );
}

/**
 * 지속 항목 한 줄. date를 주면 그날 기준으로 체크한다 (캘린더 일 보기).
 * 오늘이면 연속 상태를, 다른 날이면 그날 했는지를 보여준다. 미래 날짜는 체크할 수 없다.
 */
export function HabitRow({ habit, date }: { habit: Habit; date?: DateKey }) {
  const today = useToday();
  const day = date ?? today;
  const isToday = day === today;
  const { checks } = useAppData();
  const stats = useHabitStats(habit)!;
  const toast = useToast();
  const due = isDue(habit, day);
  const done = !!checks[habit.id]?.[day];
  const future = day > today;

  let sub: string;
  if (isToday) sub = due ? statusLine(stats, today) : '오늘은 쉬는 날이에요';
  else if (future) sub = due ? '아직 오지 않은 날이에요' : '쉬는 날이에요';
  else sub = done ? '이날 했어요' : due ? '이날은 못 했어요' : '쉬는 날이었어요';

  return (
    <ListRow
      onPress={() => router.push(`/habit/${habit.id}`)}
      left={
        <CheckBox
          size={30}
          checked={done}
          color={habit.color}
          off={!due}
          disabled={future}
          label={`${habit.title} ${isToday ? '오늘' : day} 체크`}
          onPress={() => {
            const f = actions.toggleCheck(habit.id, day);
            if (isToday) toast(f);
          }}
        />
      }
      title={`${habit.emoji ? habit.emoji + ' ' : ''}${habit.title}`}
      subtitle={
        <View style={{ gap: 6 }}>
          <T variant="small" color={isToday && stats.currentStreak > 0 ? 'secondary' : 'muted'} numberOfLines={1}>
            {sub}
          </T>
          {isToday ? <WeekStrip done={checks[habit.id] ?? {}} color={habit.color} today={today} /> : null}
        </View>
      }
      right={isToday && stats.currentStreak > 1 ? <StreakBadge days={stats.currentStreak} /> : undefined}
      chevron
    />
  );
}
