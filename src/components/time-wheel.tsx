import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, T } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useSheetGuard } from '@/hooks/use-sheet-guard';
import { useTheme } from '@/hooks/use-theme';

const ITEM_H = 44;
const VISIBLE = 5; // 가운데 1줄 + 위아래 2줄씩
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

/**
 * 위아래로 굴려서 고르는 휠 한 줄 (iOS 알람 앱의 시간 선택처럼).
 * 웹·앱 모두 같은 모양으로 동작하도록 ScrollView로 직접 만든다.
 */
function WheelColumn({
  items,
  index,
  onChange,
  width,
}: {
  items: string[];
  index: number;
  onChange: (i: number) => void;
  width: number;
}) {
  const c = useTheme();
  const ref = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const [scrollY] = useState(() => new Animated.Value(index * ITEM_H));
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const last = useRef(index);

  // 처음 열 때 고른 값 위치로
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: index * ITEM_H, animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapTo = (y: number) => {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));
    ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
    if (i !== last.current) {
      last.current = i;
      onChange(i);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
    // 멈추면 가장 가까운 칸에 맞춘다 (웹은 관성 끝 이벤트가 없어서 잠깐 기다렸다가)
    clearTimeout(settle.current);
    settle.current = setTimeout(() => snapTo(y), Platform.OS === 'web' ? 120 : 60);
    const i = Math.round(y / ITEM_H);
    if (Platform.OS !== 'web' && i !== last.current && i >= 0 && i < items.length) Haptics.selectionAsync();
  };

  return (
    <View style={{ width, height: ITEM_H * VISIBLE }}>
      <Animated.ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: PAD }}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => snapTo(e.nativeEvent.contentOffset.y)}>
        {items.map((label, i) => {
          const center = i * ITEM_H;
          const opacity = scrollY.interpolate({
            inputRange: [center - ITEM_H * 2.5, center - ITEM_H, center, center + ITEM_H, center + ITEM_H * 2.5],
            outputRange: [0.15, 0.4, 1, 0.4, 0.15],
            extrapolate: 'clamp',
          });
          const scale = scrollY.interpolate({
            inputRange: [center - ITEM_H * 2, center, center + ITEM_H * 2],
            outputRange: [0.85, 1, 0.85],
            extrapolate: 'clamp',
          });
          return (
            <Pressable
              key={label + i}
              onPress={() => snapTo(center)}
              style={{ height: ITEM_H, justifyContent: 'center' }}>
              <Animated.Text
                style={{
                  opacity,
                  transform: [{ scale }],
                  textAlign: 'center',
                  fontFamily: Fonts.sans,
                  fontSize: 22,
                  fontWeight: '600',
                  letterSpacing: -0.4,
                  fontVariant: ['tabular-nums'],
                  color: c.text,
                }}>
                {label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')); // 00~23
/** 분은 5분 단위: 00, 05, 10 … 55 */
const MINUTE_STEP = 5;
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => String(i * MINUTE_STEP).padStart(2, '0'));

/** 'HH:MM' ↔ [시 0~23, 분 칸 번호 0~11]. 5분 단위가 아닌 예전 값(예: 18:37)은 가까운 5분으로 */
function split(t: string): [number, number] {
  const [h, m] = t.split(':').map(Number);
  let idx = Math.round(m / MINUTE_STEP);
  let hour = h;
  if (idx >= MINUTES.length) {
    idx = 0;
    hour = (h + 1) % 24;
  }
  return [hour, idx];
}
function join(hour: number, minuteIdx: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minuteIdx * MINUTE_STEP).padStart(2, '0')}`;
}

/**
 * 아래에서 올라오는 시간 선택 시트: 시(00~23) · 분(5분 단위) 휠.
 * "완료"를 누르면 onDone('HH:MM'). onClear를 주면 "알림 끄기" 버튼이 나온다.
 */
export function TimeWheelSheet({
  visible,
  value,
  title = '알림 시간',
  onDone,
  onClose,
  onClear,
}: {
  visible: boolean;
  value?: string;
  title?: string;
  onDone: (t: string) => void;
  onClose: () => void;
  onClear?: () => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState<[number, number]>(() => split(value ?? '21:00'));
  const guard = useSheetGuard(visible);

  // 열 때마다 현재 값으로 맞춘다
  const [openKey, setOpenKey] = useState(0);
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setSel(split(value ?? '21:00'));
      setOpenKey((k) => k + 1);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      // 웹은 닫힘 애니메이션 끝 이벤트를 기다리느라 늦게 닫힐 수 있어서 바로 열고 닫는다
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
          <T variant="small" color="muted">
            위아래로 굴려서 골라요
          </T>

          <View style={{ height: ITEM_H * VISIBLE, justifyContent: 'center' }}>
            {/* 가운데 선택 띠 */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: PAD,
                height: ITEM_H,
                borderRadius: Radius.md,
                backgroundColor: c.surfaceAlt,
              }}
            />
            <View key={openKey} style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <WheelColumn items={HOURS} index={sel[0]} width={80} onChange={(i) => setSel(([, m]) => [i, m])} />
              <View style={{ justifyContent: 'center' }}>
                <T variant="heading" color="muted">
                  :
                </T>
              </View>
              <WheelColumn items={MINUTES} index={sel[1]} width={80} onChange={(i) => setSel(([h]) => [h, i])} />
            </View>
          </View>

          {onClear ? (
            <Button
              title="알림 끄기"
              kind="text"
              onPress={guard(() => {
                onClear();
                onClose();
              })}
            />
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="취소" kind="grey" size="lg" style={{ flex: 1 }} onPress={guard(onClose)} />
            <Button
              title="완료"
              size="lg"
              style={{ flex: 2 }}
              onPress={guard(() => {
                onDone(join(...sel));
                onClose();
              })}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
