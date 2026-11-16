import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { ToastProvider } from '@/components/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { startReminderSync } from '@/lib/notifications';
import { hydrate, useHydrated } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const hydrated = useHydrated();
  const c = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    hydrate().finally(() => {
      SplashScreen.hideAsync();
      // 저장된 데이터를 읽은 뒤 알림 예약을 맞춘다 (권한이 있을 때만)
      startReminderSync();
    });
  }, []);

  if (!hydrated) return null;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: c.accent,
          background: c.background,
          card: c.surface,
          text: c.text,
          border: c.border,
        },
      }}>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerTintColor: c.text,
            headerStyle: { backgroundColor: c.background },
            contentStyle: { backgroundColor: c.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'CHECKTODO' }} />
          <Stack.Screen name="habit/[id]" options={{ title: '' }} />
          <Stack.Screen name="theme" options={{ title: '' }} />
          <Stack.Screen
            name="habit/edit"
            options={{ presentation: 'modal', title: '', headerStyle: { backgroundColor: c.surface } }}
          />
        </Stack>
      </ToastProvider>
    </ThemeProvider>
  );
}
