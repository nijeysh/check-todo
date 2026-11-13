import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CheckGrid } from '@/components/check-grid';
import { MonthNav } from '@/components/month-nav';
import { Button, PageTitle, ProgressBar, Screen, Section, T } from '@/components/ui';
import { useLayoutSize, useTheme } from '@/hooks/use-theme';
import { addDays, addMonths, monthStart, parts, rangeKeys, type DateKey } from '@/lib/date';
import { useActiveHabits, useAppData, useToday } from '@/lib/store';

export default function GridScreen() {
  const c = useTheme();
  const today = useToday();
  const habits = useActiveHabits();
  const { checks } = useAppData();
  const size = useLayoutSize();
  // null = "이번 달을 따라감". 달이 바뀌면 자동으로 새 달로 넘어간다
  const [pickedMonth, setPickedMonth] = useState<DateKey | null>(null);
  const month = pickedMonth ?? monthStart(today);
  const setMonth = (m: DateKey) => setPickedMonth(m === monthStart(today) ? null : m);

  const isCurrent = month === monthStart(today);
  const end = isCurrent ? today : addDays(addMonths(month, 1), -1);
  const days = rangeKeys(month, end);
  const { y, m } = parts(month);
  const earliest = habits.reduce((min, h) => (h.startDate < min ? h.startDate : min), today);

  return (
    <Screen header={<PageTitle eyebrow="칸을 눌러 지난 날도 고칠 수 있어요" title="체크표" />}>
      <Section style={{ paddingVertical: 20, gap: 16 }}>
        <MonthNav
          label={`${y}년 ${m}월`}
          onPrev={() => setMonth(addMonths(month, -1))}
          onNext={() => setMonth(addMonths(month, 1))}
          prevDisabled={month <= monthStart(earliest)}
          nextDisabled={isCurrent}
        />
        <View style={{ paddingHorizontal: 20 }}>
          {habits.length ? (
            <CheckGrid
              habits={habits}
              days={days}
              boxSize={size === 'phone' ? 28 : 26}
              nameWidth={size === 'phone' ? 92 : 160}
            />
          ) : (
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
              <T color="muted">아직 매일 하는 항목이 없어요</T>
              <Button title="항목 추가하기" kind="weak" size="sm" onPress={() => router.push('/habit/edit')} />
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 20 }}>
          <Legend color={c.accent} label="한 날" />
          <Legend color={c.boxEmpty} label="안 한 날" />
          <Legend color={c.boxOff} label="쉬는 날" />
        </View>
      </Section>

      {habits.length ? (
        <Section title={`${m}월에 얼마나 했을까요?`}>
          <View style={{ paddingHorizontal: 20, paddingVertical: 8, gap: 18 }}>
            {habits.map((h) => {
              const n = days.filter((k) => checks[h.id]?.[k]).length;
              return (
                <View key={h.id} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <T variant="label" numberOfLines={1} style={{ flex: 1 }}>
                      {h.emoji} {h.title}
                    </T>
                    <T variant="label" color="secondary">
                      {n}
                      <T variant="label" color="faint">
                        {' '}
                        / {days.length}일
                      </T>
                    </T>
                  </View>
                  <ProgressBar value={n / days.length} color={h.color} />
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: color }} />
      <T variant="caption" color="muted">
        {label}
      </T>
    </View>
  );
}
