import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';

type CloseTimer = {
  scheduleClose: (fn: () => void, delayMs: number) => void;
};

function clearTimer(
  timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
): ReturnType<typeof setTimeout> | null {
  if (timerRef.current) clearTimeout(timerRef.current);
  return null;
}

export default function useCloseTimer(): CloseTimer {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    (): (() => void) => () => {
      timerRef.current = clearTimer(timerRef);
    },
    []
  );

  const scheduleClose = useCallback((fn: () => void, delayMs: number) => {
    timerRef.current = clearTimer(timerRef);
    timerRef.current = setTimeout(fn, delayMs);
  }, []);

  return { scheduleClose };
}
