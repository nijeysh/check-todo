import { Stack, router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, TextInput, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorPicker } from '@/components/color-picker';
import { DateChip, DatePickerSheet } from '@/components/date-picker';
import { ReminderPicker } from '@/components/reminder-picker';
import { Button, Screen, T, inputStyle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useSheetGuard } from '@/hooks/use-sheet-guard';
import { useTheme } from '@/hooks/use-theme';
import { addDays, addMonthsSameDay, diffDays, formatLong, isValidKey, rangeKeys, WEEKDAY_LABELS } from '@/lib/date';
import { confirm } from '@/lib/platform';
import { formatTime } from '@/lib/reminders';
import { changeSchedule, isDue, sameSchedule, scheduleLabel } from '@/lib/stats';
import { actions, nextHabitColor, useToday } from '@/lib/store';
import type { Habit, HabitKind, Schedule } from '@/lib/types';

const EMOJIS = ['💧', '📚', '🧘', '✍️', '🏃', '💊', '🥗', '😴', '🧹', '💰', '🎸', '🙏', '☕️', '📞', '🛒', '📦'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_PRESETS: [string, number[]][] = [
  ['매일', ALL_DAYS],
  ['평일', [1, 2, 3, 4, 5]],
  ['주말', [0, 6]],
];

/**
 * 루틴 / 할 일 추가·수정 폼.
 * - 기본: 화면 전체 (아래 고정 저장 버튼, 저장하면 이전 화면으로)
 * - inline: 루틴 상세 화면 아래에 펼쳐 두는 설정 칸 (저장해도 그 자리에 머문다)
 * 종류: 루틴(매일 또는 고른 요일, 연속 통계) / 할 일(단발성, 그날만 체크)
 */
export function HabitForm({
  existing,
  initialKind,
  inline = false,
}: {
  existing?: Habit;
  initialKind?: HabitKind;
  inline?: boolean;
}) {
  const c = useTheme();
  const today = useToday();

  const [kind, setKind] = useState<HabitKind>(existing?.kind ?? (initialKind === 'once' ? 'once' : 'habit'));
  const once = kind === 'once';
  const [title, setTitle] = useState(existing?.title ?? '');
  const [titleFocused, setTitleFocused] = useState(!existing);
  const [justSaved, setJustSaved] = useState(false);
  const [emoji, setEmoji] = useState(existing?.emoji ?? '');
  const [color, setColor] = useState<string>(existing?.color ?? (initialKind === 'once' ? c.main : nextHabitColor()));
  const [days, setDays] = useState<number[]>(
    existing?.schedule.type === 'weekdays' ? existing.schedule.days : ALL_DAYS,
  );
  const [startDate, setStartDate] = useState(existing?.startDate ?? today);
  // 종료일: 없으면 끝없이 계속. 정하기를 누르면 기본으로 시작일부터 한 달
  const [hasEnd, setHasEnd] = useState(!!existing?.endDate);
  const [endDate, setEndDate] = useState(existing?.endDate ?? addDays(addMonthsSameDay(existing?.startDate ?? today, 1), -1));
  const [reminder, setReminder] = useState<string | undefined>(existing?.reminder);
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);

  const startValid = isValidKey(startDate);
  const endValid = once || !hasEnd || (isValidKey(endDate) && endDate >= startDate);
  const schedule: Schedule = days.length === 7 ? { type: 'daily' } : { type: 'weekdays', days: [...days].sort() };

  // 바뀐 게 있을 때만 저장할 수 있게 (상세 화면 안에서 쓸 때)
  const dirty =
    !existing ||
    title.trim() !== existing.title ||
    (emoji.trim() || undefined) !== existing.emoji ||
    color !== existing.color ||
    startDate !== existing.startDate ||
    (!once && (hasEnd ? endDate : undefined) !== existing.endDate) ||
    reminder !== existing.reminder ||
    (!once && !sameSchedule(existing.schedule, schedule));
  const canSave = title.trim().length > 0 && (once || days.length > 0) && startValid && endValid && dirty;
  const periodHint = (() => {
    if (!startValid) return undefined;
    const from = startDate === today ? '오늘' : formatLong(startDate);
    if (!hasEnd) return `${from}부터 끝없이 계속해요`;
    if (!endValid) return '종료일은 시작일과 같거나 뒤여야 해요';
    const total = diffDays(startDate, endDate) + 1;
    const count = days.length ? rangeKeys(startDate, endDate).filter((k) => isDue({ schedule }, k)).length : 0;
    return `${from}부터 ${formatLong(endDate)}까지 ${total}일 · ${scheduleLabel(schedule)} 총 ${count}번`;
  })();

  // 이미 기록을 세고 있는 루틴의 요일을 바꾸면 "오늘부터만 / 처음부터 모두"를 묻는다
  const scheduleChanged = !!existing && !once && !sameSchedule(existing.schedule, schedule);
  const askScope = scheduleChanged && startDate < today;
  const [scopeOpen, setScopeOpen] = useState(false);

  const save = (scope?: 'future' | 'all') => {
    if (!canSave) return;
    if (askScope && !scope) {
      setScopeOpen(true);
      return;
    }
    const base = {
      kind,
      title: title.trim(),
      emoji: emoji.trim() || undefined,
      color,
      startDate,
      endDate: !once && hasEnd ? endDate : undefined,
      reminder,
    };
    if (existing) {
      // 요일을 안 바꿨으면 요일 이력은 그대로 둔다
      const sched = once
        ? { schedule: { type: 'daily' } as const, pastSchedules: undefined }
        : scheduleChanged
          ? changeSchedule(existing, schedule, scope ?? 'all', today)
          : {};
      actions.updateHabit(existing.id, { ...base, ...sched });
    } else {
      actions.addHabit({ ...base, schedule: once ? { type: 'daily' } : schedule });
    }
    if (inline) {
      setJustSaved(true);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const sameDays = (a: number[], b: number[]) => a.length === b.length && a.every((d) => b.includes(d));
  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const question = existing
    ? once
      ? '할 일을 고칠게요'
      : '루틴을 고칠게요'
    : once
      ? '어떤 일을\n해야 하나요?'
      : '어떤 루틴을\n만들까요?';

  const saveButton = (
    <Button
      title={existing ? (!dirty && justSaved ? '저장했어요' : '저장하기') : '추가하기'}
      size="lg"
      disabled={!canSave}
      onPress={() => save()}
      style={{ width: '100%' }}
    />
  );

  const body = (
    <>

      {existing || inline ? null : (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.two }}>
          <KindCard
            selected={!once}
            emoji="🔁"
            title="루틴"
            desc="정한 요일마다 반복해요"
            onPress={() => setKind('habit')}
          />
          <KindCard
            selected={once}
            emoji="📌"
            title="할 일"
            desc="하루만 체크해요"
            onPress={() => {
              setKind('once');
              if (startDate < today) setStartDate(today);
            }}
          />
        </View>
      )}

      <Field label={once ? '할 일' : '루틴 이름'}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={once ? '예) 택배 반품 보내기' : '예) 물 2L 마시기'}
          placeholderTextColor={c.textFaint}
          style={inputStyle(c, titleFocused)}
          autoFocus={!existing && !inline}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          onSubmitEditing={() => save()}
          maxLength={40}
        />
      </Field>

      {once ? (
        <Field label="날짜">
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
          </View>
          <DateChip label="날짜" value={startDate} onPress={() => setPicking('start')} />
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

          <Field label="기간" hint={periodHint}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T variant="label" color="secondary" style={{ width: 32 }}>
                시작
              </T>
              <View style={{ flex: 1 }}>
                <DateChip label="시작일" value={startDate} onPress={() => setPicking('start')} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T variant="label" color="secondary" style={{ width: 32 }}>
                종료
              </T>
              <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                <Pill selected={!hasEnd} onPress={() => setHasEnd(false)} style={{ flex: 1 }}>
                  종료일 없음
                </Pill>
                <Pill selected={hasEnd} onPress={() => setHasEnd(true)} style={{ flex: 1 }}>
                  종료일 정하기
                </Pill>
              </View>
            </View>
            {hasEnd ? (
              <View style={{ paddingLeft: 42, gap: 8 }}>
                <DateChip label="종료일" value={endDate} onPress={() => setPicking('end')} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(
                    [
                      ['1주', addDays(startDate, 6)],
                      ['1개월', addDays(addMonthsSameDay(startDate, 1), -1)],
                      ['3개월', addDays(addMonthsSameDay(startDate, 3), -1)],
                      ['100일', addDays(startDate, 99)],
                    ] as const
                  ).map(([label, d]) => (
                    <Pill key={label} small selected={endDate === d} onPress={() => setEndDate(d)}>
                      {label}
                    </Pill>
                  ))}
                </View>
              </View>
            ) : null}
          </Field>
        </>
      )}

      {existing ? (
        <ScopeSheet
          visible={scopeOpen}
          from={scheduleLabel(existing.schedule)}
          to={scheduleLabel(schedule)}
          today={today}
          onPick={(scope) => {
            setScopeOpen(false);
            save(scope);
          }}
          onClose={() => setScopeOpen(false)}
        />
      ) : null}

      <DatePickerSheet
        visible={picking === 'start'}
        title={once ? '날짜' : '시작일'}
        value={startDate}
        min={once ? today : undefined}
        onDone={(d) => {
          // 시작일을 옮기면 종료일도 같은 길이만큼 따라간다
          if (hasEnd && isValidKey(endDate)) setEndDate(addDays(d, Math.max(0, diffDays(startDate, endDate))));
          setStartDate(d);
        }}
        onClose={() => setPicking(null)}
      />
      <DatePickerSheet
        visible={picking === 'end'}
        title="종료일"
        value={endDate}
        min={startDate}
        onDone={setEndDate}
        onClose={() => setPicking(null)}
      />

      <Field
        label="알림"
        hint={
          reminder
            ? once
              ? `이날 ${formatTime(reminder)}에 알려드려요`
              : `하는 날 ${formatTime(reminder)}에, 아직 체크 안 했으면 알려드려요`
            : undefined
        }>
        <ReminderPicker value={reminder} onChange={setReminder} />
      </Field>

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

      {inline ? <View style={{ marginTop: Spacing.three }}>{saveButton}</View> : null}

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
                once ? '할 일 삭제' : '루틴 삭제',
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
    </>
  );

  if (inline) return <View>{body}</View>;

  return (
    <Screen maxWidth={560} background={c.surface} bottom={saveButton}>
      <Stack.Screen options={{ title: '' }} />
      <T variant="display" style={{ marginTop: Spacing.two }}>
        {question}
      </T>
      {body}
    </Screen>
  );
}

/** '매일' → '매일로', '월·수·금' → '월·수·금으로' (받침이 있으면 '으로', ㄹ 받침은 '로') */
function withRo(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const jong = code >= 0 && code < 11172 ? code % 28 : 0;
  return word + (jong && jong !== 8 ? '으로' : '로');
}

/** 요일을 바꿀 때: 오늘부터만 바꿀지, 지난 기록까지 처음부터 모두 바꿀지 */
function ScopeSheet({
  visible,
  from,
  to,
  today,
  onPick,
  onClose,
}: {
  visible: boolean;
  from: string;
  to: string;
  today: string;
  onPick: (scope: 'future' | 'all') => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const guard = useSheetGuard(visible);
  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'none' : 'slide'}
      onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="닫기"
          onPress={guard(onClose)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
        />
        <View
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: Radius.xl,
            borderTopRightRadius: Radius.xl,
            paddingTop: 12,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 16,
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
            gap: 12,
          }}>
          <View style={{ alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: c.border }} />
          <T variant="heading" style={{ marginTop: 4 }}>
            요일을 언제부터 바꿀까요?
          </T>
          <T variant="small" color="muted">
            {from} → {to}
          </T>
          <ScopeOption
            title="오늘부터 바꾸기"
            desc={`${formatLong(addDays(today, -1))}까지는 ${withRo(from)} 센 기록을 그대로 둬요. 연속 기록도 이어져요.`}
            onPress={guard(() => onPick('future'))}
            primary
          />
          <ScopeOption
            title="처음부터 모두 바꾸기"
            desc={`시작일부터 ${withRo(to)} 다시 세요. 지난 연속일·끊긴 날이 달라질 수 있어요.`}
            onPress={guard(() => onPick('all'))}
          />
          <Button title="취소" kind="grey" size="lg" onPress={guard(onClose)} />
        </View>
      </View>
    </Modal>
  );
}

function ScopeOption({
  title,
  desc,
  onPress,
  primary,
}: {
  title: string;
  desc: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        gap: 4,
        padding: 16,
        borderRadius: Radius.lg,
        backgroundColor: primary ? c.accentSoft : c.surfaceAlt,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <T variant="bodyStrong" color={primary ? 'accent' : undefined}>
        {title}
      </T>
      <T variant="small" color="muted">
        {desc}
      </T>
    </Pressable>
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

function Pill({
  selected,
  onPress,
  children,
  small,
  style,
}: {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
  small?: boolean;
  style?: ViewStyle;
}) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        ...style,
        height: small ? 36 : 44,
        paddingHorizontal: small ? 14 : 18,
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
