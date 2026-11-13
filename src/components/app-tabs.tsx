import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

/** iOS / Android: 시스템 기본 하단 탭바 */
export default function AppTabs() {
  const c = useTheme();
  return (
    <NativeTabs
      backgroundColor={c.surface}
      indicatorColor={c.accentSoft}
      iconColor={{ default: c.textFaint, selected: c.text }}
      labelStyle={{ default: { color: c.textFaint }, selected: { color: c.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>오늘</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'checkmark.square', selected: 'checkmark.square.fill' }}
          md="check_box"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>캘린더</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grid">
        <NativeTabs.Trigger.Label>체크표</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.3x3', selected: 'square.grid.3x3.fill' }} md="grid_on" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>통계</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>설정</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
