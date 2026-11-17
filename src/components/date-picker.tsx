import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { MonthNav } from '@/components/month-nav';
import { Button, T } from '@/components/ui';
import { Radius, glyphNudge, textOn } from '@/constants/theme';
import { useSheetGuard } from '@/hooks/use-sheet-guard';
import { useTheme } from '@/hooks/use-theme';
import { monthGridDates } from '@/lib/calendar';
import { addMonths, formatLong, monthStart, parts, WEEKDAY_LABELS, type DateKey } from '@/lib/date';
import { useAppData, useToday } from '@/lib/store';

/**
 * 아래에서 올라오는 달력 시트. 날짜를 누르면 바로 고르고 닫힌다.
 * min/max 밖의 날짜는 누를 수 없다.
 */
export function DatePickerSheet({
  visible,
  value,
  title,
  min,
  max,
  onDone,
  onClose,
}: {
  visible: boolean;
  value?: DateKey;
  title: string;
  min?: DateKey;
  max?: DateKey;
  onDone: (d: DateKey) => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const { settings } = useAppData();
  const [month, setMonth] = useState(monthStart(value ?? today));
  const guard = useSheetGuard(visible);

  // 열 때마다 고른 날짜가 있는 달로
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setMonth(monthStart(value ?? min ?? today));
  }

  const { y, m } = parts(month);
  const dates = monthGridDates(month, settings.weekStartsOn);
  const curMonth = month.slice(0, 7);
  const labels = [...WEEKDAY_LABELS.slice(settings.weekStartsOn), ...WEEKDAY_LABELS.slice(0, settings.weekStartsOn)];

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
            {title}
          </T>
          <MonthNav
            label={`${y}년 ${m}월`}
            onPrev={guard(() => setMonth(addMonths(month, -1)))}
            onNext={guard(() => setMonth(addMonths(month, 1)))}
            prevDisabled={!!min && month <= monthStart(min)}
            nextDisabled={!!max && month >= monthStart(max)}
          />
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row' }}>
              {labels.map((l) => (
                <T
                  key={l}
                  variant="small"
                  color={l === '일' ? 'danger' : 'muted'}
                  style={{ flex: 1, textAlign: 'center' }}>
                  {l}
                </T>
              ))}
            </View>
            {Array.from({ length: dates.length / 7 }, (_, r) => (
              <View key={r} style={{ flexDirection: 'row' }}>
                {dates.slice(r * 7, r * 7 + 7).map((k) => {
                  const inMonth = k.slice(0, 7) === curMonth;
                  const disabled = (!!min && k < min) || (!!max && k > max);
                  const selected = k === value;
                  const isToday = k === today;
                  if (!inMonth) return <View key={k} style={{ flex: 1, height: 44 }} />;
                  return (
                    <Pressable
                      key={k}
                      disabled={disabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled }}
                      accessibilityLabel={formatLong(k)}
                      onPress={guard(() => {
                        onDone(k);
                        onClose();
                      })}
                      style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      {({ pressed }) => (
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: Radius.full,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selected ? c.accent : pressed ? c.surfaceAlt : 'transparent',
                            borderWidth: isToday && !selected ? 1.5 : 0,
                            borderColor: c.accent,
                          }}>
                          <T
                            variant="label"
                            color={selected ? textOn(c.accent) : disabled ? 'faint' : undefined}
                            style={[{ fontVariant: ['tabular-nums'], fontWeight: selected ? '700' : '500' }, glyphNudge(15)]}>
                            {parts(k).d}
                          </T>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
          <Button title="닫기" kind="grey" size="lg" onPress={guard(onClose)} />
        </View>
      </View>
    </Modal>
  );
}

/** 날짜를 보여주고 누르면 달력 시트를 여는 칸: "11월 17일 (화) ›" */
export function DateChip({
  value,
  onPress,
  placeholder = '날짜 고르기',
  label,
}: {
  value?: DateKey;
  onPress: () => void;
  placeholder?: string;
  label?: string;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label ?? ''} ${value ? formatLong(value) : placeholder}, 바꾸기`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 48,
        paddingHorizontal: 16,
        borderRadius: Radius.md,
        backgroundColor: c.surfaceAlt,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <Icon name="calendar" size={18} color={c.textMuted} />
      <T variant="bodyStrong" style={{ flex: 1 }} color={value ? undefined : 'faint'}>
        {value ? `${parts(value).y}년 ${formatLong(value)}` : placeholder}
      </T>
      <Icon name="chevronRight" size={18} color={c.textFaint} />
    </Pressable>
  );
}
