import { router } from 'expo-router';
import { useEffect, useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { CheckBox } from '@/components/check-box';
import { useToast } from '@/components/toast';
import { T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parts, weekday, weekdayLabel, type DateKey } from '@/lib/date';
import { isDue } from '@/lib/stats';
import { actions, useAppData, useToday } from '@/lib/store';
import type { Habit } from '@/lib/types';

type Props = {
  habits: Habit[];
  days: DateKey[];
  boxSize?: number;
  nameWidth?: number;
};

/**
 * 종이 체크표처럼 행=항목, 열=날짜인 네모 칸 표.
 * 지난 날짜도 눌러서 체크/해제할 수 있다. 미래 날짜는 누를 수 없다.
 */
export function CheckGrid({ habits, days, boxSize = 26, nameWidth = 120 }: Props) {
  const c = useTheme();
  const today = useToday();
  const { checks } = useAppData();
  const toast = useToast();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const gap = 6;
  const col = boxSize + gap;
  const rowH = boxSize + 12;

  // 처음에는 오른쪽 끝(최근 날짜)이 보이도록
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 0);
    return () => clearTimeout(t);
  }, [days.length]);

  if (!habits.length) return null;

  return (
    <View style={{ flexDirection: 'row' }}>
      {/* 항목명 열 (고정) */}
      <View style={{ width: nameWidth }}>
        <View style={{ height: 40 }} />
        {habits.map((h) => (
          <Pressable
            key={h.id}
            onPress={() => router.push(`/habit/${h.id}`)}
            style={{ height: rowH, justifyContent: 'center', paddingRight: Spacing.two }}>
            <T variant="label" color="secondary" numberOfLines={1}>
              {h.emoji ? `${h.emoji} ` : ''}
              {h.title}
            </T>
          </Pressable>
        ))}
      </View>

      {/* 날짜 칸 (가로 스크롤) */}
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        <View>
          <View style={{ flexDirection: 'row', height: 40 }}>
            {days.map((k) => {
              const { m, d } = parts(k);
              const wd = weekday(k);
              const isToday = k === today;
              return (
                <View
                  key={k}
                  style={{ width: col, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 }}>
                  <T
                    variant="small"
                    style={{ fontSize: 10 }}
                    color={wd === 0 ? c.danger : wd === 6 ? c.saturday : 'muted'}>
                    {d === 1 ? `${m}월` : weekdayLabel(k)}
                  </T>
                  <View
                    style={{
                      minWidth: 22,
                      height: 20,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isToday ? c.accent : 'transparent',
                    }}>
                    <T
                      variant="caption"
                      style={{ fontWeight: isToday ? '700' : '500' }}
                      color={isToday ? c.onAccent : 'secondary'}>
                      {d}
                    </T>
                  </View>
                </View>
              );
            })}
          </View>
          {habits.map((h) => {
            const done = checks[h.id] ?? {};
            return (
              <View key={h.id} style={{ flexDirection: 'row', height: rowH, alignItems: 'center' }}>
                {days.map((k) => (
                  <View key={k} style={{ width: col, alignItems: 'center' }}>
                    <CheckBox
                      size={boxSize}
                      checked={!!done[k]}
                      color={h.color}
                      off={!isDue(h, k)}
                      highlight={k === today}
                      disabled={k > today}
                      ghost={false}
                      label={`${h.title} ${k}`}
                      onPress={() => {
                        const f = actions.toggleCheck(h.id, k);
                        if (k === today) toast(f);
                      }}
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
