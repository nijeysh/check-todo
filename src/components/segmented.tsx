import { Pressable, View } from 'react-native';

import { T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 회색 바탕 위에 흰 조각이 움직이는 선택 버튼 (일 | 주 | 월 | 년) */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly (readonly [K, string])[];
  value: K;
  onChange: (k: K) => void;
}) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.boxEmpty, borderRadius: Radius.md, padding: 3 }}>
      {options.map(([k, label]) => {
        const on = k === value;
        return (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(k)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: Radius.sm + 1,
              backgroundColor: on ? c.surface : 'transparent',
            }}>
            <T variant="label" color={on ? undefined : 'muted'} style={{ fontWeight: on ? '700' : '500' }}>
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
