# CHECKTODO

매일 하는 체크리스트를 네모 칸에 체크하고 연속일 · 끊긴 날 · 며칠 만에 다시 했는지 보여주는 습관 트래커.
Expo(React Native) 한 프로젝트로 **웹 · iOS · Android**를 함께 만든다. 설계는 [DESIGN.md](DESIGN.md).

## 실행

```bash
npm install
npm run web       # 웹 (http://localhost:8081)
npm run ios       # iOS 시뮬레이터 (macOS 필요) 또는 Expo Go 앱으로 QR 스캔
npm run android
```

## 공휴일 (선택)

날짜·요일은 기기에서 계산하고, **공휴일만** 공공데이터포털 API에서 가져와요. 키가 없어도 앱은 동작하고 주말 색만 표시돼요.

1. [공공데이터포털 – 한국천문연구원 특일 정보](https://www.data.go.kr/data/15012690/openapi.do)에서 활용신청
2. 마이페이지에서 **일반 인증키 (Decoding)** 복사
3. `.env.example`을 `.env.local`로 복사하고 `EXPO_PUBLIC_HOLIDAY_API_KEY=` 뒤에 붙여넣기
4. 개발 서버 다시 시작

한 번 받은 연도는 기기에 30일 동안 저장해 두고 다시 요청하지 않아요.

## 구조

```
src/
├─ app/                  화면 (Expo Router: 파일 = 화면)
│  ├─ (tabs)/            하단 탭 / 데스크톱 사이드바
│  │  ├─ index.tsx       오늘
│  │  ├─ calendar.tsx    캘린더 (일 · 주 · 월 · 년)
│  │  ├─ grid.tsx        체크표 (항목 × 날짜)
│  │  ├─ stats.tsx       통계
│  │  └─ settings.tsx    설정
│  └─ habit/
│     ├─ [id].tsx        항목 상세 (달력, 연속 기록 흐름)
│     └─ edit.tsx        항목 추가/편집
├─ components/
│  ├─ app-tabs.tsx       iOS/Android 네이티브 탭바
│  ├─ app-tabs.web.tsx   웹 반응형 탭 (폰: 하단, 1024px~: 사이드바)
│  └─ ...
└─ lib/
   ├─ date.ts            'YYYY-MM-DD' 날짜 계산
   ├─ stats.ts           연속일 · 끊긴 날 · 며칠 만에 다시 (순수 함수)
   ├─ calendar.ts        날짜별 요약, 주·월 그리드 날짜
   ├─ holidays.ts        공휴일 (공공데이터포털 API + 기기 저장)
   └─ store.ts           로컬 저장 (웹: localStorage, 앱: 기기 저장소)
```

## 검사

```bash
npx tsc --noEmit
npx expo lint
```
