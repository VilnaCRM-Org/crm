import { useRef, useState } from 'react';

import type { SocialBusy } from '../types/social-link/social-links';

async function heldFor<TOutcome>(
  work: Promise<TOutcome>,
  count: (change: number) => void
): Promise<TOutcome> {
  count(1);
  try {
    return await work;
  } finally {
    count(-1);
  }
}

export default function useSocialBusy(): SocialBusy {
  const [busy, setBusy] = useState(false);
  const holds = useRef(0);

  const count = (change: number): void => {
    holds.current += change;
    setBusy(holds.current > 0);
  };

  return {
    busy,
    hold: (work) => heldFor(work, count),
    isHeld: (): boolean => holds.current > 0,
  };
}
