import { useEffect, useState } from 'react';

import type { BlurHold } from '../types/hooks/use-blur-hold';

export default function useBlurHold(delayMs: number): BlurHold {
  const [blur, setBlur] = useState<symbol | null>(null);

  useEffect(() => {
    if (blur === null) return undefined;
    const timer = window.setTimeout(() => setBlur(null), delayMs);
    return (): void => window.clearTimeout(timer);
  }, [blur, delayMs]);

  return { held: blur !== null, onBlur: () => setBlur(Symbol()) };
}
