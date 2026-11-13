import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { T } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLayoutSize, useTheme } from '@/hooks/use-theme';

const TABS: {
  name: string;
  href: '/' | '/calendar' | '/grid' | '/stats' | '/settings';
  label: string;
  icon: IconName;
}[] = [
  { name: 'index', href: '/', label: '오늘', icon: 'today' },
  { name: 'calendar', href: '/calendar', label: '캘린더', icon: 'calendar' },
  { name: 'grid', href: '/grid', label: '체크표', icon: 'grid' },
  { name: 'stats', href: '/stats', label: '통계', icon: 'stats' },
  { name: 'settings', href: '/settings', label: '설정', icon: 'settings' },
];

/**
 * 웹: 반응형 탭.
 * - 데스크톱(1024px~): 왼쪽 사이드바
 * - 폰·태블릿: 하단 탭바
 */
export default function AppTabs() {
  const c = useTheme();
  const wide = useLayoutSize() === 'desktop';
  return (
    <Tabs style={{ flex: 1, flexDirection: wide ? 'row' : 'column-reverse', backgroundColor: c.background }}>
      <TabList asChild>
        <NavBar wide={wide}>
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
              <TabButton wide={wide} icon={t.icon}>
                {t.label}
              </TabButton>
            </TabTrigger>
          ))}
        </NavBar>
      </TabList>
      <TabSlot style={{ flex: 1 }} />
    </Tabs>
  );
}

function NavBar({ wide, children, ...props }: ComponentProps<typeof View> & { wide: boolean }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      {...props}
      style={[
        wide
          ? { width: 240, paddingVertical: Spacing.five, paddingHorizontal: Spacing.three, gap: 4 }
          : {
              flexDirection: 'row',
              paddingTop: 6,
              paddingBottom: insets.bottom + 6,
              borderTopWidth: 1,
              borderTopColor: c.border,
            },
        { backgroundColor: c.surface },
      ]}>
      {wide ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 20 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <T variant="label" color={c.onAccent} style={{ fontWeight: '900' }}>
              ✓
            </T>
          </View>
          <T variant="heading" style={{ fontWeight: '800' }}>
            CHECKTODO
          </T>
        </View>
      ) : null}
      {children}
    </View>
  );
}

function TabButton({
  wide,
  icon,
  children,
  isFocused,
  ...props
}: Omit<TabTriggerSlotProps, 'children'> &
  Omit<ComponentProps<typeof Pressable>, 'children' | 'style'> & {
    wide: boolean;
    icon: IconName;
    children: ReactNode;
  }) {
  const c = useTheme();
  const color = isFocused ? c.text : c.textFaint;
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        wide
          ? {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: Radius.md,
              backgroundColor: isFocused || pressed ? c.surfaceAlt : 'transparent',
            }
          : { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 2 },
        { transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}>
      <Icon name={icon} size={wide ? 22 : 24} color={wide && isFocused ? c.accentInk : color} />
      <T
        variant={wide ? 'label' : 'caption'}
        color={wide ? (isFocused ? c.text : c.textMuted) : color}
        style={{ fontWeight: isFocused ? '700' : '500' }}>
        {children}
      </T>
    </Pressable>
  );
}
