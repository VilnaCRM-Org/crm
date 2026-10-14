import { useState } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router';

import type {
  ArrivalNotice,
  ArrivalNoticeSnapshot,
  RedirectNavigationState,
} from '@/routes/types/navigation-state';

export default function useArrivalNotice(): ArrivalNotice | null {
  const { key, state } = useLocation();
  const action = useNavigationType();
  const [arrival, setArrival] = useState<ArrivalNoticeSnapshot>(() => ({
    key,
    notice: (state as RedirectNavigationState | null)?.notice ?? null,
  }));

  if (key !== arrival.key) {
    setArrival({ key, notice: action === NavigationType.Replace ? arrival.notice : null });
  }

  return arrival.notice;
}
