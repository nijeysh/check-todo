import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { feedbackText, type CheckFeedback } from '@/lib/stats';

const ToastContext = createContext<(msg: string) => void>(() => {});

/** 체크 순간 "🔥 5일 연속!" 같은 메시지를 화면 아래에 잠깐 띄운다 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const c = useTheme();
  const [msg, setMsg] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const [anim] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const show = useCallback((m: string) => {
    setMsg(m);
    setKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!msg) return;
    anim.setValue(0);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 8, tension: 90 }),
      Animated.delay(1600),
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(({ finished }) => finished && setMsg(null));
  }, [key, msg, anim]);

  // 하단 탭바 위에 뜨도록
  const bottom = insets.bottom + (Platform.OS === 'ios' ? 96 : 84);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg ? (
        <View pointerEvents="none" style={[styles.wrap, { bottom }]}>
          <Animated.View
            style={[
              styles.toast,
              {
                backgroundColor: c.toast,
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
              },
            ]}>
            <T variant="label" color="#FFFFFF">
              {msg}
            </T>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  return useCallback(
    (f: CheckFeedback | null | string) => {
      if (f) show(typeof f === 'string' ? f : feedbackText(f));
    },
    [show],
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    maxWidth: 480,
  },
});
