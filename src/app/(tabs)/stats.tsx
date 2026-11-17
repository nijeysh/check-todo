import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { statusLine } from '@/components/habit-row';
import { Button, ListRow, PageTitle, Screen, Section, StatTile, T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { computeStats } from '@/lib/stats';
import { useActiveHabits, useAppData, useToday } from '@/lib/store';

export default function StatsScreen() {
  const today = useToday();
  const habits = useActiveHabits();
  const { checks } = useAppData();

  const rows = useMemo(
    () => habits.map((h) => ({ habit: h, stats: computeStats(h, checks[h.id], today) })),
    [habits, checks, today],
  );
  const avgRate = rows.length ? rows.reduce((s, r) => s + r.stats.rate, 0) / rows.length : 0;
  const top = rows.reduce<(typeof rows)[number] | null>(
    (best, r) => (!best || r.stats.currentStreak > best.stats.currentStreak ? r : best),
    null,
  );
  const totalDone = rows.reduce((s, r) => s + r.stats.totalDone, 0);

  if (!rows.length) {
    return (
      <Screen header={<PageTitle title="통계" />}>
        <Section>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 32 }}>
            <T color="muted">루틴을 추가하면 여기에 통계가 보여요</T>
            <Button title="루틴 추가하기" kind="weak" size="sm" onPress={() => router.push('/habit/edit')} />
          </View>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen header={<PageTitle eyebrow="지금까지 평균 달성률" title={`${Math.round(avgRate * 100)}% 해냈어요`} />}>
      <Section>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingVertical: 8 }}>
          <StatTile
            label="가장 긴 진행 중 연속"
            value={top?.stats.currentStreak ?? 0}
            unit="일"
            hint={top && top.stats.currentStreak ? top.habit.title : undefined}
          />
          <StatTile label="지금까지 채운 칸" value={totalDone} unit="칸" />
        </View>
      </Section>

      <Section title="루틴별">
        {rows.map(({ habit: h, stats: s }) => (
          <ListRow
            key={h.id}
            onPress={() => router.push(`/habit/${h.id}`)}
            left={
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: Radius.md,
                  backgroundColor: h.color + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <T style={{ fontSize: 20, lineHeight: 26 }}>{h.emoji ?? '✓'}</T>
              </View>
            }
            title={h.title}
            subtitle={
              <View style={{ gap: 2 }}>
                <T variant="small" color="secondary" numberOfLines={1}>
                  {statusLine(s, today, h)}
                </T>
                <T variant="caption" color="muted" numberOfLines={1}>
                  최장 {s.bestStreak}일 · 끊긴 날 {s.missedDays}일 · 끊긴 횟수 {s.breakCount}번
                </T>
              </View>
            }
            right={
              <T variant="heading" color={h.color}>
                {Math.round(s.rate * 100)}%
              </T>
            }
            chevron
          />
        ))}
      </Section>
    </Screen>
  );
}
