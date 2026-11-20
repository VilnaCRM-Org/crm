import { useCallback, useRef } from 'react';

import type { OnceCallback } from './types/use-once-callback';

export default function useOnceCallback(callback: OnceCallback): OnceCallback {
  const called = useRef(false);

  return useCallback(() => {
    if (called.current) return;

    called.current = true;
    callback();
  }, [callback]);
}
