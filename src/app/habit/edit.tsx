import { useLocalSearchParams } from 'expo-router';

import { HabitForm } from '@/components/habit-form';
import { useAppData } from '@/lib/store';
import type { HabitKind } from '@/lib/types';

/** 루틴 / 할 일 추가·수정 화면 (id 파라미터가 있으면 수정) */
export default function HabitEditScreen() {
  const params = useLocalSearchParams<{ id?: string; kind?: HabitKind }>();
  const { habits } = useAppData();
  const existing = habits.find((h) => h.id === params.id);
  return <HabitForm key={existing?.id ?? 'new'} existing={existing} initialKind={params.kind} />;
}
