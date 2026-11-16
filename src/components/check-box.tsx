import * as Haptics from 'expo-haptics';
import { Platform, Pressable } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  checked: boolean;
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

/** 체크 표시 모양 (A안: 굵고 끝이 둥근 체크). 30×30 기준 좌표 */
const CHECK_PATH = 'M8.5 15.5l4.5 4.5 8.5-9';

/**
 * 네모난 체크 칸. 안 한 칸은 회색, 한 칸은 브랜드 sub 색(기본 Rose Quartz)으로 채우고
 * 같은 계열의 진한 색으로 체크를 그린다.
 */
export function CheckBox({ checked, size = 28, off, highlight, disabled, ghost = true, onPress, label }: Props) {
  const c = useTheme();
  const fill = checked ? c.sub : off || disabled ? c.boxOff : c.boxEmpty;
  const showMark = checked || (ghost && !off && !disabled);
  const ring = highlight && !checked;

  const box = (
    <Svg width={size} height={size} viewBox="0 0 30 30" style={{ opacity: disabled && !checked ? 0.5 : 1 }}>
      <Rect
        x={ring ? 1 : 0}
        y={ring ? 1 : 0}
        width={ring ? 28 : 30}
        height={ring ? 28 : 30}
        rx={ring ? 8 : 9}
        fill={fill}
        stroke={ring ? c.accent : 'none'}
        strokeWidth={ring ? 2 : 0}
      />
      {showMark ? (
        <Path
          d={CHECK_PATH}
          fill="none"
          stroke={checked ? c.onSub : c.surface}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );

  if (!onPress || disabled) return box;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={10}
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
