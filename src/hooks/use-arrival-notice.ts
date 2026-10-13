import { useState } from 'react';
import { useLocation } from 'react-router';

import type { ArrivalNotice, RedirectNavigationState } from '@/routes/types/navigation-state';

export default function useArrivalNotice(): ArrivalNotice | null {
  const { state } = useLocation();
  const [notice] = useState(() => (state as RedirectNavigationState | null)?.notice ?? null);
  return notice;
}
