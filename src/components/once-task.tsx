import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { CheckBox } from '@/components/check-box';
import { ColorPicker } from '@/components/color-picker';
import { TimeWheelSheet } from '@/components/time-wheel';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/toast';
import { ListRow, T } from '@/components/ui';
import { Fonts, Radius, textOn } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DateKey } from '@/lib/date';
import { requestPermission } from '@/lib/notifications';
import { formatTime } from '@/lib/reminders';
import { actions, useAppData } from '@/lib/store';
import type { Habit } from '@/lib/types';

/** 단발성 할 일 한 줄: 체크하면 취소선, × 로 삭제 */
export function OnceTaskRow({ task, date }: { task: Habit; date: DateKey }) {
  const c = useTheme();
  const { checks } = useAppData();
  const toast = useToast();
  const done = !!checks[task.id]?.[date];

  return (
    <ListRow
      onPress={() => router.push({ pathname: '/habit/edit', params: { id: task.id } })}
      left={
        <CheckBox
          size={30}
          checked={done}
          label={`${task.title} 완료`}
          onPress={() => toast(actions.toggleCheck(task.id, date))}
        />
      }
      title={
        <T
          variant="bodyStrong"
          numberOfLines={2}
          color={done ? 'faint' : undefined}
          style={{ textDecorationLine: done ? 'line-through' : 'none' }}>
          {task.emoji ? `${task.emoji} ` : ''}
          {task.title}
        </T>
      }
      subtitle={task.reminder && !done ? `🔔 ${formatTime(task.reminder)}` : undefined}
      accessory={
        <Pressable
          hitSlop={10}
          accessibilityLabel={`${task.title} 삭제`}
          onPress={() => actions.deleteHabit(task.id)}
          style={({ pressed }) => ({
            width: 28,
            height: 28,
            borderRadius: Radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? c.surfaceAlt : 'transparent',
          })}>
          <Icon name="close" size={18} color={c.textFaint} />
        </Pressable>
      }
    />
  );
}

/**
 * 이름만 쓰고 엔터 → 그날의 할 일로 바로 추가.
 * 왼쪽 네모: 체크 칸 색 고르기 / 🔔: 알림 시각 고르기.
 * 고른 색은 이어서 추가할 때도 유지하고, 알림 시각은 한 번 추가하면 비운다.
 */
export function OnceQuickAdd({ date, placeholder = '할 일 추가' }: { date: DateKey; placeholder?: string }) {
  const c = useTheme();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [color, setColor] = useState<string>(c.main);
  const [reminder, setReminder] = useState<string | undefined>();
  const [colorOpen, setColorOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const active = focused || colorOpen || !!text || !!reminder;
  const add = () => {
    const title = text.trim();
    if (!title) return;
    const id = actions.addOnce(title, date, color);
    if (reminder) actions.updateHabit(id, { reminder });
    setText('');
    setReminder(undefined);
    setColorOpen(false);
  };
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 10, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="체크 칸 색 고르기"
          onPress={() => setColorOpen((v) => !v)}
          style={({ pressed }) => ({
            width: 30,
            height: 30,
            borderRadius: 9,
            marginRight: 4,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active ? color : c.accentSoft,
            transform: [{ scale: pressed ? 0.9 : 1 }],
          })}>
          <Icon name="plus" size={20} color={active ? textOn(color) : c.accentInk} />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={c.accentInk}
          maxLength={60}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 17,
            fontWeight: '600',
            letterSpacing: -0.3,
            paddingVertical: 8,
            color: c.text,
            fontFamily: Fonts.sans,
          }}
        />
        {/* 알림 버튼은 항상 보이게 (찾기 쉽게) */}
        {
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={reminder ? `알림 ${formatTime(reminder)}, 바꾸기` : '알림 시각 고르기'}
            onPress={() => setWheelOpen(true)}
            hitSlop={6}
            style={({ pressed }) => ({
              height: 34,
              minWidth: 34,
              paddingHorizontal: reminder ? 10 : 0,
              borderRadius: Radius.sm + 2,
              flexDirection: 'row',
              gap: 4,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: reminder ? c.accentSoft : c.surfaceAlt,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            })}>
            <Icon name="bell" size={18} color={reminder ? c.accentInk : c.textMuted} />
            {reminder ? (
              <T variant="small" color="accent" style={{ fontWeight: '700' }}>
                {formatTime(reminder)}
              </T>
            ) : null}
          </Pressable>
        }
        {text.trim() ? (
          <Pressable
            onPress={add}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 34,
              justifyContent: 'center',
              paddingHorizontal: 14,
              borderRadius: Radius.sm + 2,
              backgroundColor: c.accent,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}>
            <T variant="small" color={c.onAccent} style={{ fontWeight: '700' }}>
              추가
            </T>
          </Pressable>
        ) : null}
      </View>
      <TimeWheelSheet
        visible={wheelOpen}
        value={reminder}
        onDone={(t) => {
          setReminder(t);
          requestPermission();
        }}
        onClose={() => setWheelOpen(false)}
        onClear={reminder ? () => setReminder(undefined) : undefined}
      />
      {colorOpen ? (
        <View style={{ paddingLeft: 44, gap: 8 }}>
          <T variant="caption" color="muted">
            체크 칸 색
          </T>
          <ColorPicker value={color} onChange={setColor} size={28} />
        </View>
      ) : active ? (
        <T variant="caption" color="faint" style={{ paddingLeft: 44 }}>
          왼쪽 네모는 색, 🔔는 알림 시각이에요
        </T>
      ) : null}
    </View>
  );
}
