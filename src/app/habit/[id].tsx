import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { MonthCalendar } from '@/components/month-calendar';
import { MonthNav } from '@/components/month-nav';
import { useToast } from '@/components/toast';
import { Button, Screen, Section, StatTile, T } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLayoutSize, useTheme } from '@/hooks/use-theme';
import { addMonths, diffDays, formatShort, monthStart, parts, type DateKey } from '@/lib/date';
import type { HabitStats } from '@/lib/stats';
import { actions, useAppData, useHabitStats, useToday } from '@/lib/store';

export default function HabitDetailScreen() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, checks, settings } = useAppData();
  const habit = habits.find((h) => h.id === id);
  const stats = useHabitStats(habit);
  const today = useToday();
  const toast = useToast();
  const size = useLayoutSize();
  // null = "이번 달을 따라감". 달이 바뀌면 자동으로 새 달로 넘어간다
  const [pickedMonth, setPickedMonth] = useState<DateKey | null>(null);
  const month = pickedMonth ?? monthStart(today);
  const setMonth = (m: DateKey) => setPickedMonth(m === monthStart(today) ? null : m);

  if (!habit || !stats) {
    return (
      <Screen>
        <T color="secondary">항목을 찾을 수 없어요.</T>
        <Button title="오늘로 돌아가기" kind="grey" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  // 단발성 할 일은 통계가 없으므로 편집 화면으로
  if (habit.kind === 'once') return <Redirect href={{ pathname: '/habit/edit', params: { id: habit.id } }} />;

  const { y, m } = parts(month);
  const comebacks = stats.runs.slice(1).map((r, i) => diffDays(stats.runs[i].end, r.start));
  const lastComeback = comebacks[comebacks.length - 1];
  const sinceLast = stats.lastDone ? diffDays(stats.lastDone, today) : 0;

  const headline =
    stats.currentStreak > 0
      ? `${stats.currentStreak}일째\n이어가고 있어요 🔥`
      : stats.lastDone
        ? `${sinceLast - 1}일째\n쉬고 있어요`
        : '아직\n시작 전이에요';
  const sub =
    stats.currentStreak > 0
      ? stats.doneToday
        ? stats.currentStreak >= stats.bestStreak && stats.currentStreak > 1
          ? '지금이 최장 기록이에요'
          : `최장 기록은 ${stats.bestStreak}일이에요`
        : `오늘 하면 ${stats.currentStreak + 1}일이 돼요`
      : stats.lastDone
        ? `오늘 하면 ${sinceLast}일 만에 다시 시작해요`
        : '오늘 첫 칸을 채워보세요';

  const wide = size === 'desktop';

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Button
              title="편집"
              kind="text"
              size="sm"
              onPress={() => router.push({ pathname: '/habit/edit', params: { id: habit.id } })}
            />
          ),
        }}
      />

      <View style={{ gap: 14, paddingVertical: Spacing.two }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: Radius.md,
              backgroundColor: habit.color + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <T style={{ fontSize: 18, lineHeight: 24 }}>{habit.emoji ?? '✓'}</T>
          </View>
          <T variant="bodyStrong" color="secondary" numberOfLines={1} style={{ flex: 1 }}>
            {habit.title}
          </T>
        </View>
        <T variant="display">{headline}</T>
        <T variant="body" color="secondary">
          {sub}
        </T>
        {habit.archivedAt ? (
          <T variant="small" color="danger">
            보관한 항목이에요
          </T>
        ) : null}
      </View>

      <Section>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingVertical: 8 }}>
          <StatTile label="최장 연속" value={stats.bestStreak} unit="일" />
          <StatTile label="총 달성" value={stats.totalDone} unit="일" />
          <StatTile label="달성률" value={Math.round(stats.rate * 100)} unit="%" tone={habit.color} />
          <StatTile label="끊긴 날" value={stats.missedDays} unit="일" hint={`${stats.breakCount}번 끊겼어요`} />
          <StatTile
            label="최근 다시 시작"
            value={lastComeback ?? '-'}
            unit={lastComeback ? '일 만에' : undefined}
            hint={
              comebacks.length
                ? `보통 ${Math.round(comebacks.reduce((a, b) => a + b, 0) / comebacks.length)}일 만에 돌아와요`
                : '아직 끊긴 적이 없어요'
            }
          />
        </View>
      </Section>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12, alignItems: 'flex-start' }}>
        <Section style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', paddingVertical: 20 }}>
          <View style={{ gap: 16, paddingHorizontal: 20 }}>
            <MonthNav
              label={`${y}년 ${m}월`}
              onPrev={() => setMonth(addMonths(month, -1))}
              onNext={() => setMonth(addMonths(month, 1))}
              nextDisabled={month >= monthStart(today)}
            />
            <MonthCalendar
              habit={habit}
              month={month}
              done={checks[habit.id] ?? {}}
              today={today}
              weekStartsOn={settings.weekStartsOn}
              onToggle={(k) => {
                const f = actions.toggleCheck(habit.id, k);
                if (k === today) toast(f);
              }}
            />
          </View>
        </Section>

        <Section
          title="연속 기록 흐름"
          caption="최근 기록부터 보여요"
          style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%' }}>
          <Timeline stats={stats} color={habit.color} c={c} />
        </Section>
      </View>
    </Screen>
  );
}

type Item =
  | { kind: 'run'; start: DateKey; end: DateKey; length: number; ongoing: boolean }
  | {
      kind: 'gap';
      start: DateKey;
      end: DateKey;
      days: number;
      leading: boolean;
      comebackAfter?: number;
      ongoing: boolean;
    };

/** 연속 구간과 공백을 최신순으로: "11/12~ 진행 중 2일 → 4일 공백 (5일 만에 다시) → ..." */
function Timeline({ stats, color, c }: { stats: HabitStats; color: string; c: ReturnType<typeof useTheme> }) {
  const [expanded, setExpanded] = useState(false);
  const items: Item[] = [
    ...stats.runs.map((r) => ({ kind: 'run' as const, ...r, ongoing: false })),
    ...stats.gaps.map((g) => ({ kind: 'gap' as const, ...g, ongoing: false })),
  ].sort((a, b) => (a.start < b.start ? 1 : -1));

  if (!items.length)
    return (
      <T color="muted" style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        아직 기록이 없어요
      </T>
    );

  // 진행 중 표시와 "며칠 만에 다시" 계산
  const first = items[0];
  first.ongoing = first.kind === 'run' ? stats.currentStreak > 0 : true;
  items.forEach((it, i) => {
    const newer = items[i - 1];
    const older = items[i + 1];
    if (it.kind === 'gap' && newer?.kind === 'run' && older?.kind === 'run')
      it.comebackAfter = diffDays(older.end, newer.start);
  });

  const maxLen = Math.max(...items.map((it) => (it.kind === 'run' ? it.length : it.days)), 1);
  const shown = expanded ? items : items.slice(0, 8);

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 8, gap: 16 }}>
      {shown.map((it) => {
        const len = it.kind === 'run' ? it.length : it.days;
        const range =
          it.start === it.end
            ? formatShort(it.start)
            : `${formatShort(it.start)} ~ ${it.ongoing ? '' : formatShort(it.end)}`;
        let label: string;
        if (it.kind === 'run') label = it.ongoing ? `🔥 ${len}일 연속 진행 중` : `${len}일 연속`;
        else if (it.leading) label = `시작 전 ${len}일`;
        else if (it.ongoing) label = `${len}일째 쉬는 중`;
        else label = `${len}일 쉬고 → ${it.comebackAfter}일 만에 다시`;
        return (
          <View key={it.kind + it.start} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two }}>
              <T variant="label" color={it.kind === 'run' ? undefined : 'muted'}>
                {label}
              </T>
              <T variant="small" color="faint">
                {range}
              </T>
            </View>
            <View
              style={{
                width: `${Math.max(4, (len / maxLen) * 100)}%`,
                height: 8,
                borderRadius: 4,
                backgroundColor: it.kind === 'run' ? color : c.boxEmpty,
              }}
            />
          </View>
        );
      })}
      {items.length > 8 ? (
        <Pressable onPress={() => setExpanded(!expanded)} style={{ alignSelf: 'center', paddingVertical: 4 }}>
          <T variant="label" color="muted">
            {expanded ? '접기' : `더 보기 (${items.length - 8}개)`}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}
