import '@/global.css';

import { Platform } from 'react-native';

/**
 * 기본 브랜드 색 (팬톤). 사용자가 설정 > 테마 색에서 바꿀 수 있고, 안 바꾸면 이 색을 쓴다.
 * - main: 버튼, 선택 표시, 오늘 표시, 진행 막대, 링크
 * - sub:  연속 기록 배지, 모두 완료, 그날만 할 일 표시 같은 보조 강조
 */
export const BRAND = {
  main: '#5A5B9F',
  mainName: 'Blue Iris (18-3943 TCX)',
  sub: '#F7CAC9',
  subName: 'Rose Quartz (13-1520 TCX)',
};

const INK = '#191F28';

/** hex 두 색을 t 비율로 섞는다 (0 = a, 1 = b) */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return (
    '#' +
    x
      .map((v, i) => Math.round(v + (y[i] - v) * t))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 대비 비율 */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** 이 색 위에 올릴 글씨 색: 흰색과 진한 색 중 더 잘 읽히는 쪽 */
export function textOn(bg: string): string {
  return contrast(bg, '#FFFFFF') >= contrast(bg, INK) ? '#FFFFFF' : INK;
}

/** 배경 위에서 글씨로 읽히도록(4.5:1) 색을 조금씩 어둡게(또는 밝게) 한다 */
function readableOn(color: string, bg: string, toward: string): string {
  let out = color;
  for (let t = 0.1; contrast(out, bg) < 4.5 && t <= 1; t += 0.1) out = mix(color, toward, t);
  return out;
}

/**
 * 색 체계: 밝은 회색 배경 위에 흰 카드, main 강조색 + sub 보조색, 글자는 회색 단계로 위계를 준다.
 * main/sub가 무엇이든 글씨가 읽히도록 accentInk(글씨용 main)와 onAccent(main 위 글씨)를 계산한다.
 */
export function buildPalette(scheme: 'light' | 'dark', main = BRAND.main, sub = BRAND.sub) {
  if (scheme === 'dark') {
    const surface = '#1C1C21';
    // 어두운 화면에서는 main을 조금 밝혀서 쓴다
    const accent = mix(main, '#FFFFFF', 0.2);
    return {
      main: accent,
      sub,
      subSoft: mix(sub, '#101013', 0.7),
      text: '#F2F2F5',
      textSecondary: '#C3C3C9',
      textMuted: '#8F8F99',
      textFaint: '#5F5F68',
      background: '#101013',
      surface,
      surfaceAlt: '#2A2A31',
      pressed: '#26262C',
      border: '#2A2A31',
      accent,
      onAccent: textOn(accent),
      accentInk: readableOn(accent, surface, '#FFFFFF'),
      accentSoft: mix(main, '#101013', 0.75),
      saturday: '#7EA4F2',
      danger: '#F25B67',
      dangerSoft: '#3A1F23',
      boxEmpty: '#34343C',
      boxOff: '#24242A',
      toast: '#3E3E46',
    };
  }
  return {
    main,
    sub,
    // 이미 밝은 sub(연핑크·베이지 등)는 그대로, 진한 sub는 연하게 풀어서 배지 배경으로 쓴다
    subSoft: luminance(sub) > 0.55 ? sub : mix(sub, '#FFFFFF', 0.75),
    text: INK,
    textSecondary: '#4E5968',
    textMuted: '#8B95A1',
    textFaint: '#B0B8C1',
    background: '#F2F4F6',
    surface: '#FFFFFF',
    surfaceAlt: '#F2F4F6',
    pressed: '#F2F4F6',
    border: '#E5E8EB',
    accent: main,
    onAccent: textOn(main),
    accentInk: readableOn(main, '#FFFFFF', INK),
    accentSoft: mix(main, '#FFFFFF', 0.88),
    saturday: '#3B6FD8',
    danger: '#F04452',
    dangerSoft: '#FFEEF0',
    boxEmpty: '#E5E8EB',
    boxOff: '#F2F4F6',
    toast: '#333D4B',
  };
}

export type Palette = ReturnType<typeof buildPalette>;

/**
 * 동그라미 안 숫자 세로 보정.
 * 웹 글꼴(Pretendard)은 위쪽 여백이 아래보다 커서, 줄 상자를 가운데 두어도 숫자 모양이 0.125em 아래에 그려진다.
 * (앱은 시스템 글꼴이라 보정하지 않음)
 */
export const glyphNudge = (fontSize: number) =>
  Platform.OS === 'web' ? { transform: [{ translateY: -fontSize * 0.125 }] } : null;

export const Fonts = Platform.select({
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
  default: { sans: undefined, mono: 'monospace' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { sm: 8, md: 12, lg: 20, xl: 24, full: 999 } as const;

/** 반응형 기준 폭 (DESIGN.md 5장) */
export const Breakpoints = { tablet: 640, desktop: 1024 } as const;

export const MaxContentWidth = 1100;
