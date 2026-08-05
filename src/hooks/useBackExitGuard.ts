import { useEffect, useRef, useState } from 'react';

/**
 * 모바일에서 뒤로가기를 한 번 눌렀다고 사이트 밖으로 튕겨나가지 않게 막는다.
 * Android 앱 관례대로 "한 번 더 누르면 종료" 안내를 띄우고, 안내가 떠 있는 동안
 * 다시 누르면 그때 실제로 나간다.
 *
 * 동작 원리: 더미 history 항목을 하나 심어두면 첫 뒤로가기는 그 항목만 소비한다.
 * 소비된 더미를 즉시 다시 심어 화면을 유지하고, 확인 시간 안에 또 눌리면
 * 다시 심지 않고 history.back()으로 실제 이탈을 진행한다.
 */

/** 안내가 떠 있는 동안 다시 눌러야 종료된다. Android 기본값과 같은 2초. */
const EXIT_CONFIRM_WINDOW_MS = 2000;

/** 우리가 심어둔 더미 history 항목을 알아보기 위한 표식. */
const GUARD_MARK = '__aiBridgeBackGuard';

const GUARD_STATE = { [GUARD_MARK]: true } as const;

function isGuardEntry(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as Record<string, unknown>)[GUARD_MARK] === true
  );
}

/** 터치가 주 입력인 기기에서만 개입한다. 데스크톱 뒤로가기는 그대로 둔다. */
function isTouchPrimaryDevice(): boolean {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/**
 * 앱 내부 링크(`?lesson=` 등)는 전체 페이지 이동이라 history에 실제 항목을 남긴다.
 * 그런 경로로 들어온 화면에서는 뒤로가기가 사이트 안쪽으로 돌아가므로 개입하지 않는다.
 * 새로고침은 referrer가 자기 자신이 되지만 history 항목이 늘지 않으므로 제외한다.
 */
function cameFromInsideApp(): boolean {
  const referrer = document.referrer;
  if (!referrer || referrer === window.location.href) return false;
  return referrer.startsWith(`${window.location.origin}${import.meta.env.BASE_URL}`);
}

export function useBackExitGuard() {
  const [isExitHintVisible, setIsExitHintVisible] = useState(false);
  const confirmDeadlineRef = useRef(0);
  const hintTimerRef = useRef<number | null>(null);
  const isExitingRef = useRef(false);

  useEffect(() => {
    if (!isTouchPrimaryDevice() || cameFromInsideApp()) return;

    // StrictMode 이중 마운트나 bfcache 복원에서 더미가 겹쳐 쌓이지 않게 한다.
    if (!isGuardEntry(window.history.state)) {
      window.history.pushState(GUARD_STATE, '', window.location.href);
    }

    const handlePopState = () => {
      if (isExitingRef.current) return;

      const now = Date.now();
      if (now <= confirmDeadlineRef.current) {
        // 안내를 보고 다시 눌렀다 → 더미를 다시 심지 않고 실제로 사이트를 벗어난다.
        isExitingRef.current = true;
        setIsExitHintVisible(false);
        window.history.back();
        return;
      }

      confirmDeadlineRef.current = now + EXIT_CONFIRM_WINDOW_MS;
      setIsExitHintVisible(true);
      window.history.pushState(GUARD_STATE, '', window.location.href);

      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = window.setTimeout(() => {
        setIsExitHintVisible(false);
        hintTimerRef.current = null;
      }, EXIT_CONFIRM_WINDOW_MS);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  return isExitHintVisible;
}
