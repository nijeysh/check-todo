import { useEffect, useState } from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';

import { Icon } from '@/components/icon';
import { TimeWheelSheet } from '@/components/time-wheel';
import { Button, T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getPermission,
  notificationsNote,
  openNotificationSettings,
  requestPermission,
  type PermissionState,
} from '@/lib/notifications';
import { formatTime } from '@/lib/reminders';

/**
 * 알림 켜기/끄기 + 시간은 휠로만 고른다.
 * - 스위치를 켜면 휠 시트가 바로 올라오고, 취소하면 스위치는 다시 꺼진 채로 둔다.
 * - 켠 뒤에는 시각(예: 18:00)을 눌러 휠로 다시 바꾼다.
 * 시각을 처음 정하는 순간 알림 권한을 묻는다 (앱을 처음 열 때 묻는 것보다 허용률이 높다).
 */
export function ReminderPicker({
  value,
  onChange,
  label = '알림 받기',
  background = 'alt',
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  label?: string;
  /** 흰 배경 위면 'alt'(회색 상자), 회색 배경 위면 'surface'(흰 상자) */
  background?: 'alt' | 'surface';
}) {
  const c = useTheme();
  const [perm, setPerm] = useState<PermissionState | null>(null);
  const [wheelOpen, setWheelOpen] = useState(false);
  const on = !!value;

  useEffect(() => {
    getPermission().then(setPerm);
  }, []);

  const choose = async (t: string) => {
    onChange(t);
    setPerm(await requestPermission());
  };

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingLeft: 16,
          paddingRight: 12,
          borderRadius: Radius.md,
          backgroundColor: background === 'alt' ? c.surfaceAlt : c.surface,
        }}>
        <Icon name="bell" size={20} color={on ? c.accentInk : c.textMuted} />
        <View style={{ flex: 1 }}>
          <T variant="label">{label}</T>
        </View>
        {on ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`알림 시각 ${formatTime(value)}, 바꾸기`}
            onPress={() => setWheelOpen(true)}
            hitSlop={6}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              paddingHorizontal: 10,
              height: 32,
              borderRadius: Radius.sm + 2,
              backgroundColor: c.accentSoft,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}>
            <T variant="label" color="accent" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              {formatTime(value)}
            </T>
            <Icon name="chevronRight" size={16} color={c.accentInk} />
          </Pressable>
        ) : null}
        <Switch
          accessibilityLabel={label}
          value={on}
          onValueChange={(next) => (next ? setWheelOpen(true) : onChange(undefined))}
          trackColor={{ false: c.boxEmpty, true: c.accent }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={c.boxEmpty}
          // 웹(react-native-web)은 켜진 상태 색을 따로 받는다 (기본값은 청록색)
          {...(Platform.OS === 'web' ? ({ activeThumbColor: '#FFFFFF', activeTrackColor: c.accent } as object) : null)}
        />
      </View>

      <TimeWheelSheet
        visible={wheelOpen}
        value={value}
        onDone={choose}
        onClose={() => setWheelOpen(false)}
        onClear={on ? () => onChange(undefined) : undefined}
      />

      {on && perm === 'denied' ? (
        <View style={{ gap: 8 }}>
          <T variant="small" color="danger">
            {Platform.OS === 'web'
              ? '이 브라우저가 알림을 막고 있어서 알림이 오지 않아요. 주소창 왼쪽 자물쇠(사이트 설정) > 알림을 "허용"으로 바꿔 주세요.'
              : '휴대폰 설정에서 이 앱의 알림이 꺼져 있어서 알림이 오지 않아요. 아래 버튼으로 설정을 열어 알림을 켜 주세요.'}
          </T>
          {Platform.OS !== 'web' ? (
            <Button
              title="설정 열기"
              kind="weak"
              size="sm"
              style={{ alignSelf: 'flex-start' }}
              onPress={openNotificationSettings}
            />
          ) : null}
        </View>
      ) : on && notificationsNote ? (
        <T variant="small" color="muted">
          {notificationsNote}
        </T>
      ) : null}
    </View>
  );
}
