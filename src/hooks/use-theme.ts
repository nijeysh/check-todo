import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { BRAND, Breakpoints, buildPalette, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppData } from '@/lib/store';

/** 지금 색 체계. 설정 > 테마 색에서 고른 main/sub를 반영한다 */
export function useTheme(): Palette {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { settings } = useAppData();
  const main = settings.themeMain ?? BRAND.main;
  const sub = settings.themeSub ?? BRAND.sub;
  return useMemo(() => buildPalette(scheme, main, sub), [scheme, main, sub]);
}

export type LayoutSize = 'phone' | 'tablet' | 'desktop';

/** 화면 폭에 따른 레이아웃 구분 */
export function useLayoutSize(): LayoutSize {
  const { width } = useWindowDimensions();
  if (width >= Breakpoints.desktop) return 'desktop';
  if (width >= Breakpoints.tablet) return 'tablet';
  return 'phone';
}
