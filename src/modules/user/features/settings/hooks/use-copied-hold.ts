import { useEffect, useState } from 'react';

import copyLineTiming from '../components/two-factor-settings/copy-line-timing';
import type { CopiedHoldRequest } from '../types/hooks/copy-announcement';

export default function useCopiedHold({ status, message }: CopiedHoldRequest): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (status === 'idle') return undefined;
    setHeld(status === 'copied');
    const timer = setTimeout(() => setHeld(false), copyLineTiming.holdMs);
    return (): void => clearTimeout(timer);
  }, [status, message]);

  return held;
}
