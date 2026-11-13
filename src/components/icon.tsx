import { SymbolView } from 'expo-symbols';

/** iOS는 SF Symbols, Android·웹은 Material Symbols */
const ICONS = {
  today: { ios: 'checkmark.square.fill', md: 'check_box' },
  grid: { ios: 'square.grid.3x3.fill', md: 'grid_view' },
  stats: { ios: 'chart.bar.fill', md: 'bar_chart' },
  settings: { ios: 'gearshape.fill', md: 'settings' },
  chevronRight: { ios: 'chevron.right', md: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', md: 'chevron_left' },
  plus: { ios: 'plus', md: 'add' },
  close: { ios: 'xmark', md: 'close' },
  minus: { ios: 'minus', md: 'remove' },
  repeat: { ios: 'arrow.triangle.2.circlepath', md: 'autorenew' },
  pin: { ios: 'pin.fill', md: 'push_pin' },
  calendar: { ios: 'calendar', md: 'calendar_month' },
  download: { ios: 'square.and.arrow.up', md: 'download' },
  upload: { ios: 'square.and.arrow.down', md: 'upload' },
  sparkles: { ios: 'sparkles', md: 'auto_awesome' },
  trash: { ios: 'trash', md: 'delete' },
  archive: { ios: 'archivebox', md: 'archive' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const i = ICONS[name];
  return <SymbolView name={{ ios: i.ios, android: i.md, web: i.md }} size={size} tintColor={color} />;
}
