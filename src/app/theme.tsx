import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StreakBadge } from '@/components/habit-row';
import { Segmented } from '@/components/segmented';
import { Button, ProgressBar, Screen, Section, T } from '@/components/ui';
import { findSwatch, SWATCH_FAMILIES, THEME_PRESETS } from '@/constants/brand-colors';
import { BRAND, Radius, textOn } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { actions, useAppData } from '@/lib/store';

type Slot = 'main' | 'sub';

/** 설정 > 테마 색: 팬톤 색 중에서 main / sub를 직접 고른다 */
export default function ThemeScreen() {
  const c = useTheme();
  const { settings } = useAppData();
  const main = settings.themeMain ?? BRAND.main;
  const sub = settings.themeSub ?? BRAND.sub;
  const [slot, setSlot] = useState<Slot>('main');
  const isDefault = main === BRAND.main && sub === BRAND.sub;

  const pick = (hex: string) => actions.updateSettings(slot === 'main' ? { themeMain: hex } : { themeSub: hex });

  const label = (hex: string) => {
    const s = findSwatch(hex);
    return s ? `${s.name} · ${s.code}` : hex;
  };

  return (
    <Screen maxWidth={640}>
      <Stack.Screen options={{ title: '' }} />
      <View style={{ gap: 6, paddingVertical: 8 }}>
        <T variant="display">테마 색</T>
        <T color="secondary">팬톤 색 중에서 앱의 대표 색(main)과 보조 색(sub)을 골라요.</T>
      </View>

      {/* 미리보기 */}
      <Section style={{ padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SlotChip
            title="main"
            hex={main}
            desc={label(main)}
            active={slot === 'main'}
            onPress={() => setSlot('main')}
          />
          <SlotChip title="sub" hex={sub} desc={label(sub)} active={slot === 'sub'} onPress={() => setSlot('sub')} />
        </View>
        <View style={{ backgroundColor: c.background, borderRadius: Radius.md, padding: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: c.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <T variant="label" color={c.onAccent}>
                ✓
              </T>
            </View>
            <T variant="label" style={{ flex: 1 }}>
              물 2L 마시기
            </T>
            <StreakBadge days={3} />
          </View>
          <ProgressBar value={1} color={c.sub} />
          <Button title="추가하기" size="md" />
        </View>
        {c.onAccent !== '#FFFFFF' ? (
          <T variant="caption" color="muted">
            밝은 main 색이라 버튼 글씨를 진한 색으로 바꿔 보여줘요.
          </T>
        ) : null}
      </Section>

      <Section title="추천 조합">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8 }}>
          {THEME_PRESETS.map((p) => {
            const on = p.main === main && p.sub === sub;
            return (
              <Pressable
                key={p.name}
                onPress={() => actions.updateSettings({ themeMain: p.main, themeSub: p.sub })}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 14,
                  height: 40,
                  borderRadius: Radius.full,
                  backgroundColor: on ? c.accentSoft : c.surfaceAlt,
                  borderWidth: 1.5,
                  borderColor: on ? c.accent : 'transparent',
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: p.main }} />
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: p.sub, marginLeft: -5 }} />
                </View>
                <T variant="small" color={on ? 'accent' : 'secondary'} style={{ fontWeight: '600' }}>
                  {p.name}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>
      </Section>

      <Section style={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
        <Segmented
          options={[
            ['main', 'main 색 고르기'],
            ['sub', 'sub 색 고르기'],
          ]}
          value={slot}
          onChange={setSlot}
        />
        {SWATCH_FAMILIES.map(({ family, swatches }) => (
          <View key={family} style={{ gap: 10 }}>
            <T variant="small" color="muted" style={{ fontWeight: '600' }}>
              {family}
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {swatches.map((s) => {
                const chosen = (slot === 'main' ? main : sub).toLowerCase() === s.hex.toLowerCase();
                return (
                  <Pressable
                    key={s.hex}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: chosen }}
                    accessibilityLabel={`${s.name} ${s.code}`}
                    onPress={() => pick(s.hex)}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: Radius.full,
                      backgroundColor: s.hex,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: chosen ? 3 : 1,
                      borderColor: chosen ? c.surface : c.border,
                      outlineColor: c.text,
                      outlineWidth: chosen ? 2 : 0,
                      outlineStyle: 'solid',
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                    })}>
                    {chosen ? (
                      <T variant="label" color={textOn(s.hex)}>
                        ✓
                      </T>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <T variant="caption" color="faint">
          색은 팬톤 색을 화면용으로 옮긴 근사값이에요.
        </T>
      </Section>

      {isDefault ? null : (
        <Button
          title="기본 색으로 되돌리기"
          kind="grey"
          onPress={() => actions.updateSettings({ themeMain: undefined, themeSub: undefined })}
        />
      )}
    </Screen>
  );
}

function SlotChip({
  title,
  hex,
  desc,
  active,
  onPress,
}: {
  title: string;
  hex: string;
  desc: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: Radius.md,
        borderWidth: 2,
        borderColor: active ? c.accent : c.border,
      }}>
      <View
        style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: hex, borderWidth: 1, borderColor: c.border }}
      />
      <View style={{ flex: 1 }}>
        <T variant="small" style={{ fontWeight: '700' }}>
          {title}
        </T>
        <T variant="caption" color="muted" numberOfLines={1}>
          {desc}
        </T>
      </View>
    </Pressable>
  );
}
