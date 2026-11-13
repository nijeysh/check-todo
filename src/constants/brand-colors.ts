/**
 * 테마 색 고르기에 쓰는 팬톤 색 모음.
 * hex는 팬톤 색을 화면용(sRGB)으로 옮긴 근사값이다. 인쇄물에는 Pantone 공식 칩으로 확인할 것.
 */
export interface Swatch {
  name: string;
  code: string;
  hex: string;
}

export const SWATCH_FAMILIES: { family: string; swatches: Swatch[] }[] = [
  {
    family: '청색',
    swatches: [
      { name: 'Blue Iris', code: '18-3943 TCX', hex: '#5A5B9F' },
      { name: 'Classic Blue', code: '19-4052 TCX', hex: '#0F4C81' },
      { name: 'Navy', code: 'PANTONE 289 C', hex: '#0C2340' },
      { name: 'Royal', code: 'PANTONE 2728 C', hex: '#0047BB' },
      { name: 'Clear Blue', code: 'PANTONE 285 C', hex: '#0072CE' },
      { name: 'Turquoise', code: '15-5519 TCX', hex: '#45B5AA' },
      { name: 'Cerulean', code: '15-4020 TCX', hex: '#9BB7D4' },
      { name: 'Serenity', code: '15-3919 TCX', hex: '#92A8D1' },
      { name: 'Aqua Sky', code: '14-4811 TCX', hex: '#7BC4C4' },
    ],
  },
  {
    family: '베이지',
    swatches: [
      { name: 'Mocha Mousse', code: '17-1230 TCX', hex: '#A47864' },
      { name: 'Khaki', code: 'PANTONE 7502 C', hex: '#CEB888' },
      { name: 'Latte', code: 'PANTONE 4685 C', hex: '#E0C6AD' },
      { name: 'Sand Dollar', code: '13-1106 TCX', hex: '#DECDBE' },
      { name: 'Stone', code: 'PANTONE 7527 C', hex: '#D6D2C4' },
      { name: 'Cream', code: 'PANTONE 7506 C', hex: '#EFDBB2' },
      { name: 'Cloud Dancer', code: '11-4201 TCX', hex: '#F0EEE9' },
    ],
  },
  {
    family: '노랑',
    swatches: [
      { name: 'Mimosa', code: '14-0848 TCX', hex: '#F0C05A' },
      { name: 'Illuminating', code: '13-0647 TCX', hex: '#F5DF4D' },
      { name: 'Lemon', code: 'PANTONE 109 C', hex: '#FFD100' },
      { name: 'Sunflower', code: 'PANTONE 123 C', hex: '#FFC72C' },
      { name: 'Marigold', code: 'PANTONE 1235 C', hex: '#FFB81C' },
      { name: 'Butter', code: 'PANTONE 7401 C', hex: '#F5E1A4' },
    ],
  },
  {
    family: '초록',
    swatches: [
      { name: 'Forest', code: 'PANTONE 3425 C', hex: '#006341' },
      { name: 'Green', code: 'PANTONE 356 C', hex: '#007A33' },
      { name: 'Emerald', code: '17-5641 TCX', hex: '#009473' },
      { name: 'Jade', code: 'PANTONE 3268 C', hex: '#00AB84' },
      { name: 'Spring', code: 'PANTONE 7480 C', hex: '#00BF6F' },
      { name: 'Greenery', code: '15-0343 TCX', hex: '#88B04B' },
      { name: 'Sage', code: 'PANTONE 7494 C', hex: '#9CAF88' },
      { name: 'Mint', code: 'PANTONE 337 C', hex: '#8FD6BD' },
    ],
  },
  {
    family: '핑크',
    swatches: [
      { name: 'Rose Quartz', code: '13-1520 TCX', hex: '#F7CAC9' },
      { name: 'Peach Fuzz', code: '13-1023 TCX', hex: '#FFBE98' },
      { name: 'Blush', code: 'PANTONE 698 C', hex: '#F7CED7' },
      { name: 'Petal', code: 'PANTONE 7422 C', hex: '#F4CDD4' },
      { name: 'Candy', code: 'PANTONE 189 C', hex: '#F8A3BC' },
      { name: 'Orchid Pink', code: 'PANTONE 203 C', hex: '#ECB3CB' },
      { name: 'Living Coral', code: '16-1546 TCX', hex: '#FF6F61' },
      { name: 'Fuchsia Rose', code: '17-2031 TCX', hex: '#C74375' },
      { name: 'Barbie Pink', code: 'PANTONE 219 C', hex: '#DA1884' },
    ],
  },
];

const ALL = SWATCH_FAMILIES.flatMap((f) => f.swatches);

export function findSwatch(hex: string): Swatch | undefined {
  return ALL.find((s) => s.hex.toLowerCase() === hex.toLowerCase());
}

/** 추천 조합 (첫 번째가 앱 기본) */
export const THEME_PRESETS: { name: string; main: string; sub: string }[] = [
  { name: '아이리스 + 로즈 쿼츠', main: '#5A5B9F', sub: '#F7CAC9' },
  { name: '네이비 + 샌드', main: '#0F4C81', sub: '#DECDBE' },
  { name: '에메랄드 + 미모사', main: '#009473', sub: '#F0C05A' },
  { name: '포레스트 + 버터', main: '#006341', sub: '#F5E1A4' },
  { name: '모카 + 크림', main: '#A47864', sub: '#EFDBB2' },
  { name: '터쿼이즈 + 피치', main: '#45B5AA', sub: '#FFBE98' },
  { name: '로열 + 선플라워', main: '#0047BB', sub: '#FFC72C' },
  { name: '퓨셔 로즈 + 세레니티', main: '#C74375', sub: '#92A8D1' },
];
