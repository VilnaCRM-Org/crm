import { useCallback, useEffect, useRef } from 'react';

type CloseTimer = {
  scheduleClose: (fn: () => void, delayMs: number) => void;
};

export default function useCloseTimer(): CloseTimer {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    (): (() => void) => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    []
  );

  const scheduleClose = useCallback((fn: () => void, delayMs: number) => {
    timerRef.current = setTimeout(fn, delayMs);
  }, []);

  return { scheduleClose };
}
