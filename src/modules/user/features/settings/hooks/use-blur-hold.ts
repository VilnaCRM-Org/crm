import { type FocusEvent, useEffect, useState } from 'react';

import type { BlurHold } from '../types/hooks/use-blur-hold';

export default function useBlurHold(delayMs: number): BlurHold {
  const [blurredAt, setBlurredAt] = useState<number | null>(null);

  useEffect(() => {
    if (blurredAt === null) return undefined;
    const timer = window.setTimeout(() => setBlurredAt(null), delayMs);
    return (): void => window.clearTimeout(timer);
  }, [blurredAt, delayMs]);

  return {
    held: blurredAt !== null,
    onBlur: (event: FocusEvent<HTMLElement>) => setBlurredAt(event.timeStamp),
  };
}
