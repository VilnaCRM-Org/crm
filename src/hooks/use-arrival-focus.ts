import { type RefCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';

const focusOnArrival: RefCallback<HTMLElement> = (node) => {
  node?.focus();
};

export default function useArrivalFocus(): RefCallback<HTMLElement> | null {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as RedirectNavigationState | null;
  const focusMain = Boolean(state?.focusMain);

  useEffect(() => {
    if (!focusMain) return;

    navigate(location, { replace: true, state: { ...state, focusMain: false } });
  }, [focusMain, location, navigate, state]);

  return focusMain ? focusOnArrival : null;
}
