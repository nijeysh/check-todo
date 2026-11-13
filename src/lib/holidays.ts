import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

import type { DateKey } from './date';

/**
 * 공휴일 (설날·추석·대체공휴일·선거일 등).
 * 요일·날짜 계산은 기기에서 하고, 공휴일만 공공데이터포털 "한국천문연구원 특일 정보" API에서 가져온다.
 *
 * - 키: EXPO_PUBLIC_HOLIDAY_API_KEY (.env.local, .env.example 참고). 없으면 공휴일 없이 동작한다.
 * - 한 번 받은 해는 기기에 30일 동안 저장해 두고 다시 요청하지 않는다.
 */
const RAW_KEY = (process.env.EXPO_PUBLIC_HOLIDAY_API_KEY ?? '').trim().replace(/^["']|["']$/g, '');
// Encoding 키(%2B, %3D 등)를 넣어도 되도록 한 번 풀어 둔다 (요청할 때 URLSearchParams가 다시 인코딩)
const API_KEY = RAW_KEY.includes('%') ? decodeURIComponent(RAW_KEY) : RAW_KEY;
const ENDPOINT = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';
const CACHE_PREFIX = 'checktodo:holidays:';
const CACHE_DAYS = 30;

export type HolidayMap = Record<DateKey, string>;
export type HolidayStatus = 'no-key' | 'loading' | 'ready' | 'error';

const byYear = new Map<number, HolidayMap>();
const statusByYear = new Map<number, HolidayStatus>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  listeners.forEach((l) => l());
}

type ApiItem = { locdate: number | string; dateName: string; isHoliday: string };

function locdateToKey(n: number | string): DateKey {
  const s = String(n);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

async function fetchMonth(year: number, month: number): Promise<HolidayMap> {
  const qs = new URLSearchParams({
    serviceKey: API_KEY,
    solYear: String(year),
    solMonth: String(month).padStart(2, '0'),
    _type: 'json',
    numOfRows: '50',
  });
  const res = await fetch(`${ENDPOINT}?${qs}`);
  const json = await res.json().catch(() => null);
  // 키 오류 등은 { OpenAPI_ServiceResponse: { cmmMsgHeader: { errMsg, returnAuthMsg } } } 로 온다
  const apiErr = json?.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (apiErr) throw new Error(`holiday api: ${apiErr.errMsg} (${apiErr.returnAuthMsg})`);
  if (!res.ok) throw new Error(`holiday api ${res.status}`);
  const body = json?.response?.body;
  if (!body) throw new Error('holiday api: unexpected response');
  // 결과가 없으면 items가 빈 문자열, 하나면 객체, 여러 개면 배열로 온다
  const raw = body.items?.item;
  const items: ApiItem[] = !raw ? [] : Array.isArray(raw) ? raw : [raw];
  const out: HolidayMap = {};
  for (const it of items) {
    if (it.isHoliday !== 'Y') continue;
    const key = locdateToKey(it.locdate);
    out[key] = out[key] ? `${out[key]}, ${it.dateName}` : it.dateName;
  }
  return out;
}

async function loadYear(year: number) {
  if (statusByYear.has(year)) return;
  if (!API_KEY) {
    statusByYear.set(year, 'no-key');
    return;
  }
  statusByYear.set(year, 'loading');
  const cacheKey = CACHE_PREFIX + year;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { fetchedAt, data } = JSON.parse(cached) as { fetchedAt: number; data: HolidayMap };
      if (Date.now() - fetchedAt < CACHE_DAYS * 86_400_000) {
        byYear.set(year, data);
        statusByYear.set(year, 'ready');
        emit();
        return;
      }
    }
    const months = await Promise.all(Array.from({ length: 12 }, (_, i) => fetchMonth(year, i + 1)));
    const data: HolidayMap = Object.assign({}, ...months);
    byYear.set(year, data);
    statusByYear.set(year, 'ready');
    AsyncStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: Date.now(), data })).catch(() => {});
  } catch (e) {
    console.warn('공휴일을 불러오지 못했어요', e);
    statusByYear.set(year, 'error');
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** 해당 연도들의 공휴일. 처음 부를 때 불러오고, 불러오면 화면이 다시 그려진다 */
export function useHolidays(years: number[]): { holidays: HolidayMap; status: HolidayStatus } {
  useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
  const key = years.join(',');
  useEffect(() => {
    key.split(',').forEach((y) => loadYear(Number(y)));
  }, [key]);

  const holidays: HolidayMap = {};
  let status: HolidayStatus = 'ready';
  for (const y of years) {
    Object.assign(holidays, byYear.get(y));
    const s = statusByYear.get(y) ?? 'loading';
    if (s !== 'ready') status = s;
  }
  return { holidays, status };
}
