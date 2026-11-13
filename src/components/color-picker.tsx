import { Pressable, View } from 'react-native';

import { T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { HABIT_COLORS } from '@/lib/store';

/** 체크 칸 색 고르기 (동그란 색 버튼) */
export function ColorPicker({
  value,
  onChange,
  size = 36,
}: {
  value: string;
  onChange: (color: string) => void;
  size?: number;
}) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: size / 3 }}>
      {HABIT_COLORS.map(({ hex, name }) => {
        const on = value.toLowerCase() === hex.toLowerCase();
        return (
          <Pressable
            key={hex}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${name} 색`}
            onPress={() => onChange(hex)}
            style={({ pressed }) => ({
              width: size,
              height: size,
              borderRadius: Radius.full,
              backgroundColor: hex,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: on ? 3 : 0,
              borderColor: c.surface,
              outlineColor: hex,
              outlineWidth: on ? 2 : 0,
              outlineStyle: 'solid',
              transform: [{ scale: pressed ? 0.9 : 1 }],
            })}>
            {on ? (
              <T variant="label" color="#FFFFFF" style={{ fontSize: size * 0.42 }}>
                ✓
              </T>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
