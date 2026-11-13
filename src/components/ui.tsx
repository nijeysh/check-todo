import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useLayoutSize, useTheme } from '@/hooks/use-theme';

/* ───────── 글자 ───────── */

type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'small' | 'caption' | 'number';
type TextColor = 'secondary' | 'muted' | 'faint' | 'accent' | 'danger' | (string & {});

export function T({
  variant = 'body',
  color,
  style,
  ...props
}: TextProps & { variant?: TextVariant; color?: TextColor }) {
  const c = useTheme();
  const map: Record<string, string> = {
    secondary: c.textSecondary,
    muted: c.textMuted,
    faint: c.textFaint,
    accent: c.accentInk,
    danger: c.danger,
  };
  const resolved = color ? (map[color] ?? color) : c.text;
  return <Text {...props} style={[textStyles.base, textStyles[variant], { color: resolved }, style]} />;
}

const textStyles = StyleSheet.create({
  base: { fontFamily: Fonts.sans },
  display: { fontSize: 28, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.6 },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: -0.2 },
  bodyStrong: { fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.3 },
  label: { fontSize: 15, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  small: { fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
  caption: { fontSize: 12, lineHeight: 16 },
  number: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
});

/* ───────── 눌림 효과 ───────── */

/** 누르면 살짝 작아지고 배경이 어두워지는 Pressable */
export function Tap({
  children,
  style,
  pressedBg = true,
  ...props
}: PressableProps & { style?: StyleProp<ViewStyle>; pressedBg?: boolean; children: ReactNode }) {
  const c = useTheme();
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        style,
        pressed && { transform: [{ scale: 0.98 }] },
        pressed && pressedBg && { backgroundColor: c.pressed },
      ]}>
      {children}
    </Pressable>
  );
}

/* ───────── 화면 틀 ───────── */

/**
 * 화면 기본 틀: 안전영역 + 스크롤 + 최대 폭.
 * bottom을 주면 화면 아래에 고정 버튼 영역이 생긴다.
 */
export function Screen({
  children,
  scroll = true,
  header,
  bottom,
  maxWidth = MaxContentWidth,
  background,
}: {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  bottom?: ReactNode;
  maxWidth?: number;
  /** 배경색 (기본: 회색 페이지 배경). 입력 폼은 흰 배경을 쓴다 */
  background?: string;
}) {
  const c = useTheme();
  const size = useLayoutSize();
  const bg = background ?? c.background;
  const pad = size === 'phone' ? 20 : Spacing.five;
  const inner = (
    <View
      style={{
        width: '100%',
        maxWidth,
        alignSelf: 'center',
        paddingHorizontal: pad,
        paddingTop: size === 'phone' ? Spacing.three : Spacing.five,
        gap: Spacing.three,
      }}>
      {header}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottom ? 120 : Spacing.six }}
          keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
      {bottom ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: bg }}>
          <View style={{ width: '100%', maxWidth, alignSelf: 'center', padding: pad, paddingTop: 12 }}>{bottom}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/** 페이지 큰 제목 영역 */
export function PageTitle({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <View style={{ gap: 6, paddingVertical: Spacing.two }}>
      {eyebrow ? (
        <T variant="label" color="muted">
          {eyebrow}
        </T>
      ) : null}
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.three }}>
        <T variant="display" style={{ flex: 1 }}>
          {title}
        </T>
        {right}
      </View>
    </View>
  );
}

/* ───────── 카드 / 구역 ───────── */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderRadius: Radius.lg, padding: 20 }, style]}>{children}</View>;
}

/** 제목이 있는 흰 카드 구역. 안에는 ListRow를 넣는다 */
export function Section({
  title,
  caption,
  right,
  children,
  style,
}: {
  title?: string;
  caption?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: Radius.lg, paddingVertical: 12 }, style]}>
      {title ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 8,
          }}>
          <View style={{ gap: 2, flex: 1 }}>
            <T variant="heading">{title}</T>
            {caption ? (
              <T variant="small" color="muted">
                {caption}
              </T>
            ) : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** 구역 안의 한 줄 */
export function ListRow({
  left,
  title,
  subtitle,
  right,
  onPress,
  chevron,
  titleColor,
}: {
  left?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  titleColor?: TextColor;
}) {
  const c = useTheme();
  const body = (
    <>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        {typeof title === 'string' ? (
          <T variant="bodyStrong" color={titleColor} numberOfLines={1}>
            {title}
          </T>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <T variant="small" color="muted" numberOfLines={1}>
            {subtitle}
          </T>
        ) : (
          subtitle
        )}
      </View>
      {right}
      {chevron ? <Icon name="chevronRight" size={20} color={c.textFaint} /> : null}
    </>
  );
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radius.md,
  };
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Tap onPress={onPress} style={style}>
      {body}
    </Tap>
  );
}

/* ───────── 버튼 ───────── */

type ButtonKind = 'primary' | 'weak' | 'grey' | 'danger' | 'text';
type ButtonSize = 'lg' | 'md' | 'sm';

export function Button({
  title,
  kind = 'primary',
  size = 'md',
  icon,
  style,
  ...props
}: PressableProps & {
  title: string;
  kind?: ButtonKind;
  size?: ButtonSize;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const bg = { primary: c.accent, weak: c.accentSoft, grey: c.surfaceAlt, danger: c.dangerSoft, text: 'transparent' }[
    kind
  ];
  const fg = { primary: c.onAccent, weak: c.accentInk, grey: c.textSecondary, danger: c.danger, text: c.accentInk }[
    kind
  ];
  const dims = {
    lg: { height: 56, radius: Radius.md + 4, px: 20, font: 17 },
    md: { height: 44, radius: Radius.md, px: 16, font: 15 },
    sm: { height: 34, radius: Radius.sm + 2, px: 12, font: 13 },
  }[size];
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [
        {
          height: dims.height,
          paddingHorizontal: dims.px,
          borderRadius: dims.radius,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: props.disabled ? 0.35 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !props.disabled ? 0.97 : 1 }],
        },
        style,
      ]}>
      {icon ? <Icon name={icon} size={dims.font + 3} color={fg} /> : null}
      <Text style={{ fontFamily: Fonts.sans, color: fg, fontSize: dims.font, fontWeight: '600', letterSpacing: -0.2 }}>
        {title}
      </Text>
    </Pressable>
  );
}

/* ───────── 숫자 타일 ───────── */

export function StatTile({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: string;
}) {
  const c = useTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 140,
        gap: 4,
        backgroundColor: c.surfaceAlt,
        borderRadius: Radius.md,
        padding: 16,
      }}>
      <T variant="small" color="muted">
        {label}
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <T variant="number" color={tone}>
          {value}
        </T>
        {unit ? (
          <T variant="label" color="secondary">
            {unit}
          </T>
        ) : null}
      </View>
      {hint ? (
        <T variant="caption" color="muted">
          {hint}
        </T>
      ) : null}
    </View>
  );
}

/** 얇은 진행 막대 */
export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const c = useTheme();
  return (
    <View style={{ height, backgroundColor: c.boxEmpty, borderRadius: height, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          height: '100%',
          backgroundColor: color ?? c.accent,
          borderRadius: height,
        }}
      />
    </View>
  );
}

/* ───────── 입력 ───────── */

/** 밑줄형 큰 입력칸 */
export const inputStyle = (c: ReturnType<typeof useTheme>, focused = false): TextStyle => ({
  borderBottomWidth: 2,
  borderBottomColor: focused ? c.accent : c.border,
  paddingVertical: 10,
  fontSize: 20,
  fontWeight: '600',
  letterSpacing: -0.4,
  color: c.text,
  fontFamily: Fonts.sans,
});

/** 회색 상자형 입력칸 */
export const boxInputStyle = (c: ReturnType<typeof useTheme>): TextStyle => ({
  backgroundColor: c.surfaceAlt,
  borderRadius: Radius.md,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: c.text,
  fontFamily: Fonts.sans,
});
