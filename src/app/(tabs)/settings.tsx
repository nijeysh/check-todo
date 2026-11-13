import { router } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { IconButton } from '@/components/month-nav';
import { useToast } from '@/components/toast';
import { Button, ListRow, PageTitle, Screen, Section, T } from '@/components/ui';
import { findSwatch } from '@/constants/brand-colors';
import { BRAND, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm, exportText, pickTextFile } from '@/lib/platform';
import { actions, useAppData, useToday } from '@/lib/store';

const hourLabel = (h: number) => (h === 0 ? '자정' : `새벽 ${h}시`);

export default function SettingsScreen() {
  const c = useTheme();
  const { settings, habits } = useAppData();
  const today = useToday();
  const toast = useToast();
  const archived = habits.filter((h) => h.archivedAt);

  const rowIcon = (name: Parameters<typeof Icon>[0]['name'], color = c.textSecondary) => (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: Radius.md,
        backgroundColor: c.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={name} size={20} color={color} />
    </View>
  );

  return (
    <Screen header={<PageTitle title="설정" />} maxWidth={640}>
      <Section title="화면">
        <ListRow
          left={
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.main }} />
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: c.sub,
                  marginLeft: -8,
                  borderWidth: 2,
                  borderColor: c.surface,
                }}
              />
            </View>
          }
          title="테마 색"
          subtitle={`${findSwatch(settings.themeMain ?? BRAND.main)?.name ?? '직접 고른 색'} + ${findSwatch(settings.themeSub ?? BRAND.sub)?.name ?? '직접 고른 색'}`}
          chevron
          onPress={() => router.push('/theme')}
        />
      </Section>

      <Section title="하루 기준">
        <ListRow
          title="하루 시작 시각"
          subtitle="이 시각 전에 체크하면 전날로 기록돼요"
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <IconButton
                icon="minus"
                label="하루 시작 시각 줄이기"
                disabled={settings.dayStartHour <= 0}
                onPress={() => actions.updateSettings({ dayStartHour: settings.dayStartHour - 1 })}
              />
              <T variant="label" style={{ minWidth: 56, textAlign: 'center' }}>
                {hourLabel(settings.dayStartHour)}
              </T>
              <IconButton
                icon="plus"
                label="하루 시작 시각 늘리기"
                disabled={settings.dayStartHour >= 6}
                onPress={() => actions.updateSettings({ dayStartHour: settings.dayStartHour + 1 })}
              />
            </View>
          }
        />
        <ListRow
          title="주 시작 요일"
          subtitle="달력의 첫 칸"
          right={
            <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: Radius.md, padding: 3 }}>
              {(['일', '월'] as const).map((l, i) => {
                const on = settings.weekStartsOn === i;
                return (
                  <Pressable
                    key={l}
                    onPress={() => actions.updateSettings({ weekStartsOn: i as 0 | 1 })}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 7,
                      borderRadius: Radius.sm + 1,
                      backgroundColor: on ? c.surface : 'transparent',
                    }}>
                    <T variant="label" color={on ? undefined : 'muted'}>
                      {l}요일
                    </T>
                  </Pressable>
                );
              })}
            </View>
          }
        />
      </Section>

      {archived.length ? (
        <Section title="보관한 항목" caption="기록은 그대로 남아 있어요">
          {archived.map((h) => (
            <ListRow
              key={h.id}
              title={`${h.emoji ? h.emoji + ' ' : ''}${h.title}`}
              right={<Button title="꺼내기" kind="weak" size="sm" onPress={() => actions.setArchived(h.id, false)} />}
            />
          ))}
        </Section>
      ) : null}

      <Section title="데이터" caption="지금은 이 기기에만 저장돼요">
        <ListRow
          left={rowIcon('download')}
          title="백업 파일로 내보내기"
          chevron
          onPress={() => exportText(`checktodo-${today}.json`, actions.exportJson())}
        />
        {Platform.OS === 'web' ? (
          <ListRow
            left={rowIcon('upload')}
            title="백업 파일 불러오기"
            chevron
            onPress={async () => {
              const text = await pickTextFile();
              if (!text) return;
              if (!(await confirm('백업 불러오기', '지금 기록을 백업 파일 내용으로 바꿀까요?'))) return;
              try {
                actions.importJson(text);
                toast('백업을 불러왔어요');
              } catch (e) {
                toast(e instanceof Error ? e.message : '불러오지 못했어요');
              }
            }}
          />
        ) : null}
        <ListRow
          left={rowIcon('sparkles')}
          title="예시 데이터 넣기"
          chevron
          onPress={async () => {
            if (!habits.length || (await confirm('예시 데이터', '지금 항목을 예시 데이터로 바꿀까요?'))) {
              actions.loadSample();
              toast('예시 데이터를 넣었어요');
            }
          }}
        />
        <ListRow
          left={rowIcon('trash', c.danger)}
          title="모든 기록 지우기"
          titleColor="danger"
          onPress={async () => {
            if (await confirm('모든 기록 지우기', '모든 항목과 체크 기록을 지울까요? 되돌릴 수 없어요.', '삭제'))
              actions.resetAll();
          }}
        />
      </Section>
    </Screen>
  );
}
