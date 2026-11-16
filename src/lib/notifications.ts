import * as Notifications from 'expo-notifications';
import { AppState, Linking } from 'react-native';

import { planReminders } from './reminders';
import { getData, getToday, subscribeData, subscribeToday } from './store';

/**
 * 앱(iOS/Android) 알림: 기기 안에서 예약(로컬 알림). 서버 없이 앱을 꺼 둬도 울린다.
 * 데이터가 바뀔 때마다 앞으로 7일치 계획을 다시 만들어 예약을 갈아끼운다.
 */
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

const OUR_PREFIX = 'ctd-';

// 앱을 보고 있을 때도 배너로 보여준다
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationsNote = null;

export async function getPermission(): Promise<PermissionState> {
  const p = await Notifications.getPermissionsAsync();
  return p.granted ? 'granted' : p.status === 'undetermined' ? 'undetermined' : 'denied';
}

/** 권한 요청. 이미 거절했으면 시스템이 다시 묻지 않으므로 설정 앱을 열어야 한다 */
export async function requestPermission(): Promise<PermissionState> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  const p = await Notifications.requestPermissionsAsync();
  if (p.granted) syncSoon();
  return p.granted ? 'granted' : 'denied';
}

export function openNotificationSettings() {
  Linking.openSettings();
}

export async function sendTestNotification(seconds = 10): Promise<PermissionState> {
  const perm = await requestPermission();
  if (perm !== 'granted') return perm;
  await Notifications.scheduleNotificationAsync({
    identifier: `test-${Date.now()}`,
    content: { title: 'CHECKTODO 테스트 알림', body: '알림이 잘 와요! 🔔', sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
  return perm;
}

let syncing = false;
let pending = false;

async function sync() {
  if (syncing) {
    pending = true;
    return;
  }
  syncing = true;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    const plan = planReminders(getData(), getToday());
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    // 우리가 예약한 것만 지우고 다시 예약 (테스트 알림은 그대로)
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(OUR_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    for (const r of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.date },
      });
    }
  } catch (e) {
    console.warn('알림 예약 실패', e);
  } finally {
    syncing = false;
    if (pending) {
      pending = false;
      syncSoon();
    }
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
/** 체크를 연달아 눌러도 한 번만 다시 예약하도록 잠깐 기다렸다가 */
function syncSoon() {
  clearTimeout(timer);
  timer = setTimeout(sync, 800);
}

let started = false;
export function startReminderSync() {
  if (started) return;
  started = true;
  subscribeData(syncSoon);
  subscribeToday(syncSoon);
  AppState.addEventListener('change', (s) => s === 'active' && syncSoon());
  syncSoon();
}
