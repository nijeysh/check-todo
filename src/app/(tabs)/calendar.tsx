import { useState } from 'react';
import { View } from 'react-native';

import { MonthView } from '@/components/calendar/month-view';
import { relativeLabel } from '@/components/calendar/shared';
import { WeekView } from '@/components/calendar/week-view';
import { YearView } from '@/components/calendar/year-view';
import { DayChecklist } from '@/components/day-checklist';
import { IconButton } from '@/components/month-nav';
import { Segmented } from '@/components/segmented';
import { Button, Screen, Section, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLayoutSize } from '@/hooks/use-theme';
import { monthGridDates, weekStart } from '@/lib/calendar';
import { addDays, addMonths, formatShort, parts, weekdayLabel, type DateKey } from '@/lib/date';
import { useHolidays } from '@/lib/holidays';
import { useAppData, useToday } from '@/lib/store';

type CalView = 'day' | 'week' | 'month' | 'year';
const VIEWS = [
  ['day', '일'],
  ['week', '주'],
  ['month', '월'],
  ['year', '년'],
] as const;

/** 같은 날짜(일)를 유지하며 달을 옮긴다. 31일 → 다음 달 30일처럼 넘치면 그 달 마지막 날 */
function shiftMonths(date: DateKey, n: number): DateKey {
  const first = addMonths(date, n);
  const lastDay = parts(addDays(addMonths(first, 1), -1)).d;
  return `${first.slice(0, 8)}${String(Math.min(parts(date).d, lastDay)).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const today = useToday();
  const size = useLayoutSize();
  const { settings } = useAppData();
  const [view, setView] = useState<CalView>('month');
  // null = "오늘을 따라감". 켜 둔 채 날짜가 바뀌면 자동으로 새 오늘로 넘어간다
  const [picked, setPicked] = useState<DateKey | null>(null);
  const cursor = picked ?? today;
  const setCursor = (next: DateKey | ((cur: DateKey) => DateKey)) =>
    setPicked((p) => {
      const n = typeof next === 'function' ? next(p ?? today) : next;
      return n === today ? null : n;
    });

  const { y, m, d } = parts(cursor);
  const ws = weekStart(cursor, settings.weekStartsOn);
  const we = addDays(ws, 6);

  // 화면에 걸친 연도의 공휴일
  const span =
    view === 'month'
      ? (() => {
          const g = monthGridDates(cursor, settings.weekStartsOn);
          return [g[0], g[g.length - 1]];
        })()
      : view === 'week'
        ? [ws, we]
        : [cursor, cursor];
  const years = [...new Set(span.map((k) => parts(k).y))];
  const { holidays, status } = useHolidays(years);

  const title =
    view === 'day'
      ? `${m}월 ${d}일 ${weekdayLabel(cursor)}요일`
      : view === 'week'
        ? `${formatShort(ws)} – ${formatShort(we)}`
        : view === 'month'
          ? `${y}년 ${m}월`
          : `${y}년`;

  const step = (dir: -1 | 1) => {
    // 빠르게 여러 번 눌러도 한 칸씩 정확히 움직이도록 이전 값 기준으로 계산
    if (view === 'day') setCursor((cur) => addDays(cur, dir));
    else if (view === 'week') setCursor((cur) => addDays(cur, 7 * dir));
    else if (view === 'month') setCursor((cur) => shiftMonths(cur, dir));
    else setCursor((cur) => shiftMonths(cur, 12 * dir));
  };

  const inCurrentPeriod =
    view === 'day'
      ? cursor === today
      : view === 'week'
        ? ws <= today && today <= we
        : view === 'month'
          ? cursor.slice(0, 7) === today.slice(0, 7)
          : cursor.slice(0, 4) === today.slice(0, 4);

  const eyebrow =
    view === 'day'
      ? [relativeLabel(cursor, today), holidays[cursor]].filter(Boolean).join(' · ')
      : view === 'week'
        ? `${y}년 ${parts(ws).m}월`
        : undefined;

  const header = (
    <View style={{ gap: 14, paddingTop: Spacing.two }}>
      <View style={{ gap: 4 }}>
        {eyebrow ? (
          <T variant="label" color={holidays[cursor] && view === 'day' ? 'danger' : 'muted'}>
            {eyebrow}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T variant="title" style={{ flex: 1 }} numberOfLines={1}>
            {title}
          </T>
          {inCurrentPeriod ? null : <Button title="오늘" kind="grey" size="sm" onPress={() => setCursor(today)} />}
          <IconButton icon="chevronLeft" label="이전" onPress={() => step(-1)} />
          <IconButton icon="chevronRight" label="다음" onPress={() => step(1)} />
        </View>
      </View>
      <Segmented options={VIEWS} value={view} onChange={setView} />
      {status === 'error' ? (
        <T variant="caption" color="muted">
          공휴일 정보를 불러오지 못했어요. 주말 색만 표시해요.
        </T>
      ) : null}
    </View>
  );

  const openDay = (date: DateKey) => {
    setCursor(date);
    setView('day');
  };

  if (view === 'day') {
    return (
      <Screen header={header} maxWidth={640}>
        <DayChecklist date={cursor} />
      </Screen>
    );
  }

  if (view === 'week') {
    return (
      <Screen header={header} maxWidth={720}>
        <WeekView cursor={cursor} holidays={holidays} onOpenDay={openDay} />
      </Screen>
    );
  }

  if (view === 'year') {
    return (
      <Screen header={header}>
        <YearView
          cursor={cursor}
          holidays={holidays}
          onOpenMonth={(month) => {
            setCursor(month.slice(0, 7) === today.slice(0, 7) ? today : month);
            setView('month');
          }}
        />
      </Screen>
    );
  }

  // 월 보기: 달력 + 선택한 날의 체크 목록 (데스크톱은 나란히)
  const wide = size === 'desktop';
  const selected = (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
        <T variant="heading">
          {m}월 {d}일 ({weekdayLabel(cursor)}){' '}
          <T variant="label" color={holidays[cursor] ? 'danger' : 'muted'}>
            {holidays[cursor] ?? relativeLabel(cursor, today)}
          </T>
        </T>
        <Button title="하루 보기" kind="text" size="sm" onPress={() => setView('day')} />
      </View>
      <DayChecklist date={cursor} />
    </View>
  );

  return (
    <Screen header={header}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <Section style={{ padding: wide ? 16 : 8, flex: wide ? 1 : undefined, width: wide ? undefined : '100%' }}>
          <MonthView cursor={cursor} holidays={holidays} onSelect={setCursor} />
        </Section>
        <View style={{ width: wide ? 400 : '100%' }}>{selected}</View>
      </View>
      {status === 'no-key' ? (
        <T variant="caption" color="faint" style={{ textAlign: 'center' }}>
          공휴일을 보려면 공휴일 API 키가 필요해요 (README 참고)
        </T>
      ) : null}
    </Screen>
  );
}
