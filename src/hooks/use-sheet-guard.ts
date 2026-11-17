import { useEffect, useRef } from 'react';

/**
 * 시트가 막 열린 직후의 누르기는 무시한다.
 * 웹에서 버튼을 눌러 시트를 열면, 같은 클릭이 방금 나타난 시트의 버튼(취소·날짜 등)에 한 번 더 닿아
 * 시트가 바로 닫히거나 엉뚱한 값이 골라질 수 있다.
 */
export function useSheetGuard(visible: boolean, ms = 350) {
  const openedAt = useRef(0);
  useEffect(() => {
    if (visible) openedAt.current = Date.now();
  }, [visible]);
  return <A extends unknown[]>(fn: (...args: A) => void) =>
    (...args: A) => {
      if (Date.now() - openedAt.current < ms) return;
      fn(...args);
    };
}
