import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { ColorPicker } from '@/components/color-picker';
import { Button, Screen, T, boxInputStyle, inputStyle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatLong, isValidKey, WEEKDAY_LABELS } from '@/lib/date';
import { confirm } from '@/lib/platform';
import { actions, nextHabitColor, useAppData, useToday } from '@/lib/store';
import type { HabitKind, Schedule } from '@/lib/types';

const EMOJIS = ['💧', '📚', '🧘', '✍️', '🏃', '💊', '🥗', '😴', '🧹', '💰', '🎸', '🙏', '☕️', '📞', '🛒', '📦'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_PRESETS: [string, number[]][] = [
  ['매일', ALL_DAYS],
  ['평일', [1, 2, 3, 4, 5]],
  ['주말', [0, 6]],
];

/**
 * 항목 추가 / 편집 (id 파라미터가 있으면 편집)
 * 종류: 매일 반복(지속, 연속 통계) / 하루만(단발성, 그날만 체크)
 */
export default function HabitEditScreen() {
  const c = useTheme();
  const params = useLocalSearchParams<{ id?: string; kind?: HabitKind }>();
  const { habits } = useAppData();
  const today = useToday();
  const existing = habits.find((h) => h.id === params.id);

  const [kind, setKind] = useState<HabitKind>(existing?.kind ?? (params.kind === 'once' ? 'once' : 'habit'));
  const once = kind === 'once';
  const [title, setTitle] = useState(existing?.title ?? '');
  const [titleFocused, setTitleFocused] = useState(!existing);
  const [emoji, setEmoji] = useState(existing?.emoji ?? '');
  const [color, setColor] = useState<string>(existing?.color ?? (params.kind === 'once' ? c.main : nextHabitColor()));
  const [days, setDays] = useState<number[]>(
    existing?.schedule.type === 'weekdays' ? existing.schedule.days : ALL_DAYS,
  );
  const [startDate, setStartDate] = useState(existing?.startDate ?? today);

  // 지속 항목의 시작일은 오늘 이전, 단발성 할 일의 날짜는 미래도 가능
  const startValid = isValidKey(startDate) && (once || startDate <= today);
  const canSave = title.trim().length > 0 && (once || days.length > 0) && startValid;

  const save = () => {
    if (!canSave) return;
    const schedule: Schedule = days.length === 7 ? { type: 'daily' } : { type: 'weekdays', days: [...days].sort() };
    const input = {
      kind,
      title: title.trim(),
      emoji: emoji.trim() || undefined,
      color,
      schedule: once ? ({ type: 'daily' } as const) : schedule,
      startDate,
    };
    if (existing) actions.updateHabit(existing.id, input);
    else actions.addHabit(input);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const sameDays = (a: number[], b: number[]) => a.length === b.length && a.every((d) => b.includes(d));
  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const question = existing
    ? once
      ? '할 일을 고칠게요'
      : '항목을 고칠게요'
    : once
      ? '하루만 할 일을\n알려주세요'
      : '매일 어떤 걸\n체크할까요?';

  return (
    <Screen
      maxWidth={560}
      background={c.surface}
      bottom={
        <Button
          title={existing ? '저장하기' : '추가하기'}
          size="lg"
          disabled={!canSave}
          onPress={save}
          style={{ width: '100%' }}
        />
      }>
      <Stack.Screen options={{ title: '' }} />
      <T variant="display" style={{ marginTop: Spacing.two }}>
        {question}
      </T>

      {existing ? null : (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.two }}>
          <KindCard
            selected={!once}
            emoji="🔁"
            title="매일 반복"
            desc="연속 기록이 쌓여요"
            onPress={() => setKind('habit')}
          />
          <KindCard
            selected={once}
            emoji="📌"
            title="하루만"
            desc="그날만 체크해요"
            onPress={() => {
              setKind('once');
              if (startDate < today) setStartDate(today);
            }}
          />
        </View>
      )}

      <Field label={once ? '할 일' : '이름'}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={once ? '예) 택배 반품 보내기' : '예) 물 2L 마시기'}
          placeholderTextColor={c.textFaint}
          style={inputStyle(c, titleFocused)}
          autoFocus={!existing}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          onSubmitEditing={save}
          maxLength={40}
        />
      </Field>

      {once ? (
        <Field label="날짜" hint={isValidKey(startDate) ? formatLong(startDate) : 'YYYY-MM-DD 형식으로 입력해 주세요'}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(
              [
                [today, '오늘'],
                [addDays(today, 1), '내일'],
              ] as const
            ).map(([d, label]) => (
              <Pill key={label} selected={startDate === d} onPress={() => setStartDate(d)}>
                {label}
              </Pill>
            ))}
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.textFaint}
              style={[boxInputStyle(c), { flex: 1, minWidth: 0 }, !startValid && { color: c.danger }]}
              maxLength={10}
            />
          </View>
        </Field>
      ) : (
        <>
          <Field
            label="하는 날"
            hint={
              days.length === 0
                ? '하루 이상 골라주세요'
                : days.length === 7
                  ? '매일 해요'
                  : '고르지 않은 요일은 비워도 연속이 끊기지 않아요'
            }>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              {DAY_PRESETS.map(([label, preset]) => (
                <Pill key={label} selected={sameDays(days, preset)} onPress={() => setDays(preset)}>
                  {label}
                </Pill>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
              {WEEKDAY_LABELS.map((l, d) => {
                const on = days.includes(d);
                return (
                  <Pressable
                    key={l}
                    onPress={() => toggleDay(d)}
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => ({
                      flex: 1,
                      maxWidth: 48,
                      aspectRatio: 1,
                      borderRadius: Radius.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? c.accent : c.surfaceAlt,
                      transform: [{ scale: pressed ? 0.92 : 1 }],
                    })}>
                    <T variant="label" color={on ? c.onAccent : d === 0 ? 'danger' : 'secondary'}>
                      {l}
                    </T>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        </>
      )}

      <Field label="체크 칸 색">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Field label="아이콘 (선택)">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(emoji === e ? '' : e)}
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: Radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: emoji === e ? c.accentSoft : c.surfaceAlt,
                borderWidth: 2,
                borderColor: emoji === e ? c.accent : 'transparent',
                transform: [{ scale: pressed ? 0.92 : 1 }],
              })}>
              <T style={{ fontSize: 22, lineHeight: 28 }}>{e}</T>
            </Pressable>
          ))}
        </ScrollView>
      </Field>

      {once ? null : (
        <Field
          label="시작일"
          hint={
            startValid ? `${formatLong(startDate)}부터 기록을 세요` : '오늘 이전 날짜를 YYYY-MM-DD로 입력해 주세요'
          }>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={c.textFaint}
            style={[boxInputStyle(c), !startValid && { color: c.danger }]}
            maxLength={10}
          />
        </Field>
      )}

      {existing ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.three }}>
          {once ? null : (
            <Button
              title={existing.archivedAt ? '보관 해제' : '보관하기'}
              kind="grey"
              icon="archive"
              style={{ flex: 1 }}
              onPress={() => {
                actions.setArchived(existing.id, !existing.archivedAt);
                router.dismissTo('/');
              }}
            />
          )}
          <Button
            title="삭제하기"
            kind="danger"
            icon="trash"
            style={{ flex: 1 }}
            onPress={async () => {
              const ok = await confirm(
                once ? '할 일 삭제' : '항목 삭제',
                once
                  ? `"${existing.title}"을 지울까요?`
                  : `"${existing.title}"과 모든 체크 기록을 지울까요? 되돌릴 수 없어요.`,
                '삭제',
              );
              if (ok) {
                actions.deleteHabit(existing.id);
                router.dismissTo('/');
              }
            }}
          />
        </View>
      ) : null}
      {existing && !once ? (
        <T variant="caption" color="muted">
          보관하면 오늘 화면에서 사라지지만 기록은 남아요. 설정에서 다시 꺼낼 수 있어요.
        </T>
      ) : null}
    </Screen>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10, marginTop: Spacing.three }}>
      <T variant="label" color="muted">
        {label}
      </T>
      {children}
      {hint ? (
        <T variant="small" color="muted">
          {hint}
        </T>
      ) : null}
    </View>
  );
}

function KindCard({
  selected,
  emoji,
  title,
  desc,
  onPress,
}: {
  selected: boolean;
  emoji: string;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flex: 1,
        gap: 6,
        padding: 16,
        borderRadius: Radius.lg,
        backgroundColor: selected ? c.accentSoft : c.surfaceAlt,
        borderWidth: 2,
        borderColor: selected ? c.accent : 'transparent',
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      <T style={{ fontSize: 24, lineHeight: 30 }}>{emoji}</T>
      <T variant="bodyStrong" color={selected ? 'accent' : undefined}>
        {title}
      </T>
      <T variant="small" color="muted">
        {desc}
      </T>
    </Pressable>
  );
}

function Pill({ selected, onPress, children }: { selected: boolean; onPress: () => void; children: ReactNode }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        height: 44,
        paddingHorizontal: 18,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? c.accent : c.surfaceAlt,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}>
      <T variant="label" color={selected ? c.onAccent : 'secondary'}>
        {children}
      </T>
    </Pressable>
  );
}
