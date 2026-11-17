import { router } from 'expo-router';
import { View } from 'react-native';

import { CheckGrid } from '@/components/check-grid';
import { DayChecklist } from '@/components/day-checklist';
import { Button, ProgressBar, Screen, Section, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLayoutSize, useTheme } from '@/hooks/use-theme';
import { formatLong, monthStart, parts, rangeKeys } from '@/lib/date';
import { isDue } from '@/lib/stats';
import { useActiveHabits, useAppData, useOnceTasks, useToday } from '@/lib/store';

export default function TodayScreen() {
  const c = useTheme();
  const today = useToday();
  const habits = useActiveHabits();
  const onceTasks = useOnceTasks(today);
  const { checks } = useAppData();
  const size = useLayoutSize();

  // 진행률은 오늘 해야 하는 지속 항목 + 오늘만 할 일 모두
  const due = [...habits.filter((h) => isDue(h, today)), ...onceTasks];
  const doneCount = due.filter((h) => checks[h.id]?.[today]).length;
  const left = due.length - doneCount;

  const headline = !due.length
    ? habits.length
      ? '오늘은\n쉬는 날이에요 😌'
      : '오늘 할 일을\n추가해 볼까요?'
    : left === 0
      ? '오늘 할 일을\n모두 끝냈어요 🎉'
      : `오늘 할 일이\n${left}개 남았어요`;

  const header = (
    <View style={{ gap: 14, paddingTop: Spacing.two, paddingBottom: Spacing.two }}>
      <T variant="label" color="muted">
        {formatLong(today)}
      </T>
      <T variant="display">{headline}</T>
      {due.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={doneCount / due.length} color={left === 0 ? c.sub : undefined} />
          </View>
          <T variant="small" color="secondary" style={{ fontWeight: '600' }}>
            {doneCount}/{due.length}
          </T>
        </View>
      ) : null}
    </View>
  );

  const list = <DayChecklist date={today} />;

  // 데스크톱: 왼쪽 오늘 리스트 + 오른쪽 이번 달 체크표
  if (size === 'desktop' && habits.length) {
    const { m } = parts(today);
    return (
      <Screen header={header}>
        <View style={{ flexDirection: 'row', gap: Spacing.four, alignItems: 'flex-start' }}>
          <View style={{ width: 440 }}>{list}</View>
          <Section
            title={`${m}월 체크표`}
            caption="칸을 눌러 지난 날도 고칠 수 있어요"
            style={{ flex: 1, paddingBottom: 20 }}
            right={<Button title="전체 기록" kind="text" size="sm" onPress={() => router.push('/grid')} />}>
            <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
              <CheckGrid habits={habits} days={rangeKeys(monthStart(today), today)} nameWidth={150} />
            </View>
          </Section>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={header} maxWidth={640}>
      {list}
    </Screen>
  );
}
