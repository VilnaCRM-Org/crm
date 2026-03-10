import { startTransition, useEffect, useState } from 'react';

const IDLE_TIMEOUT_MS = 150;
const FALLBACK_DELAY_MS = 0;

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

export default function useDeferredRender(): boolean {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const currentWindow = window as IdleWindow;

    if (typeof currentWindow.requestIdleCallback === 'function') {
      const idleHandle = currentWindow.requestIdleCallback(
        () => {
          startTransition(() => {
            setShouldRender(true);
          });
        },
        { timeout: IDLE_TIMEOUT_MS }
      );

      return (): void => {
        currentWindow.cancelIdleCallback?.(idleHandle);
      };
    }

    const timeoutHandle = window.setTimeout(() => {
      startTransition(() => {
        setShouldRender(true);
      });
    }, FALLBACK_DELAY_MS);

    return (): void => {
      window.clearTimeout(timeoutHandle);
    };
  }, []);

  return shouldRender;
}
