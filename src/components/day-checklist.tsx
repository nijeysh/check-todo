import { router } from 'expo-router';
import { View } from 'react-native';

import { HabitRow } from '@/components/habit-row';
import { Icon } from '@/components/icon';
import { OnceQuickAdd, OnceTaskRow } from '@/components/once-task';
import { Button, ListRow, Section, T } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { habitsForDate } from '@/lib/calendar';
import type { DateKey } from '@/lib/date';
import { actions, useActiveHabits, useAppData, useOnceTasks, useToday } from '@/lib/store';

/**
 * 하루치 체크 목록: "루틴" + "할 일".
 * 오늘 화면과 캘린더 일 보기가 같이 쓴다.
 */
export function DayChecklist({ date }: { date: DateKey }) {
  const c = useTheme();
  const today = useToday();
  const all = useActiveHabits();
  const { checks } = useAppData();
  // 오늘: 기간이 끝난 항목은 빼고, 시작 전인 항목은 "며칠 뒤 시작"으로 보여준다
  const habits =
    date === today ? all.filter((h) => !h.endDate || h.endDate >= today) : habitsForDate(all, checks, date);
  const onceTasks = useOnceTasks(date);
  const isToday = date === today;
  const past = date < today;

  return (
    <View style={{ gap: 12 }}>
      <Section title="루틴" caption={isToday ? '정한 요일마다 체크하면 연속 기록이 쌓여요' : undefined}>
        {habits.map((h) => (
          <HabitRow key={h.id} habit={h} date={date} />
        ))}
        {habits.length === 0 && all.length === 0 ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
            <T color="secondary">하는 날마다 네모 칸을 채우면 연속일, 끊긴 날, 며칠 만에 다시 했는지 알려드려요.</T>
            <Button
              title="예시로 둘러보기"
              kind="grey"
              size="sm"
              style={{ alignSelf: 'flex-start' }}
              onPress={actions.loadSample}
            />
          </View>
        ) : habits.length === 0 ? (
          <T color="muted" style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            이날 할 루틴이 없어요
          </T>
        ) : null}
        {isToday ? (
          <ListRow
            onPress={() => router.push('/habit/edit')}
            left={
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: c.accentSoft,
                }}>
                <Icon name="plus" size={20} color={c.accentInk} />
              </View>
            }
            title="루틴 추가"
            titleColor="accent"
          />
        ) : null}
      </Section>

      <Section
        title="할 일"
        caption={isToday ? '그날 하루만 체크하고 끝나요' : undefined}>
        {onceTasks.map((t) => (
          <OnceTaskRow key={t.id} task={t} date={date} />
        ))}
        {past && onceTasks.length === 0 ? (
          <T color="muted" style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            이날 할 일은 없었어요
          </T>
        ) : null}
        {past ? null : <OnceQuickAdd date={date} placeholder={isToday ? '할 일 추가' : '이날 할 일 미리 추가'} />}
      </Section>
    </View>
  );
}
