import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  checked: boolean;
  color: string;
  size?: number;
  /** 대상일이 아닌 날 (요일 지정 항목) */
  off?: boolean;
  /** 오늘 칸 강조 */
  highlight?: boolean;
  /** 시작일 이전·미래 등 누를 수 없는 칸 */
  disabled?: boolean;
  /** 안 했을 때도 흐린 체크 표시 (눌러도 된다는 힌트) */
  ghost?: boolean;
  onPress?: () => void;
  label?: string;
};

/** 네모난 체크 칸. 안 한 칸은 회색, 한 칸은 항목 색으로 채운다 */
export function CheckBox({ checked, color, size = 28, off, highlight, disabled, ghost = true, onPress, label }: Props) {
  const c = useTheme();
  const radius = Math.round(size * 0.3);
  const bg = checked ? color : off || disabled ? c.boxOff : c.boxEmpty;
  const box = (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: bg,
          borderWidth: highlight && !checked ? 2 : 0,
          borderColor: c.accent,
          opacity: disabled && !checked ? 0.5 : 1,
        },
      ]}>
      {checked || (ghost && !off && !disabled) ? (
        <Text
          style={[
            styles.mark,
            {
              fontSize: size * 0.58,
              lineHeight: size * 0.9,
              color: checked ? '#FFFFFF' : c.surface,
            },
          ]}>
          ✓
        </Text>
      ) : null}
    </View>
  );
  if (!onPress || disabled) return box;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        if (Platform.OS !== 'web')
          Haptics.impactAsync(checked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.88 : 1 }] })}>
      {box}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  mark: { fontWeight: '900', textAlign: 'center' },
});
