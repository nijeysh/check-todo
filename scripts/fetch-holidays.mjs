#!/usr/bin/env node
/**
 * 공휴일 API 호출 예시 (공공데이터포털 "한국천문연구원 특일 정보" getRestDeInfo).
 *
 *   node scripts/fetch-holidays.mjs 2026          # 2026년 공휴일 출력
 *   node scripts/fetch-holidays.mjs 2026 --json   # JSON으로 출력
 *
 * 키는 .env.local 의 EXPO_PUBLIC_HOLIDAY_API_KEY (일반 인증키 Decoding) 를 읽는다.
 * 앱(src/lib/holidays.ts)도 같은 방식으로 호출한다.
 */
import { readFileSync } from 'node:fs';

const ENDPOINT = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

function readKey() {
  let key = process.env.EXPO_PUBLIC_HOLIDAY_API_KEY ?? '';
  if (!key) {
    try {
      const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
      key = env.match(/^EXPO_PUBLIC_HOLIDAY_API_KEY=(.*)$/m)?.[1]?.trim() ?? '';
    } catch {
      key = '';
    }
  }
  // Encoding 키(%2B, %3D 등)를 넣어도 되도록 한 번 풀어 둔다 (요청할 때 다시 인코딩됨)
  key = key.replace(/^["']|["']$/g, '');
  return key.includes('%') ? decodeURIComponent(key) : key;
}

async function fetchMonth(key, year, month) {
  const qs = new URLSearchParams({
    serviceKey: key,
    solYear: String(year),
    solMonth: String(month).padStart(2, '0'),
    _type: 'json',
    numOfRows: '50',
  });
  const res = await fetch(`${ENDPOINT}?${qs}`);
  const json = await res.json().catch(() => null);
  // 키 오류 등은 { OpenAPI_ServiceResponse: { cmmMsgHeader: { errMsg, returnAuthMsg } } } 로 온다
  const err = json?.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (err) throw new Error(`${err.errMsg} (${err.returnAuthMsg})`);
  const header = json?.response?.header;
  if (!res.ok || header?.resultCode !== '00') throw new Error(`HTTP ${res.status} ${header?.resultMsg ?? ''}`);
  // 결과가 없으면 items가 빈 문자열, 하나면 객체, 여러 개면 배열
  const raw = json.response.body.items?.item;
  const items = !raw ? [] : Array.isArray(raw) ? raw : [raw];
  return items
    .filter((it) => it.isHoliday === 'Y')
    .map((it) => {
      const s = String(it.locdate);
      return { date: `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`, name: it.dateName };
    });
}

const year = Number(process.argv[2] ?? new Date().getFullYear());
const asJson = process.argv.includes('--json');
const key = readKey();
if (!key) {
  console.error('키가 없어요. .env.example 을 .env.local 로 복사하고 EXPO_PUBLIC_HOLIDAY_API_KEY 를 넣어 주세요.');
  process.exit(1);
}

try {
  const months = await Promise.all(Array.from({ length: 12 }, (_, i) => fetchMonth(key, year, i + 1)));
  const list = months.flat();
  if (asJson) {
    console.log(JSON.stringify(list, null, 2));
  } else {
    const wd = ['일', '월', '화', '수', '목', '금', '토'];
    console.log(`${year}년 공휴일 ${list.length}일`);
    for (const h of list) console.log(`  ${h.date} (${wd[new Date(h.date + 'T00:00:00').getDay()]})  ${h.name}`);
  }
} catch (e) {
  console.error('공휴일을 불러오지 못했어요:', e.message);
  // process.exit()은 남은 요청이 끝나기 전에 끊어서 Windows에서 Node가 비정상 종료될 수 있다
  process.exitCode = 1;
}
