import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function IconButton({
  icon,
  onPress,
  disabled,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  label: string;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? c.border : c.surfaceAlt,
        opacity: disabled ? 0.3 : 1,
      })}>
      <Icon name={icon} size={20} color={c.textSecondary} />
    </Pressable>
  );
}

/** ‹ 2026년 11월 › */
export function MonthNav({
  label,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <IconButton icon="chevronLeft" label="이전 달" onPress={onPrev} disabled={prevDisabled} />
      <T variant="bodyStrong" style={{ minWidth: 110, textAlign: 'center' }}>
        {label}
      </T>
      <IconButton icon="chevronRight" label="다음 달" onPress={onNext} disabled={nextDisabled} />
    </View>
  );
}
