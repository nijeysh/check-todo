import { planReminders } from './reminders';
import { getData, getToday, subscribeData, subscribeToday } from './store';

/**
 * 웹 알림: 브라우저에는 "정해진 시각에 예약" 기능이 없어서,
 * 이 탭이 열려 있는 동안만 타이머로 브라우저 알림을 띄운다.
 * (탭을 닫아도 받으려면 서버 웹 푸시가 필요 — 나중 단계)
 */
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export const notificationsNote = '웹에서는 이 탭이 열려 있을 때만 알려요';

const supported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function getPermission(): Promise<PermissionState> {
  if (!supported()) return 'unsupported';
  const p = Notification.permission;
  return p === 'granted' ? 'granted' : p === 'denied' ? 'denied' : 'undetermined';
}

export async function requestPermission(): Promise<PermissionState> {
  if (!supported()) return 'unsupported';
  if (Notification.permission === 'default') await Notification.requestPermission();
  const perm = await getPermission();
  if (perm === 'granted') sync();
  return perm;
}

export function openNotificationSettings() {
  // 브라우저는 사이트 설정을 코드로 열 수 없다. 주소창 왼쪽 자물쇠 아이콘에서 바꾼다.
}

function show(title: string, body: string) {
  try {
    new Notification(title, { body, tag: title + body });
  } catch (e) {
    console.warn('알림 표시 실패', e);
  }
}

export async function sendTestNotification(seconds = 10): Promise<PermissionState> {
  const perm = await requestPermission();
  if (perm === 'granted') setTimeout(() => show('CHECKTODO 테스트 알림', '알림이 잘 와요! 🔔'), seconds * 1000);
  return perm;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const DAY_MS = 86_400_000;

function sync() {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  if (!supported() || Notification.permission !== 'granted') return;
  const now = Date.now();
  // 브라우저 타이머는 너무 먼 미래를 다루지 못하니 24시간 안의 것만
  for (const r of planReminders(getData(), getToday())) {
    const delay = r.date.getTime() - now;
    if (delay > DAY_MS) break;
    timers.set(
      r.id,
      setTimeout(() => show(r.title, r.body), delay),
    );
  }
}

let started = false;
export function startReminderSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  subscribeData(sync);
  subscribeToday(sync);
  sync();
}
