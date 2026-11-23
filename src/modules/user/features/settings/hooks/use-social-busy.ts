import { useRef, useState } from 'react';

import type { SocialBusy } from '../types/social-link/social-links';

export default function useSocialBusy(): SocialBusy {
  const [busy, setBusy] = useState(false);
  const holds = useRef(0);

  const count = (change: number): void => {
    holds.current += change;
    setBusy(holds.current > 0);
  };
  const hold = async <TOutcome>(work: Promise<TOutcome>): Promise<TOutcome> => {
    count(1);
    const outcome = await work;
    count(-1);
    return outcome;
  };

  return { busy, hold, isHeld: (): boolean => holds.current > 0 };
}
